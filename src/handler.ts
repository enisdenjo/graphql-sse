/**
 *
 * handler
 *
 */

import {
  ExecutionArgs,
  getOperationAST,
  GraphQLSchema,
  OperationTypeNode,
  parse,
  validate as graphqlValidate,
  execute as graphqlExecute,
  subscribe as graphqlSubscribe,
  DocumentNode,
} from 'graphql';
import { isObject } from './utils';
import {
  ExecutionResult,
  ExecutionPatchResult,
  RequestParams,
  TOKEN_HEADER_KEY,
  TOKEN_QUERY_KEY,
  print,
  isAsyncGenerator,
  isAsyncIterable,
} from './common';

/**
 * The incoming request headers the implementing server should provide.
 *
 * @category Server
 */
export interface RequestHeaders {
  get: (key: string) => string | null | undefined;
}

/**
 * Server agnostic request interface containing the raw request
 * which is server dependant.
 *
 * @category Server
 */
export interface Request<Raw = unknown, Context = unknown> {
  readonly method: string;
  readonly url: string;
  readonly headers: RequestHeaders;
  /**
   * Parsed request body or a parser function.
   *
   * If the provided function throws, the error message "Unparsable JSON body" will
   * be in the erroneous response.
   */
  readonly body:
    | string
    | Record<PropertyKey, unknown>
    | null
    | (() =>
        | string
        | Record<PropertyKey, unknown>
        | null
        | Promise<string | Record<PropertyKey, unknown> | null>);
  /**
   * The raw request itself from the implementing server.
   */
  readonly raw: Raw;
  /**
   * Context value about the incoming request, you're free to pass any information here.
   *
   * Intentionally not readonly because you're free to mutate it whenever you want.
   */
  context: Context;
}

/**
 * The response headers that get returned from graphql-sse.
 *
 * @category Server
 */
export type ResponseHeaders = {
  accept?: string;
  allow?: string;
  'content-type'?: string;
} & Record<string, string>;

/**
 * Server agnostic response body returned from `graphql-sse` needing
 * to be coerced to the server implementation in use.
 *
 * When the body is a string, it is NOT a GraphQL response.
 *
 * @category Server
 */
export type ResponseBody = string | AsyncGenerator<string, void, undefined>;

/**
 * Server agnostic response options (ex. status and headers) returned from
 * `graphql-sse` needing to be coerced to the server implementation in use.
 *
 * @category Server
 */
export interface ResponseInit {
  readonly status: number;
  readonly statusText: string;
  readonly headers?: ResponseHeaders;
}

/**
 * Server agnostic response returned from `graphql-sse` containing the
 * body and init options needing to be coerced to the server implementation in use.
 *
 * @category Server
 */
export type Response = readonly [body: ResponseBody | null, init: ResponseInit];

/**
 * A concrete GraphQL execution context value type.
 *
 * Mainly used because TypeScript collapses unions
 * with `any` or `unknown` to `any` or `unknown`. So,
 * we use a custom type to allow definitions such as
 * the `context` server option.
 *
 * @category Server
 */
export type OperationContext =
  | Record<PropertyKey, unknown>
  | symbol
  | number
  | string
  | boolean
  | undefined
  | null;

/** @category Server */
export type OperationArgs<Context extends OperationContext = undefined> =
  ExecutionArgs & { contextValue: Context };

/** @category Server */
export type OperationResult =
  | Promise<
      | AsyncGenerator<ExecutionResult | ExecutionPatchResult>
      | AsyncIterable<ExecutionResult | ExecutionPatchResult>
      | ExecutionResult
    >
  | AsyncGenerator<ExecutionResult | ExecutionPatchResult>
  | AsyncIterable<ExecutionResult | ExecutionPatchResult>
  | ExecutionResult;

/** @category Server */
export interface HandlerOptions<
  RequestRaw = unknown,
  RequestContext = unknown,
  Context extends OperationContext = undefined,
> {
  /**
   * A custom GraphQL validate function allowing you to apply your
   * own validation rules.
   */
  validate?: typeof graphqlValidate;
  /**
   * Is the `execute` function from GraphQL which is
   * used to execute the query and mutation operations.
   */
  execute?: (args: OperationArgs<Context>) => OperationResult;
  /**
   * Is the `subscribe` function from GraphQL which is
   * used to execute the subscription operation.
   */
  subscribe?: (args: OperationArgs<Context>) => OperationResult;
  /**
   * The GraphQL schema on which the operations will
   * be executed and validated against.
   *
   * If a function is provided, it will be called on every
   * subscription request allowing you to manipulate schema
   * dynamically.
   *
   * If the schema is left undefined, you're trusted to
   * provide one in the returned `ExecutionArgs` from the
   * `onSubscribe` callback.
   */
  schema?:
    | GraphQLSchema
    | ((
        req: Request<RequestRaw, RequestContext>,
        args: Pick<
          OperationArgs<Context>,
          'contextValue' | 'operationName' | 'document' | 'variableValues'
        >,
      ) => Promise<GraphQLSchema> | GraphQLSchema);
  /**
   * Authenticate the client. Returning a string indicates that the client
   * is authenticated and the request is ready to be processed.
   *
   * A distinct token of type string must be supplied to enable the "single connection mode".
   *
   * Providing `null` as the token will completely disable the "single connection mode"
   * and all incoming requests will always use the "distinct connection mode".
   *
   * @default 'req.headers["x-graphql-event-stream-token"] || req.url.searchParams["token"] || generateRandomUUID()' // https://gist.github.com/jed/982883
   */
  authenticate?: (
    req: Request<RequestRaw, RequestContext>,
  ) =>
    | Promise<Response | string | undefined | null>
    | Response
    | string
    | undefined
    | null;
  /**
   * Called when a new event stream is connecting BEFORE it is accepted.
   * By accepted, its meant the server processed the request and responded
   * with a 200 (OK), alongside flushing the necessary event stream headers.
   */
  onConnect?: (
    req: Request<RequestRaw, RequestContext>,
  ) =>
    | Promise<Response | null | undefined | void>
    | Response
    | null
    | undefined
    | void;
  /**
   * A value which is provided to every resolver and holds
   * important contextual information like the currently
   * logged in user, or access to a database.
   *
   * Note that the context function is invoked on each operation only once.
   * Meaning, for subscriptions, only at the point of initialising the subscription;
   * not on every subscription event emission. Read more about the context lifecycle
   * in subscriptions here: https://github.com/graphql/graphql-js/issues/894.
   *
   * If you don't provide the context context field, but have a context - you're trusted to
   * provide one in `onSubscribe`.
   */
  context?:
    | Context
    | ((
        req: Request<RequestRaw, RequestContext>,
        params: RequestParams,
      ) => Promise<Context> | Context);
  /**
   * The subscribe callback executed right after processing the request
   * before proceeding with the GraphQL operation execution.
   *
   * If you return `ExecutionArgs` from the callback, it will be used instead of
   * trying to build one internally. In this case, you are responsible for providing
   * a ready set of arguments which will be directly plugged in the operation execution.
   *
   * Omitting the fields `contextValue` from the returned `ExecutionArgs` will use the
   * provided `context` option, if available.
   *
   * If you want to respond to the client with a custom status or body,
   * you should do so using the provided `res` argument which will stop
   * further execution.
   *
   * Useful for preparing the execution arguments following a custom logic. A typical
   * use-case is persisted queries. You can identify the query from the request parameters
   * and supply the appropriate GraphQL operation execution arguments.
   */
  onSubscribe?: (
    req: Request<RequestRaw, RequestContext>,
    params: RequestParams,
  ) =>
    | Promise<Response | OperationResult | OperationArgs<Context> | void>
    | Response
    | OperationResult
    | OperationArgs<Context>
    | void;
  /**
   * Executed after the operation call resolves. For streaming
   * operations, triggering this callback does not necessarily
   * mean that there is already a result available - it means
   * that the subscription process for the stream has resolved
   * and that the client is now subscribed.
   *
   * The `OperationResult` argument is the result of operation
   * execution. It can be an iterator or already a value.
   *
   * If you want the single result and the events from a streaming
   * operation, use the `onNext` callback.
   *
   * If `onSubscribe` returns an `OperationResult`, this hook
   * will NOT be called.
   */
  onOperation?: (
    ctx: Context,
    req: Request<RequestRaw, RequestContext>,
    args: ExecutionArgs,
    result: OperationResult,
  ) => Promise<OperationResult | void> | OperationResult | void;
  /**
   * Executed after an operation has emitted a result right before
   * that result has been sent to the client.
   *
   * Results from both single value and streaming operations will
   * invoke this callback.
   *
   * Use this callback if you want to format the execution result
   * before it reaches the client.
   *
   * @param req - Always the request that contains the GraphQL operation.
   */
  onNext?: (
    ctx: Context,
    req: Request<RequestRaw, RequestContext>,
    result: ExecutionResult | ExecutionPatchResult,
  ) =>
    | Promise<ExecutionResult | ExecutionPatchResult | void>
    | ExecutionResult
    | ExecutionPatchResult
    | void;
  /**
   * The complete callback is executed after the operation
   * has completed and the client has been notified.
   *
   * Since the library makes sure to complete streaming
   * operations even after an abrupt closure, this callback
   * will always be called.
   *
   * @param req - Always the request that contains the GraphQL operation.
   */
  onComplete?: (
    ctx: Context,
    req: Request<RequestRaw, RequestContext>,
  ) => Promise<void> | void;
}

/**
 * The ready-to-use handler. Simply plug it in your favourite fetch-enabled HTTP
 * framework and enjoy.
 *
 * Errors thrown from **any** of the provided options or callbacks (or even due to
 * library misuse or potential bugs) will reject the handler's promise. They are
 * considered internal errors and you should take care of them accordingly.
 *
 * @category Server
 */
export type Handler<RequestRaw = unknown, RequestContext = unknown> = (
  req: Request<RequestRaw, RequestContext>,
) => Promise<Response>;

/**
 * Makes a Protocol compliant HTTP GraphQL server handler. The handler can
 * be used with your favourite server library.
 *
 * Read more about the Protocol in the PROTOCOL.md documentation file.
 *
 * @category Server
 */
export function createHandler<
  RequestRaw = unknown,
  RequestContext = unknown,
  Context extends OperationContext = undefined,
>(
  options: HandlerOptions<RequestRaw, RequestContext, Context>,
): Handler<RequestRaw, RequestContext> {
  const {
    validate = graphqlValidate,
    execute = graphqlExecute,
    subscribe = graphqlSubscribe,
    schema,
    authenticate = function extractOrCreateStreamToken(req) {
      const headerToken = req.headers.get(TOKEN_HEADER_KEY);
      if (headerToken)
        return Array.isArray(headerToken) ? headerToken.join('') : headerToken;

      const urlToken = new URL(
        req.url ?? '',
        'http://localhost/',
      ).searchParams.get(TOKEN_QUERY_KEY);
      if (urlToken) return urlToken;

      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0,
          v = c == 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    },
    onConnect,
    context,
    onSubscribe,
    onOperation,
    onNext,
    onComplete,
  } = options;

  interface Stream {
    /**
     * Does the stream have an open connection to some client.
     */
    readonly open: boolean;
    /**
     * If the operation behind an ID is an `AsyncIterator` - the operation
     * is streaming; on the contrary, if the operation is `null` - it is simply
     * a reservation, meaning - the operation resolves to a single result or is still
     * pending/being prepared.
     */
    ops: Record<
      string,
      AsyncGenerator<unknown> | AsyncIterable<unknown> | null
    >;
    /**
     * Use this connection for streaming.
     */
    subscribe(): AsyncGenerator<string>;
    /**
     * Stream from provided execution result to used connection.
     */
    from(
      ctx: Context,
      req: Request<RequestRaw, RequestContext>,
      result:
        | AsyncGenerator<ExecutionResult | ExecutionPatchResult>
        | AsyncIterable<ExecutionResult | ExecutionPatchResult>
        | ExecutionResult
        | ExecutionPatchResult,
      opId: string | null,
    ): void;
  }
  const streams: Record<string, Stream> = {};
  function createStream(token: string | null): Stream {
    const ops: Record<
      string,
      AsyncGenerator<unknown> | AsyncIterable<unknown> | null
    > = {};

    let pinger: ReturnType<typeof setInterval>;
    const msgs = (() => {
      const pending: string[] = [];
      const deferred = {
        done: false,
        error: null as unknown,
        resolve: () => {
          // noop
        },
      };

      async function dispose() {
        clearInterval(pinger);

        // make room for another potential stream while this one is being disposed
        if (typeof token === 'string') delete streams[token];

        // complete all operations and flush messages queue before ending the stream
        for (const op of Object.values(ops)) {
          if (isAsyncGenerator(op)) {
            await op.return(undefined);
          }
        }
      }

      const iterator = (async function* iterator() {
        for (;;) {
          if (!pending.length) {
            // only wait if there are no pending messages available
            await new Promise<void>((resolve) => (deferred.resolve = resolve));
          }
          // first flush
          while (pending.length) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            yield pending.shift()!;
          }
          // then error
          if (deferred.error) {
            throw deferred.error;
          }
          // or complete
          if (deferred.done) {
            return;
          }
        }
      })();

      iterator.throw = async (err) => {
        if (!deferred.done) {
          deferred.done = true;
          deferred.error = err;
          deferred.resolve();
          await dispose();
        }
        return { done: true, value: undefined };
      };

      iterator.return = async () => {
        if (!deferred.done) {
          deferred.done = true;
          deferred.resolve();
          await dispose();
        }
        return { done: true, value: undefined };
      };

      return {
        next(msg: string) {
          pending.push(msg);
          deferred.resolve();
        },
        iterator,
      };
    })();

    let subscribed = false;
    return {
      get open() {
        return subscribed;
      },
      ops,
      subscribe() {
        subscribed = true;

        // write an empty message because some browsers (like Firefox and Safari)
        // dont accept the header flush
        msgs.next(':\n\n');

        // ping client every 12 seconds to keep the connection alive
        pinger = setInterval(() => msgs.next(':\n\n'), 12_000);

        return msgs.iterator;
      },
      from(ctx, req, result, opId) {
        (async () => {
          if (isAsyncIterable(result)) {
            /** multiple emitted results */
            for await (let part of result) {
              const maybeResult = await onNext?.(ctx, req, part);
              if (maybeResult) part = maybeResult;
              msgs.next(
                print({
                  event: 'next',
                  data: opId
                    ? {
                        id: opId,
                        payload: part,
                      }
                    : part,
                }),
              );
            }
          } else {
            /** single emitted result */
            const maybeResult = await onNext?.(ctx, req, result);
            if (maybeResult) result = maybeResult;
            msgs.next(
              print({
                event: 'next',
                data: opId
                  ? {
                      id: opId,
                      payload: result,
                    }
                  : result,
              }),
            );
          }

          msgs.next(
            print({
              event: 'complete',
              data: opId ? { id: opId } : null,
            }),
          );

          await onComplete?.(ctx, req);

          if (!opId) {
            // end on complete when no operation id is present
            // because distinct event streams are used for each operation
            await msgs.iterator.return();
          } else {
            delete ops[opId];
          }
        })().catch(msgs.iterator.throw);
      },
    };
  }

  async function prepare(
    req: Request<RequestRaw, RequestContext>,
    params: RequestParams,
  ): Promise<Response | { ctx: Context; perform: () => OperationResult }> {
    let args: OperationArgs<Context>;

    const onSubscribeResult = await onSubscribe?.(req, params);
    if (isResponse(onSubscribeResult)) return onSubscribeResult;
    else if (
      isExecutionResult(onSubscribeResult) ||
      isAsyncIterable(onSubscribeResult)
    )
      return {
        // even if the result is already available, use
        // context because onNext and onComplete needs it
        ctx: (typeof context === 'function'
          ? await context(req, params)
          : context) as Context,
        perform() {
          return onSubscribeResult;
        },
      };
    else if (onSubscribeResult) args = onSubscribeResult;
    else {
      // you either provide a schema dynamically through
      // `onSubscribe` or you set one up during the server setup
      if (!schema) throw new Error('The GraphQL schema is not provided');

      const { operationName, variables } = params;
      let query: DocumentNode;

      try {
        query = parse(params.query);
      } catch (err) {
        return [
          JSON.stringify({
            errors: [
              err instanceof Error
                ? {
                    message: err.message,
                    // TODO: stack might leak sensitive information
                    // stack: err.stack,
                  }
                : err,
            ],
          }),
          {
            status: 400,
            statusText: 'Bad Request',
            headers: { 'content-type': 'application/json; charset=utf-8' },
          },
        ];
      }

      const argsWithoutSchema = {
        operationName,
        document: query,
        variableValues: variables,
        contextValue: (typeof context === 'function'
          ? await context(req, params)
          : context) as Context,
      };
      args = {
        ...argsWithoutSchema,
        schema:
          typeof schema === 'function'
            ? await schema(req, argsWithoutSchema)
            : schema,
      };
    }

    let operation: OperationTypeNode;
    try {
      const ast = getOperationAST(args.document, args.operationName);
      if (!ast) throw null;
      operation = ast.operation;
    } catch {
      return [
        JSON.stringify({
          errors: [{ message: 'Unable to detect operation AST' }],
        }),
        {
          status: 400,
          statusText: 'Bad Request',
          headers: { 'content-type': 'application/json; charset=utf-8' },
        },
      ];
    }

    // mutations cannot happen over GETs as per the spec
    // Read more: https://github.com/graphql/graphql-over-http/blob/main/spec/GraphQLOverHTTP.md#get
    if (operation === 'mutation' && req.method === 'GET') {
      return [
        JSON.stringify({
          errors: [{ message: 'Cannot perform mutations over GET' }],
        }),
        {
          status: 405,
          statusText: 'Method Not Allowed',
          headers: {
            allow: 'POST',
            'content-type': 'application/json; charset=utf-8',
          },
        },
      ];
    }

    // we validate after injecting the context because the process of
    // reporting the validation errors might need the supplied context value
    const validationErrs = validate(args.schema, args.document);
    if (validationErrs.length) {
      if (req.headers.get('accept') === 'text/event-stream') {
        // accept the request and emit the validation error in event streams,
        // promoting graceful GraphQL error reporting
        // Read more: https://www.w3.org/TR/eventsource/#processing-model
        // Read more: https://github.com/graphql/graphql-over-http/blob/main/spec/GraphQLOverHTTP.md#document-validation
        return {
          ctx: args.contextValue,
          perform() {
            return { errors: validationErrs };
          },
        };
      }

      return [
        JSON.stringify({ errors: validationErrs }),
        {
          status: 400,
          statusText: 'Bad Request',
          headers: { 'content-type': 'application/json; charset=utf-8' },
        },
      ];
    }

    return {
      ctx: args.contextValue,
      async perform() {
        const result = await (operation === 'subscription'
          ? subscribe(args)
          : execute(args));
        const maybeResult = await onOperation?.(
          args.contextValue,
          req,
          args,
          result,
        );
        if (maybeResult) return maybeResult;
        return result;
      },
    };
  }

  return async function handler(req) {
    const token = await authenticate(req);
    if (isResponse(token)) return token;

    // TODO: make accept detection more resilient
    const accept = req.headers.get('accept') || '*/*';

    const stream = typeof token === 'string' ? streams[token] : null;

    if (accept === 'text/event-stream') {
      const maybeResponse = await onConnect?.(req);
      if (isResponse(maybeResponse)) return maybeResponse;

      // if event stream is not registered, process it directly.
      // this means that distinct connections are used for graphql operations
      if (!stream) {
        const paramsOrResponse = await parseReq(req);
        if (isResponse(paramsOrResponse)) return paramsOrResponse;
        const params = paramsOrResponse;

        const distinctStream = createStream(null);

        // reserve space for the operation
        distinctStream.ops[''] = null;

        const prepared = await prepare(req, params);
        if (isResponse(prepared)) return prepared;

        const result = await prepared.perform();
        if (isAsyncIterable(result)) distinctStream.ops[''] = result;

        distinctStream.from(prepared.ctx, req, result, null);
        return [
          distinctStream.subscribe(),
          {
            status: 200,
            statusText: 'OK',
            headers: {
              connection: 'keep-alive',
              'cache-control': 'no-cache',
              'content-encoding': 'none',
              'content-type': 'text/event-stream; charset=utf-8',
            },
          },
        ];
      }

      // open stream cant exist, only one per token is allowed
      if (stream.open) {
        return [
          JSON.stringify({ errors: [{ message: 'Stream already open' }] }),
          {
            status: 409,
            statusText: 'Conflict',
            headers: {
              'content-type': 'application/json; charset=utf-8',
            },
          },
        ];
      }

      return [
        stream.subscribe(),
        {
          status: 200,
          statusText: 'OK',
          headers: {
            connection: 'keep-alive',
            'cache-control': 'no-cache',
            'content-encoding': 'none',
            'content-type': 'text/event-stream; charset=utf-8',
          },
        },
      ];
    }

    // if there us no token supplied, exclusively use the "distinct connection mode"
    if (typeof token !== 'string') {
      return [null, { status: 404, statusText: 'Not Found' }];
    }

    // method PUT prepares a stream for future incoming connections
    if (req.method === 'PUT') {
      if (!['*/*', 'text/plain'].includes(accept)) {
        return [null, { status: 406, statusText: 'Not Acceptable' }];
      }

      // streams mustnt exist if putting new one
      if (stream) {
        return [
          JSON.stringify({
            errors: [{ message: 'Stream already registered' }],
          }),
          {
            status: 409,
            statusText: 'Conflict',
            headers: {
              'content-type': 'application/json; charset=utf-8',
            },
          },
        ];
      }

      streams[token] = createStream(token);

      return [
        token,
        {
          status: 201,
          statusText: 'Created',
          headers: {
            'content-type': 'text/plain; charset=utf-8',
          },
        },
      ];
    } else if (req.method === 'DELETE') {
      // method DELETE completes an existing operation streaming in streams

      // streams must exist when completing operations
      if (!stream) {
        return [
          JSON.stringify({
            errors: [{ message: 'Stream not found' }],
          }),
          {
            status: 404,
            statusText: 'Not Found',
            headers: {
              'content-type': 'application/json; charset=utf-8',
            },
          },
        ];
      }

      const opId = new URL(req.url ?? '', 'http://localhost/').searchParams.get(
        'operationId',
      );
      if (!opId) {
        return [
          JSON.stringify({
            errors: [{ message: 'Operation ID is missing' }],
          }),
          {
            status: 400,
            statusText: 'Bad Request',
            headers: {
              'content-type': 'application/json; charset=utf-8',
            },
          },
        ];
      }

      const op = stream.ops[opId];
      if (isAsyncGenerator(op)) op.return(undefined);
      delete stream.ops[opId]; // deleting the operation means no further activity should take place

      return [
        null,
        {
          status: 200,
          statusText: 'OK',
        },
      ];
    } else if (req.method !== 'GET' && req.method !== 'POST') {
      // only POSTs and GETs are accepted at this point
      return [
        null,
        {
          status: 405,
          statusText: 'Method Not Allowed',
          headers: {
            allow: 'GET, POST, PUT, DELETE',
          },
        },
      ];
    } else if (!stream) {
      // for all other requests, streams must exist to attach the result onto
      return [
        JSON.stringify({
          errors: [{ message: 'Stream not found' }],
        }),
        {
          status: 404,
          statusText: 'Not Found',
          headers: {
            'content-type': 'application/json; charset=utf-8',
          },
        },
      ];
    }

    if (!['*/*', 'application/*', 'application/json'].includes(accept)) {
      return [
        null,
        {
          status: 406,
          statusText: 'Not Acceptable',
        },
      ];
    }

    const paramsOrResponse = await parseReq(req);
    if (isResponse(paramsOrResponse)) return paramsOrResponse;
    const params = paramsOrResponse;

    const opId = String(params.extensions?.operationId ?? '');
    if (!opId) {
      return [
        JSON.stringify({
          errors: [{ message: 'Operation ID is missing' }],
        }),
        {
          status: 400,
          statusText: 'Bad Request',
          headers: {
            'content-type': 'application/json; charset=utf-8',
          },
        },
      ];
    }
    if (opId in stream.ops) {
      return [
        JSON.stringify({
          errors: [{ message: 'Operation with ID already exists' }],
        }),
        {
          status: 409,
          statusText: 'Conflict',
          headers: {
            'content-type': 'application/json; charset=utf-8',
          },
        },
      ];
    }

    // reserve space for the operation through ID
    stream.ops[opId] = null;

    const prepared = await prepare(req, params);
    if (isResponse(prepared)) return prepared;

    // operation might have completed before prepared
    if (!(opId in stream.ops)) {
      return [
        null,
        {
          status: 204,
          statusText: 'No Content',
        },
      ];
    }

    const result = await prepared.perform();

    // operation might have completed before performed
    if (!(opId in stream.ops)) {
      if (isAsyncGenerator(result)) result.return(undefined);
      if (!(opId in stream.ops)) {
        return [
          null,
          {
            status: 204,
            statusText: 'No Content',
          },
        ];
      }
    }

    if (isAsyncIterable(result)) stream.ops[opId] = result;

    // streaming to an empty reservation is ok (will be flushed on connect)
    stream.from(prepared.ctx, req, result, opId);

    return [null, { status: 202, statusText: 'Accepted' }];
  };
}

async function parseReq(
  req: Request<unknown, unknown>,
): Promise<Response | RequestParams> {
  const params: Partial<RequestParams> = {};
  try {
    switch (true) {
      case req.method === 'GET': {
        try {
          const [, search] = req.url.split('?');
          const searchParams = new URLSearchParams(search);
          params.operationName = searchParams.get('operationName') ?? undefined;
          params.query = searchParams.get('query') ?? undefined;
          const variables = searchParams.get('variables');
          if (variables) params.variables = JSON.parse(variables);
          const extensions = searchParams.get('extensions');
          if (extensions) params.extensions = JSON.parse(extensions);
        } catch {
          throw new Error('Unparsable URL');
        }
        break;
      }
      case req.method === 'POST' &&
        req.headers.get('content-type')?.includes('application/json'): {
        if (!req.body) {
          throw new Error('Missing body');
        }
        const body =
          typeof req.body === 'function' ? await req.body() : req.body;
        const data = typeof body === 'string' ? JSON.parse(body) : body;
        if (!isObject(data)) {
          throw new Error('JSON body must be an object');
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Any is ok because values will be checked below.
        params.operationName = data.operationName as any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Any is ok because values will be checked below.
        params.query = data.query as any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Any is ok because values will be checked below.
        params.variables = data.variables as any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Any is ok because values will be checked below.
        params.extensions = data.extensions as any;
        break;
      }
      default:
        return [
          null,
          {
            status: 415,
            statusText: 'Unsupported Media Type',
          },
        ];
    }

    if (params.query == null) throw new Error('Missing query');
    if (typeof params.query !== 'string') throw new Error('Invalid query');
    if (
      params.variables != null &&
      (typeof params.variables !== 'object' || Array.isArray(params.variables))
    ) {
      throw new Error('Invalid variables');
    }
    if (
      params.extensions != null &&
      (typeof params.extensions !== 'object' ||
        Array.isArray(params.extensions))
    ) {
      throw new Error('Invalid extensions');
    }

    // request parameters are checked and now complete
    return params as RequestParams;
  } catch (err) {
    return [
      JSON.stringify({
        errors: [
          err instanceof Error
            ? {
                message: err.message,
                // TODO: stack might leak sensitive information
                // stack: err.stack,
              }
            : err,
        ],
      }),
      {
        status: 400,
        statusText: 'Bad Request',
        headers: { 'content-type': 'application/json; charset=utf-8' },
      },
    ];
  }
}

function isResponse(val: unknown): val is Response {
  // TODO: comprehensive check
  return Array.isArray(val);
}

export function isExecutionResult(val: unknown): val is ExecutionResult {
  return (
    isObject(val) &&
    ('data' in val || ('data' in val && val.data == null && 'errors' in val))
  );
}
