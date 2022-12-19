import type { Request, Response } from 'express';
import {
  createHandler as createRawHandler,
  HandlerOptions,
  OperationContext,
} from '../handler';

/**
 * @category Server/express
 */
export interface RequestContext {
  res: Response;
}

/**
 * The ready-to-use handler for [express](https://expressjs.com).
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
 * import express from 'express';
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
 * @category Server/express
 */
export function createHandler<Context extends OperationContext = undefined>(
  options: HandlerOptions<Request, RequestContext, Context>,
): (req: Request, res: Response) => Promise<void> {
  const handler = createRawHandler(options);
  return async function handleRequest(req, res) {
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
      await new Promise<void>((resolve, reject) =>
        res.write(value, (err) => (err ? reject(err) : resolve())),
      );
    }
    res.off('close', body.return);
    return new Promise((resolve) => res.end(resolve));
  };
}
