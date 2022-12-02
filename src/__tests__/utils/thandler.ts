import { schema } from '../fixtures/simple';
import {
  createHandler,
  HandlerOptions,
  Request,
  Response,
} from '../../handler';

export interface THandler {
  handler(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    req?: {
      search?: URLSearchParams;
      headers?: Request['headers'];
      body?: Request['body'];
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
      return handler({
        method,
        url,
        headers: req?.headers || {},
        body: req?.body || null,
        raw: null,
        context: null,
      });
    },
  };
}
