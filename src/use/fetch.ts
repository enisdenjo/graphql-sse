import {
  createHandler as createRawHandler,
  HandlerOptions,
  OperationContext,
} from '../handler';

export interface FetchAPI {
  Response: typeof Response;
  ReadableStream: typeof ReadableStream;
  TextEncoder: typeof TextEncoder;
}

export function createHandler<Context extends OperationContext = undefined>(
  options: HandlerOptions<Context, FetchAPI, Request>,
  fetchApi: Partial<FetchAPI> = {},
): (req: Request) => Promise<Response> {
  const api: FetchAPI = {
    Response: fetchApi.Response || Response,
    TextEncoder: fetchApi.TextEncoder || TextEncoder,
    ReadableStream: fetchApi.ReadableStream || ReadableStream,
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
        await resp.return(e);
      },
    });
    return new api.Response(stream, init);
  };
}
