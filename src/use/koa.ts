import type {
  Middleware,
  ParameterizedContext,
  DefaultState,
  DefaultContext,
} from 'koa';
import type { IncomingMessage } from 'http';
import {
  createHandler as createRawHandler,
  HandlerOptions as RawHandlerOptions,
  OperationContext,
} from '../handler';

/**
 * Handler options when using the koa adapter.
 *
 * @category Server/koa
 */
export type HandlerOptions<
  Context extends OperationContext = undefined,
  KoaState = DefaultState,
  KoaContext = DefaultContext,
> = RawHandlerOptions<
  IncomingMessage,
  ParameterizedContext<KoaState, KoaContext>,
  Context
>;

type WithPossibleBody = { body?: string | Record<PropertyKey, unknown> };

/**
 * The ready-to-use handler for [Koa](https://expressjs.com).
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
 * ```js
 * import Koa from 'koa'; // yarn add koa
 * import mount from 'koa-mount'; // yarn add koa-mount
 * import { createHandler } from 'graphql-sse/lib/use/koa';
 * import { schema } from './my-graphql';
 *
 * const app = new Koa();
 * app.use(
 *   mount('/graphql/stream', async (ctx, next) => {
 *     try {
 *       await handler(ctx, next);
 *     } catch (err) {
 *       console.error(err);
 *       ctx.response.status = 500;
 *       ctx.response.message = 'Internal Server Error';
 *     }
 *   }),
 * );
 *
 * app.listen({ port: 4000 });
 * console.log('Listening to port 4000');
 * ```
 *
 * @category Server/koa
 */
export function createHandler<
  Context extends OperationContext = undefined,
  KoaState = DefaultState,
  KoaContext = DefaultContext,
>(
  options: HandlerOptions<Context, KoaState, KoaContext>,
): Middleware<KoaState, KoaContext> {
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
        // in case koa has a body parser
        const body =
          (ctx.request as WithPossibleBody).body ||
          (ctx.req as WithPossibleBody).body;
        if (body) {
          return body;
        }

        return new Promise<string>((resolve) => {
          let body = '';
          ctx.req.on('data', (chunk) => (body += chunk));
          ctx.req.on('end', () => resolve(body));
        });
      },
      raw: ctx.req,
      context: ctx,
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

    let responseClosed = false;
    const onClose = () => {
      responseClosed = true;
      body.return();
    };
    ctx.res.once('close', onClose);
    for await (const value of body) {
      const closed = await new Promise<boolean>((resolve) => {
        if (!ctx.res.writable || ctx.res.writableEnded || ctx.res.destroyed) {
          // response's close event might be late
          resolve(true);
        } else {
          // a write error means the client can no longer receive events,
          // treat it as a closed response instead of bubbling the error
          ctx.res.write(value, (err) => resolve(!!err));
        }
      });
      if (closed) {
        break;
      }
    }
    ctx.res.off('close', onClose);
    if (responseClosed || ctx.res.destroyed) return;

    return new Promise<void>((resolve) => {
      const done = () => {
        ctx.res.off('close', done);
        resolve();
      };
      ctx.res.once('close', done);
      ctx.res.end(done);
    });
  };
}
