import {
  createHandler as createRawHandler,
  HandlerOptions,
  OperationContext,
} from '../handler';

/**
 * @category Server/fetch
 */
export interface RequestContext {
  Response: typeof Response;
  ReadableStream: typeof ReadableStream;
  TextEncoder: typeof TextEncoder;
}

/**
 * The ready-to-use fetch handler. To be used with your favourite fetch
 * framework, in a lambda function, or have deploy to the edge.
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
 * import { createHandler } from 'graphql-sse/lib/use/fetch';
 * import { schema } from './my-graphql';
 *
 * const handler = createHandler({ schema });
 *
 * export async function fetch(req: Request): Promise<Response> {
 *   try {
 *     return await handler(req);
 *   } catch (err) {
 *     console.error(err);
 *     return new Response(null, { status: 500 });
 *   }
 * }
 * ```
 *
 * @category Server/fetch
 */
export function createHandler<Context extends OperationContext = undefined>(
  options: HandlerOptions<Request, RequestContext, Context>,
  reqCtx: Partial<RequestContext> = {},
): (req: Request) => Promise<Response> {
  const api: RequestContext = {
    Response: reqCtx.Response || Response,
    TextEncoder: reqCtx.TextEncoder || TextEncoder,
    ReadableStream: reqCtx.ReadableStream || ReadableStream,
  };

  const handler = createRawHandler(options);
  return async function handleRequest(req) {
    const [resp, init] = await handler({
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: () => req.text(),
      raw: req,
      context: api,
    });

    if (!resp || typeof resp === 'string') {
      return new api.Response(resp, init);
    }

    let cancelled = false;
    const enc = new api.TextEncoder();
    const stream = new api.ReadableStream({
      async pull(controller) {
        const { done, value } = await resp.next();
        if (value != null) {
          controller.enqueue(enc.encode(value));
        }
        if (done) {
          controller.close();
        }
      },
      async cancel(e) {
        cancelled = true;
        await resp.return(e);
      },
    });

    if (req.signal.aborted) {
      // TODO: can this check be before the readable stream is created?
      // it's possible that the request was aborted before listening
      resp.return(undefined);
    } else {
      // make sure to connect the signals as well
      req.signal.addEventListener('abort', () => {
        if (!cancelled) {
          resp.return();
        }
      });
    }

    return new api.Response(stream, init);
  };
}
