import { schema } from '../fixtures/simple';
import { HandlerOptions } from '../../handler';
import { createHandler, FetchAPI } from '../../use/fetch';

export interface TFetch {
  fetch: typeof fetch;
}

export function createTFetch(
  opts: Partial<HandlerOptions<Request, FetchAPI>> = {},
): TFetch {
  const handler = createHandler({
    schema,
    ...opts,
  });
  return {
    fetch: (...args) => handler(new Request(...args)),
  };
}
