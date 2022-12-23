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
 * @category Server/fetch
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
          const header = req.headers[key];
          return Array.isArray(header) ? header.join('\n') : header;
        },
      },
      body: () =>
        new Promise((resolve, reject) => {
          if (req.body) {
            // body was parsed by middleware
            return req.body;
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

    reply.raw.writeHead(init.status, init.statusText, init.headers);

    if (!body || typeof body === 'string') {
      return new Promise<void>((resolve) =>
        reply.raw.end(body, () => resolve()),
      );
    }

    reply.raw.once('close', body.return);
    for await (const value of body) {
      await new Promise<void>((resolve, reject) =>
        reply.raw.write(value, (err) => (err ? reject(err) : resolve())),
      );
    }
    reply.raw.off('close', body.return);
    return new Promise((resolve) => reply.raw.end(resolve));
  };
}
