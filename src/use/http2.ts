import type { Http2ServerRequest, Http2ServerResponse } from 'http2';
import {
  createHandler as createRawHandler,
  HandlerOptions,
  OperationContext,
} from '../handler';

/**
 * @category Server/http2
 */
export interface RequestContext {
  res: Http2ServerResponse;
}

/**
 * The ready-to-use handler. Simply plug it in your favourite HTTP framework
 * and enjoy.
 *
 * Beware that the handler resolves only after the whole operation completes.
 * - If query/mutation, waits for result
 * - If subscription, waits for complete
 *
 * Errors thrown from **any** of the provided options or callbacks (or even due to
 * library misuse or potential bugs) will reject the handler's promise. They are
 * considered internal errors and you should take care of them accordingly.
 *
 * For production environments, its recommended not to transmit the exact internal
 * error details to the client, but instead report to an error logging tool or simply
 * the console.
 *
 * ```ts
 * import http from 'http2';
 * import { createHandler } from 'graphql-sse/lib/use/http2';
 * import { schema } from './my-schema';
 *
 * const handler = createHandler({ schema });
 *
 * const server = http.createServer(async (req, res) => {
 *   try {
 *     await handler(req, res);
 *   } catch (err) {
 *     console.error(err);
 *     // or
 *     Sentry.captureException(err);
 *
 *     if (!res.headersSent) {
 *       // could happen that some hook throws
 *       // after the headers have been flushed
 *       res.writeHead(500, 'Internal Server Error').end();
 *     }
 *   }
 * });
 *
 * server.listen(4000);
 * console.log('Listening to port 4000');
 * ```
 *
 * @category Server/http2
 */
export function createHandler<Context extends OperationContext = undefined>(
  options: HandlerOptions<Http2ServerRequest, RequestContext, Context>,
): (req: Http2ServerRequest, res: Http2ServerResponse) => Promise<void> {
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
      return new Promise<void>((resolve) =>
        res.end(body || '', () => resolve()),
      );
    }

    res.once('close', body.return);
    for await (const value of body) {
      await new Promise<void>((resolve, reject) =>
        res.write(value, (err) => (err ? reject(err) : resolve())),
      );
    }
    res.off('close', body.return);
    return new Promise((resolve) => res.end(resolve));
  };
}
