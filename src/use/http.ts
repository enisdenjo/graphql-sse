import type { IncomingMessage, ServerResponse } from 'http';
import {
  createHandler as createRawHandler,
  HandlerOptions,
  OperationContext,
} from '../handler';

export interface RequestContext {
  res: ServerResponse;
}

export function createHandler<Context extends OperationContext = undefined>(
  options: HandlerOptions<IncomingMessage, RequestContext, Context>,
): (req: IncomingMessage, res: ServerResponse) => Promise<void> {
  const handler = createRawHandler(options);
  return async function handleRequest(req, res) {
    const [body, init] = await handler({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- The method will always be available with http requests.
      method: req.method!,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- The url will always be available with http requests.
      url: req.url!,
      headers: req.headers,
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
      await new Promise<void>((resolve, reject) =>
        res.write(value, (err) => (err ? reject(err) : resolve())),
      );
    }
    res.off('close', body.return);
    return new Promise((resolve) => res.end(resolve));
  };
}
