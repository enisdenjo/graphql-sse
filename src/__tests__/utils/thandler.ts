import { schema } from '../fixtures/simple';
import { createHandler, HandlerOptions, Response } from '../../handler';
import { isAsyncGenerator, RequestParams } from '../../common';

export interface THandler {
  handler(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    req?: {
      search?: URLSearchParams;
      headers?: Record<string, string>;
      body?: RequestParams;
    },
  ): Promise<Response>;
}

export function createTHandler(opts: Partial<HandlerOptions> = {}): THandler {
  const handler = createHandler({
    schema,
    ...opts,
  });

  return {
    handler: (method, req) => {
      let url = 'http://localhost';

      const search = req?.search?.toString();
      if (search) url += `?${search}`;

      const headers = {
        'content-type': req?.body
          ? 'application/json; charset=utf-8'
          : undefined,
        ...req?.headers,
      };

      const body = (req?.body as unknown as Record<string, string>) || null;

      return handler({
        method,
        url,
        headers,
        body,
        raw: null,
        context: null,
      });
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
