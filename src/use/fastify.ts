import type { FastifyRequest, FastifyReply } from 'fastify';
import {
  createHandler as createRawHandler,
  HandlerOptions as RawHandlerOptions,
  OperationContext,
} from '../handler';

/**
 * @category Server/fastify
 */
export interface RequestContext {
  reply: FastifyReply;
}

/**
 * @category Server/fastify
 */
export type HandlerOptions<Context extends OperationContext = undefined> =
  RawHandlerOptions<FastifyRequest, RequestContext, Context>;

/**
 * The ready-to-use handler for [fastify](https://www.fastify.io).
 *
 * Errors thrown from the provided options or callbacks (or even due to
 * library misuse or potential bugs) will reject the handler or bubble to the
 * returned iterator. They are considered internal errors and you should take care
 * of them accordingly.
 *
 * For production environments, its recommended not to transmit the exact internal
 * error details to the client, but instead report to an error logging tool or simply
 * the console.
 *
 * ```ts
 * import Fastify from 'fastify'; // yarn add fastify
 * import { createHandler } from 'graphql-sse/lib/use/fastify';
 *
 * const handler = createHandler({ schema });
 *
 * const fastify = Fastify();
 *
 * fastify.all('/graphql/stream', async (req, reply) => {
 *   try {
 *     await handler(req, reply);
 *   } catch (err) {
 *     console.error(err);
 *     reply.code(500).send();
 *   }
 * });
 *
 * fastify.listen({ port: 4000 });
 * console.log('Listening to port 4000');
 * ```
 *
 * @category Server/fastify
 */
export function createHandler<Context extends OperationContext = undefined>(
  options: HandlerOptions<Context>,
): (req: FastifyRequest, reply: FastifyReply) => Promise<void> {
  const handler = createRawHandler(options);
  return async function handleRequest(req, reply) {
    const [body, init] = await handler({
      method: req.method,
      url: req.url,
      headers: {
        get(key) {
          const header = reply.getHeader(key) ?? req.headers[key];
          return Array.isArray(header) ? header.join('\n') : String(header);
        },
      },
      body: () =>
        new Promise((resolve, reject) => {
          if (req.body) {
            // body was parsed by middleware
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- even if fastify incorrectly parsed the body, we cannot re-read it
            return resolve(req.body as any);
          }

          let body = '';
          req.raw.on('data', (chunk) => (body += chunk));
          req.raw.once('error', reject);
          req.raw.once('end', () => {
            req.raw.off('error', reject);
            resolve(body);
          });
        }),
      raw: req,
      context: { reply },
    });

    const middlewareHeaders: Record<string, string> = {};
    for (const [key, val] of Object.entries(reply.getHeaders())) {
      middlewareHeaders[key] = Array.isArray(val)
        ? val.join('\n')
        : String(val);
    }
    reply.raw.writeHead(init.status, init.statusText, {
      ...middlewareHeaders,
      ...init.headers,
    });

    if (!body || typeof body === 'string') {
      return new Promise<void>((resolve) =>
        reply.raw.end(body, () => resolve()),
      );
    }

    let responseClosed = false;
    const onClose = () => {
      responseClosed = true;
      body.return();
    };
    reply.raw.once('close', onClose);
    for await (const value of body) {
      const closed = await new Promise<boolean>((resolve) => {
        if (
          !reply.raw.writable ||
          reply.raw.writableEnded ||
          reply.raw.destroyed
        ) {
          // response's close event might be late
          resolve(true);
        } else {
          // a write error means the client can no longer receive events,
          // treat it as a closed response instead of bubbling the error
          reply.raw.write(value, (err) => resolve(!!err));
        }
      });
      if (closed) {
        break;
      }
    }
    reply.raw.off('close', onClose);
    if (responseClosed || reply.raw.destroyed) return;

    return new Promise<void>((resolve) => {
      const done = () => {
        reply.raw.off('close', done);
        resolve();
      };
      reply.raw.once('close', done);
      reply.raw.end(done);
    });
  };
}
