/**
 *
 * handler
 *
 */

import type { IncomingMessage, ServerResponse } from 'http';
import {
  DocumentNode,
  ExecutionArgs,
  ExecutionResult,
  getOperationAST,
  GraphQLError,
  GraphQLSchema,
  OperationTypeNode,
  parse,
  TypeInfo,
  ValidationRule,
  validate as graphqlValidate,
  execute as graphqlExecute,
  subscribe as graphqlSubscribe,
} from 'graphql';
import {
  RequestParams,
  StreamEvent,
  StreamData,
  StreamDataForID,
} from './common';

/**
 * A concrete GraphQL execution context value type.
 *
 * Mainly used because TypeScript collapes unions
 * with `any` or `unknown` to `any` or `unknown`. So,
 * we use a custom type to allow definitions such as
 * the `context` server option.
 *
 * @category Server
 */
export type ExecutionContext =
  // eslint-disable-next-line @typescript-eslint/ban-types
  | object // you can literally pass "any" JS object as the context value
  | symbol
  | number
  | string
  | boolean
  | undefined
  | null;

/** @category Server */
export type OperationResult =
  | Promise<AsyncIterableIterator<ExecutionResult> | ExecutionResult>
  | AsyncIterableIterator<ExecutionResult>
  | ExecutionResult;

/** @category Server */
export interface HandlerOptions {
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
        req: IncomingMessage,
        args: Omit<ExecutionArgs, 'schema'>,
      ) => Promise<GraphQLSchema> | GraphQLSchema);
  /**
   * A value which is provided to every resolver and holds
   * important contextual information like the currently
   * logged in user, or access to a database.
   *
   * Note that the context function is invoked on each operation only once.
   * Meaning, for subscriptions, only at the point of initialising the subscription;
   * not on every subscription event emission. Read more about the context lifecycle
   * in subscriptions here: https://github.com/graphql/graphql-js/issues/894.
   */
  context?:
    | ExecutionContext
    | ((
        req: IncomingMessage,
        args: ExecutionArgs,
      ) => Promise<ExecutionContext> | ExecutionContext);
  /**
   * A custom GraphQL validate function allowing you to apply your
   * own validation rules.
   */
  validate?: (
    schema: GraphQLSchema,
    documentAST: DocumentNode,
    rules?: ReadonlyArray<ValidationRule>,
    typeInfo?: TypeInfo,
    options?: { maxErrors?: number },
  ) => ReadonlyArray<GraphQLError>;
  /**
   * Is the `execute` function from GraphQL which is
   * used to execute the query and mutation operations.
   */
  execute?: (args: ExecutionArgs) => OperationResult;
  /**
   * Is the `subscribe` function from GraphQL which is
   * used to execute the subscription operation.
   */
  subscribe?: (args: ExecutionArgs) => OperationResult;
  /**
   * Authenticate the client. Returning a string indicates that the client
   * is authenticated and the request is ready to be processed.
   *
   * A token of type string MUST be supplied; if there is no token, you may
   * return an empty string (`''`);
   *
   * If you want to respond to the client with a custom status or body,
   * you should do so using the provided `res` argument which will stop
   * further execution.
   *
   * @default 'req.headers["x-graphql-stream-token"] || req.url.searchParams["token"] || generateRandomUUID()' // https://gist.github.com/jed/982883
   */
  authenticate?: (
    req: IncomingMessage,
    res: ServerResponse,
  ) => Promise<string | undefined | void> | string | undefined | void;
  /**
   * Called when a new event stream has connected right before it is
   * accepted.
   *
   * If you want to respond to the client with a custom status or body,
   * you should do so using the provided `res` argument which will stop
   * further execution.
   */
  onConnect?: (
    req: IncomingMessage,
    res: ServerResponse,
  ) => Promise<void> | void;
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
    req: IncomingMessage,
    res: ServerResponse,
    params: RequestParams,
  ) => Promise<ExecutionArgs | void> | ExecutionArgs | void;
  /**
   * Executed after the operation call resolves. For streaming
   * operations, triggering this callback does not necessarely
   * mean that there is already a result available - it means
   * that the subscription process for the stream has resolved
   * and that the client is now subscribed.
   *
   * The `OperationResult` argument is the result of operation
   * execution. It can be an iterator or already a value.
   *
   * Use this callback to listen for GraphQL operations and
   * execution result manipulation.
   *
   * If you want to respond to the client with a custom status or body,
   * you should do so using the provided `res` argument which will stop
   * further execution.
   *
   * First argument, the request, is always the GraphQL operation
   * request.
   */
  onOperation?: (
    req: IncomingMessage,
    res: ServerResponse,
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
   * First argument, the request, is always the GraphQL operation
   * request.
   */
  onNext?: (
    req: IncomingMessage,
    args: ExecutionArgs,
    result: ExecutionResult,
  ) => Promise<ExecutionResult | void> | ExecutionResult | void;
  /**
   * The complete callback is executed after the operation
   * has completed and the client has been notified.
   *
   * Since the library makes sure to complete streaming
   * operations even after an abrupt closure, this callback
   * will always be called.
   *
   * First argument, the request, is always the GraphQL operation
   * request.
   */
  onComplete?: (
    req: IncomingMessage,
    args: ExecutionArgs,
  ) => Promise<void> | void;
  /**
   * Called when an event stream has disconnected right before the
   * accepting the stream.
   */
  onDisconnect?: (req: IncomingMessage) => Promise<void> | void;
}

/**
 * The ready-to-use handler. Simply plug it in your favourite HTTP framework
 * and enjoy.
 *
 * Beware that the handler resolves only after the whole operation completes.
 * - If query/mutation, waits for result
 * - If subscription, waits for complete
 *
 * Errors thrown from **any** of the provided options or callbacks (or even due to
 * library misuse or potential bugs) will reject the handler's promise. They are
 * considered internal errors and you should take care of them accordingly.
 *
 * For production environments, its recommended not to transmit the exact internal
 * error details to the client, but instead report to an error logging tool or simply
 * the console. Roughly:
 *
 * ```ts
 * import http from 'http';
 * import { createHandler } from 'graphql-sse';
 *
 * const handler = createHandler({ ... });
 *
 * http.createServer(async (req, res) => {
 *   try {
 *     await handler(req, res);
 *   } catch (err) {
 *     console.error(err);
 *     // or
 *     Sentry.captureException(err);
 *
 *     res.writeHead(500, 'Internal Server Error').end();
 *   }
 * });
 * ```
 *
 * @category Server
 */
export type Handler = (
  req: IncomingMessage,
  res: ServerResponse,
) => Promise<void>;

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
  ops: Record<string, AsyncIterator<unknown> | null>;
  /**
   * Use this connection for streaming.
   */
  use(req: IncomingMessage, res: ServerResponse): Promise<void>;
  /**
   * Stream from provided execution result to used connection.
   */
  from(
    operationReq: IncomingMessage, // holding the operation request (not necessarily the event stream)
    args: ExecutionArgs,
    result: AsyncIterableIterator<ExecutionResult> | ExecutionResult,
    opId?: string,
  ): Promise<void>;
}

/**
 * Makes a Protocol complient HTTP GraphQL server  handler. The handler can
 * be used with your favourite server library.
 *
 * Read more about the Protocol in the PROTOCOL.md documentation file.
 *
 * @category Server
 */
export function createHandler(options: HandlerOptions): Handler {
  const {
    schema,
    context,
    validate = graphqlValidate,
    execute = graphqlExecute,
    subscribe = graphqlSubscribe,
    authenticate = function extractOrCreateStreamToken(req) {
      const headerToken = req.headers['x-graphql-stream-token'];
      if (headerToken)
        return Array.isArray(headerToken) ? headerToken.join('') : headerToken;

      const urlToken = new URL(
        req.url ?? '',
        'http://localhost/',
      ).searchParams.get('token');
      if (urlToken) return urlToken;

      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0,
          v = c == 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    },
    onConnect,
    onSubscribe,
    onOperation,
    onNext,
    onComplete,
    onDisconnect,
  } = options;

  const streams: Record<string, Stream> = {};

  function createStream(token: string | null): Stream {
    let request: IncomingMessage | null = null,
      response: ServerResponse | null = null,
      pinger: ReturnType<typeof setInterval>,
      disposed = false;
    const pendingMsgs: string[] = [];
    const ops: Record<string, AsyncIterator<unknown> | null> = {};

    function write(msg: unknown) {
      return new Promise<boolean>((resolve, reject) => {
        if (disposed || !response || !response.writable) return resolve(false);
        response.write(msg, (err) => {
          if (err) return reject(err);
          resolve(true);
        });
      });
    }

    async function emit<E extends StreamEvent>(
      event: E,
      data: StreamData<E> | StreamDataForID<E>,
    ): Promise<void> {
      let msg = `event: ${event}`;
      if (data) msg += `\ndata: ${JSON.stringify(data)}`;
      msg += '\n\n';

      const wrote = await write(msg);
      if (!wrote) pendingMsgs.push(msg);
    }

    async function dispose() {
      if (disposed) return;
      disposed = true;

      // make room for another potential stream while this one is being disposed
      if (typeof token === 'string') delete streams[token];

      // complete all operations and flush messages queue before ending the stream
      for (const op of Object.values(ops)) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        await op?.return!(); // iterator must implement the return method
      }
      while (pendingMsgs.length) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const msg = pendingMsgs.shift()!;
        await write(msg);
      }

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      response!.end(); // response must exist at this point
      response = null;
      clearInterval(pinger);

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      onDisconnect?.(request!); // request must exist at this point
      request = null;
    }

    return {
      get open() {
        return disposed || Boolean(response);
      },
      ops,
      async use(req, res) {
        request = req;
        response = res;

        req.socket.setTimeout(0);
        req.socket.setNoDelay(true);
        req.socket.setKeepAlive(true);

        res.once('close', dispose);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('X-Accel-Buffering', 'no');
        if (req.httpVersionMajor < 2) res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        // write an empty message because some browsers (like Firefox and Safari)
        // dont accept the header flush
        await write(':\n\n');

        // ping client every 12 seconds to keep the connection alive
        pinger = setInterval(() => write(':\n\n'), 12_000);

        while (pendingMsgs.length) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const msg = pendingMsgs.shift()!;
          const wrote = await write(msg);
          if (!wrote) throw new Error('Unable to flush messages');
        }
      },
      async from(operationReq, args, result, opId) {
        if (isAsyncIterable(result)) {
          /** multiple emitted results */
          for await (let part of result) {
            const maybeResult = await onNext?.(operationReq, args, part);
            if (maybeResult) part = maybeResult;

            await emit(
              'next',
              opId
                ? {
                    id: opId,
                    payload: part,
                  }
                : part,
            );
          }
        } else {
          /** single emitted result */
          const maybeResult = await onNext?.(operationReq, args, result);
          if (maybeResult) result = maybeResult;

          await emit(
            'next',
            opId
              ? {
                  id: opId,
                  payload: result,
                }
              : result,
          );
        }

        await emit('complete', opId ? { id: opId } : null);

        // end on complete when no operation id is present
        // because distinct event streams are used for each operation
        if (!opId) await dispose();
        else delete ops[opId];

        await onComplete?.(operationReq, args);
      },
    };
  }

  async function prepare(
    req: IncomingMessage,
    res: ServerResponse,
    params: RequestParams,
  ): Promise<[args: ExecutionArgs, perform: () => OperationResult] | void> {
    let args: ExecutionArgs, operation: OperationTypeNode;

    const maybeExecArgs = await onSubscribe?.(req, res, params);
    if (maybeExecArgs) args = maybeExecArgs;
    else {
      // you either provide a schema dynamically through
      // `onSubscribe` or you set one up during the server setup
      if (!schema) throw new Error('The GraphQL schema is not provided');

      const { operationName, variables } = params;
      let { query } = params;

      if (typeof query === 'string') {
        try {
          query = parse(query);
        } catch {
          return res.writeHead(400, 'GraphQL query syntax error').end();
        }
      }

      const argsWithoutSchema = {
        operationName,
        document: query,
        variableValues: variables,
      };
      args = {
        ...argsWithoutSchema,
        schema:
          typeof schema === 'function'
            ? await schema(req, argsWithoutSchema)
            : schema,
      };
    }

    try {
      const ast = getOperationAST(args.document, args.operationName);
      if (!ast) throw null;
      operation = ast.operation;
    } catch {
      return res.writeHead(400, 'Unable to detect operation AST').end();
    }

    // mutations cannot happen over GETs as per the spec
    // Read more: https://github.com/graphql/graphql-over-http/blob/main/spec/GraphQLOverHTTP.md#get
    if (operation === 'mutation' && req.method === 'GET')
      return res
        .writeHead(405, 'Cannot perform mutations over GET', {
          Allow: 'POST',
        })
        .end();

    if (!('contextValue' in args))
      args.contextValue =
        typeof context === 'function' ? await context(req, args) : context;

    // we validate after injecting the context because the process of
    // reporting the validation errors might need the supplied context value
    const validationErrs = validate(args.schema, args.document);
    if (validationErrs.length) {
      if (req.headers.accept === 'text/event-stream') {
        // accept the request and emit the validation error in event streams,
        // promoting graceful GraphQL error reporting
        // Read more: https://www.w3.org/TR/eventsource/#processing-model
        // Read more: https://github.com/graphql/graphql-over-http/blob/main/spec/GraphQLOverHTTP.md#document-validation
        return [
          args,
          function perform() {
            return { errors: validationErrs };
          },
        ];
      }

      res
        .writeHead(400, {
          'Content-Type':
            req.headers.accept === 'application/json'
              ? 'application/json; charset=utf-8'
              : 'application/graphql+json; charset=utf-8',
        })
        .write(JSON.stringify({ errors: validationErrs }));
      return res.end();
    }

    return [
      args,
      async function perform() {
        let result;
        result = operation === 'subscription' ? subscribe(args) : execute(args);

        const maybeResult = await onOperation?.(req, res, args, result);
        if (maybeResult) result = maybeResult;

        return result;
      },
    ];
  }

  return async function handler(req: IncomingMessage, res: ServerResponse) {
    // authenticate first and acquire unique identification token
    const token = await authenticate(req, res);
    if (res.writableEnded) return;
    if (typeof token !== 'string') throw new Error('Token was not supplied');

    const accept = req.headers.accept ?? '*/*';

    const stream = streams[token];

    if (accept === 'text/event-stream') {
      // if event stream is not registered, process it directly.
      // this means that distinct event streams are used for
      // graphql operations
      if (!stream) {
        let params;
        try {
          params = await parseReq(req);
        } catch (err) {
          return res.writeHead(400, err.message).end();
        }

        const distinctStream = createStream(null);

        // reserve space for the operation
        distinctStream.ops[''] = null;

        const prepared = await prepare(req, res, params);
        if (res.writableEnded) return;
        if (!prepared)
          throw new Error(
            "Operation preparation didn't respond, yet it was not prepared",
          );
        const [args, perform] = prepared;

        const result = await perform();
        if (res.writableEnded) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          if (isAsyncIterable(result)) result.return!(); // iterator must implement the return method
          return; // `onOperation` responded
        }

        if (isAsyncIterable(result)) distinctStream.ops[''] = result;

        await onConnect?.(req, res);
        if (res.writableEnded) return;
        await distinctStream.use(req, res);
        await distinctStream.from(req, args, result);
        return;
      }

      // open stream cant exist, only one per token is allowed
      if (stream.open) return res.writeHead(409, 'Stream already open').end();

      await onConnect?.(req, res);
      if (res.writableEnded) return;
      await stream.use(req, res);
      return;
    }

    if (req.method === 'PUT') {
      // method PUT prepares a stream for future incoming connections.

      if (!['*/*', 'text/plain'].includes(accept))
        return res.writeHead(406).end();

      // streams mustnt exist if putting new one
      if (stream) return res.writeHead(409, 'Stream already registered').end();

      streams[token] = createStream(token);
      res
        .writeHead(201, { 'Content-Type': 'text/plain; charset=utf-8' })
        .write(token);
      return res.end();
    } else if (req.method === 'DELETE') {
      // method DELETE completes an existing operation streaming in streams

      // streams must exist when completing operations
      if (!stream) return res.writeHead(404, 'Stream not found').end();

      const opId = new URL(req.url ?? '', 'http://localhost/').searchParams.get(
        'operationId',
      );
      if (!opId) return res.writeHead(400, 'Operation ID is missing').end();

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      stream.ops[opId]?.return!(); // iterator must implement the return method
      delete stream.ops[opId]; // deleting the operation means no further activity should take place

      return res.writeHead(200).end();
    } else if (req.method !== 'GET' && req.method !== 'POST')
      // only POSTs and GETs are accepted at this point
      return res
        .writeHead(405, undefined, { Allow: 'GET, POST, PUT, DELETE' })
        .end();
    else if (!stream)
      // for all other requests, streams must exist to attach the result onto
      return res.writeHead(404, 'Stream not found').end();

    if (
      !['*/*', 'application/graphql+json', 'application/json'].includes(accept)
    )
      return res.writeHead(406).end();

    let params;
    try {
      params = await parseReq(req);
    } catch (err) {
      return res.writeHead(400, err.message).end();
    }

    const opId = String(params.extensions?.operationId ?? '');
    if (!opId) return res.writeHead(400, 'Operation ID is missing').end();
    if (opId in stream.ops)
      return res.writeHead(409, 'Operation with ID already exists').end();
    // reserve space for the operation through ID
    stream.ops[opId] = null;

    const prepared = await prepare(req, res, params);
    if (res.writableEnded) return;
    if (!prepared)
      throw new Error(
        "Operation preparation didn't respond, yet it was not prepared",
      );
    const [args, perform] = prepared;

    // operation might have completed before prepared
    if (!(opId in stream.ops)) return res.writeHead(204).end();

    const result = await perform();
    if (res.writableEnded) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      if (isAsyncIterable(result)) result.return!(); // iterator must implement the return method
      delete stream.ops[opId];
      return; // `onOperation` responded
    }

    // operation might have completed before performed
    if (!(opId in stream.ops)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      if (isAsyncIterable(result)) result.return!(); // iterator must implement the return method
      return res.writeHead(204).end();
    }

    if (isAsyncIterable(result)) stream.ops[opId] = result;

    res.writeHead(202).end();

    // streaming to an empty reservation is ok (will be flushed on connect)
    await stream.from(req, args, result, opId);
  };
}

async function parseReq(req: IncomingMessage): Promise<RequestParams> {
  const params: Partial<RequestParams> = {};

  if (req.method === 'GET') {
    await new Promise<void>((resolve, reject) => {
      try {
        const url = new URL(req.url ?? '', 'http://localhost/');
        params.operationName =
          url.searchParams.get('operationName') ?? undefined;
        params.query = url.searchParams.get('query') ?? undefined;
        const variables = url.searchParams.get('variables');
        if (variables) params.variables = JSON.parse(variables);
        const extensions = url.searchParams.get('extensions');
        if (extensions) params.extensions = JSON.parse(extensions);
        resolve();
      } catch {
        reject(new Error('Unparsable URL'));
      }
    });
  } else if (req.method === 'POST') {
    await new Promise<void>((resolve, reject) => {
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          params.operationName = data.operationName;
          params.query = data.query;
          params.variables = data.variables;
          params.extensions = data.extensions;
          resolve();
        } catch {
          reject(new Error('Unparsable body'));
        }
      });
    });
  } else throw new Error(`Unsupported method ${req.method}`); // should never happen

  if (!params.query) throw new Error('Missing query');
  if (params.variables && typeof params.variables !== 'object')
    throw new Error('Invalid variables');
  if (params.extensions && typeof params.extensions !== 'object')
    throw new Error('Invalid extensions');

  return params as RequestParams;
}

function isAsyncIterable<T = unknown>(
  val: unknown,
): val is AsyncIterableIterator<T> {
  return typeof Object(val)[Symbol.asyncIterator] === 'function';
}
