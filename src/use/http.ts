import type { IncomingMessage, ServerResponse } from 'http';
import {
  createHandler as createRawHandler,
  HandlerOptions as RawHandlerOptions,
  OperationContext,
} from '../handler';

/**
 * @category Server/http
 */
export interface RequestContext {
  res: ServerResponse;
}

/**
 * @category Server/fetch
 */
export type HandlerOptions<Context extends OperationContext = undefined> =
  RawHandlerOptions<IncomingMessage, RequestContext, Context>;

/**
 * The ready-to-use handler for Node's [http](https://nodejs.org/api/http.html).
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
 * import http from 'http';
 * import { createHandler } from 'graphql-sse/lib/use/http';
 * import { schema } from './my-graphql';
 *
 * const handler = createHandler({ schema });
 *
 * const server = http.createServer(async (req, res) => {
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
 * @category Server/http
 */
export function createHandler<Context extends OperationContext = undefined>(
  options: HandlerOptions<Context>,
): (req: IncomingMessage, res: ServerResponse) => Promise<void> {
  const handler = createRawHandler(options);
  return async function handleRequest(req, res) {
    const [body, init] = await handler({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- The method will always be available with http requests.
      method: req.method!,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- The url will always be available with http requests.
      url: req.url!,
      headers: {
        get(key) {
          const header = req.headers[key];
          return Array.isArray(header) ? header.join('\n') : header;
        },
      },
      body: () =>
        new Promise((resolve, reject) => {
          let body = '';
          req.on('data', (chunk) => (body += chunk));
          req.once('error', reject);
          req.once('end', () => {
            req.off('error', reject);
            resolve(body);
          });
        }),
      raw: req,
      context: { res },
    });

    res.writeHead(init.status, init.statusText, init.headers);

    if (!body || typeof body === 'string') {
      return new Promise<void>((resolve) => res.end(body, () => resolve()));
    }

    res.once('close', body.return);
    for await (const value of body) {
      const closed = await new Promise((resolve, reject) => {
        if (res.closed) {
          // response's close event might be late
          resolve(true);
        } else {
          res.write(value, (err) => (err ? reject(err) : resolve(false)));
        }
      });
      if (closed) {
        break;
      }
    }
    res.off('close', body.return);
    return new Promise((resolve) => res.end(resolve));
  };
}
