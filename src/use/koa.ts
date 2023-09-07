import type { Middleware, Response } from 'koa';
import type { IncomingMessage } from 'http';
import {
  createHandler as createRawHandler,
  HandlerOptions as RawHandlerOptions,
  OperationContext,
} from '../handler';

/**
 * @category Server/koa
 */
export interface RequestContext {
  res: Response;
}

/**
 * Handler options when using the koa adapter.
 *
 * @category Server/koa
 */
export type HandlerOptions<Context extends OperationContext = undefined> =
  RawHandlerOptions<IncomingMessage, RequestContext, Context>;

/**
 * The ready-to-use handler for [express](https://expressjs.com).
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
 * import express from 'express'; // yarn add express
 * import { createHandler } from 'graphql-sse/lib/use/express';
 * import { schema } from './my-graphql';
 *
 * const handler = createHandler({ schema });
 *
 * const app = express();
 *
 * app.use('/graphql/stream', async (req, res) => {
 *   try {
 *     await handler(req, res);
 *   } catch (err) {
 *     console.error(err);
 *     res.writeHead(500).end();
 *   }
 * });
 *
 * server.listen(4000);
 * console.log('Listening to port 4000');
 * ```
 *
 * @category Server/koa
 */
export function createHandler<Context extends OperationContext = undefined>(
  options: HandlerOptions<Context>,
): Middleware {
  const handler = createRawHandler(options);
  return async function requestListener(ctx) {
    const [body, init] = await handler({
      url: ctx.url,
      method: ctx.method,
      headers: {
        get(key) {
          const header = ctx.headers[key];
          return Array.isArray(header) ? header.join('\n') : header;
        },
      },
      body: () => {
        if (ctx.body) {
          // in case koa has a body parser
          return ctx.body;
        }
        return new Promise<string>((resolve) => {
          let body = '';
          ctx.req.on('data', (chunk) => (body += chunk));
          ctx.req.on('end', () => resolve(body));
        });
      },
      raw: ctx.req,
      context: { res: ctx.response },
    });
    ctx.response.status = init.status;
    ctx.response.message = init.statusText;
    if (init.headers) {
      for (const [name, value] of Object.entries(init.headers)) {
        ctx.response.set(name, value);
      }
    }

    if (!body || typeof body === 'string') {
      ctx.body = body;
      return;
    }

    ctx.res.once('close', body.return);
    for await (const value of body) {
      const closed = await new Promise((resolve, reject) => {
        if (!ctx.res.writable) {
          // response's close event might be late
          resolve(true);
        } else {
          ctx.res.write(value, (err) => (err ? reject(err) : resolve(false)));
        }
      });
      if (closed) {
        break;
      }
    }
    ctx.res.off('close', body.return);
    return new Promise((resolve) => ctx.res.end(resolve));
  };
}
