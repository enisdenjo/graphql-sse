import { schema } from '../fixtures/simple';
import {
  createHandler,
  HandlerOptions,
  Response,
  Request,
} from '../../src/handler';
import { isAsyncGenerator, RequestParams } from '../../src/common';
import { TestKit, injectTestKit, queue } from './testkit';

export interface THandler extends TestKit {
  handler(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    req?: {
      search?: URLSearchParams;
      headers?: Record<string, string>;
      body?: RequestParams;
    },
  ): Promise<Response>;
  waitForRequest(): Promise<Request>;
}

export function createTHandler(opts: Partial<HandlerOptions> = {}): THandler {
  const testkit = injectTestKit(opts);
  const onRequest = queue<Request>();
  const handler = createHandler({
    schema,
    ...opts,
  });
  return {
    ...testkit,
    handler: (method, treq) => {
      let url = 'http://localhost';

      const search = treq?.search?.toString();
      if (search) url += `?${search}`;

      const headers: Record<string, string | undefined> = {
        'content-type': treq?.body
          ? 'application/json; charset=utf-8'
          : undefined,
        ...treq?.headers,
      };

      const body = (treq?.body as unknown as Record<string, string>) || null;

      const req = {
        method,
        url,
        headers: {
          get(key: string) {
            return headers[key] || null;
          },
        },
        body,
        raw: null,
        context: null,
      };
      onRequest.add(req);
      return handler(req);
    },
    waitForRequest() {
      return onRequest.next();
    },
  };
}

export function assertString(val: unknown): asserts val is string {
  if (typeof val !== 'string') {
    throw new Error(
      `Expected val to be a "string", got "${JSON.stringify(val)}"`,
    );
  }
}

export function assertAsyncGenerator(
  val: unknown,
): asserts val is AsyncGenerator<string> {
  if (!isAsyncGenerator(val)) {
    throw new Error(
      `Expected val to be an "AsyncGenerator<string>", got "${JSON.stringify(
        val,
      )}"`,
    );
  }
}
