import { schema } from '../fixtures/simple';
import { HandlerOptions } from '../../handler';
import { createHandler, FetchAPI } from '../../use/fetch';

export interface TFetch {
  fetch: typeof fetch;
  dispose(): void;
}

export function createTFetch(
  opts: Partial<HandlerOptions<Request, FetchAPI>> = {},
): TFetch {
  const handler = createHandler({
    schema,
    ...opts,
  });
  const ctrls: AbortController[] = [];
  return {
    fetch: (input, init) => {
      const ctrl = new AbortController();
      ctrls.push(ctrl);
      init?.signal?.addEventListener('abort', () => ctrl.abort());
      return handler(
        new Request(input, {
          ...init,
          signal: ctrl.signal,
        }),
      );
    },
    dispose() {
      // dispose in next tick to allow fetches to complete
      setTimeout(() => {
        ctrls.forEach((ctrl) => ctrl.abort());
      }, 0);
    },
  };
}
