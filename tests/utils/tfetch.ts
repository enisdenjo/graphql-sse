import { schema } from '../fixtures/simple';
import { HandlerOptions } from '../../src/handler';
import { createHandler, RequestContext } from '../../src/use/fetch';
import { injectTestKit, queue, TestKit } from './testkit';

export interface TFetch extends TestKit<Request, RequestContext> {
  fetch(input: RequestInfo, init?: RequestInit): Promise<Response>;
  waitForRequest(): Promise<Request>;
  dispose(): Promise<void>;
}

export function createTFetch(
  opts: Partial<HandlerOptions<Request, RequestContext>> = {},
): TFetch {
  const testkit = injectTestKit(opts);
  const onRequest = queue<Request>();
  const handler = createHandler({
    schema,
    ...opts,
  });
  const ctrls: AbortController[] = [];
  return {
    ...testkit,
    fetch: (input, init) => {
      const ctrl = new AbortController();
      ctrls.push(ctrl);
      init?.signal?.addEventListener('abort', () => ctrl.abort());
      const req = new Request(input, {
        ...init,
        signal: ctrl.signal,
      });
      onRequest.add(req);
      return handler(req);
    },
    waitForRequest() {
      return onRequest.next();
    },
    async dispose() {
      return new Promise((resolve) => {
        // dispose in next tick to allow pending fetches to complete
        setTimeout(() => {
          ctrls.forEach((ctrl) => ctrl.abort());
          // finally resolve in next tick to flush the aborts
          setTimeout(resolve, 0);
        }, 0);
      });
    },
  };
}
