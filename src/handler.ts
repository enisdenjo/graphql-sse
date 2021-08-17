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
export type GraphQLExecutionContextValue =
  // eslint-disable-next-line @typescript-eslint/ban-types
  | object // you can literally pass "any" JS object as the context value
  | symbol
  | number
  | string
  | boolean
  | undefined
  | null;

export type OperationResult =
  | Promise<AsyncIterableIterator<ExecutionResult> | ExecutionResult>
  | AsyncIterableIterator<ExecutionResult>
  | ExecutionResult;

export interface HandlerOptions {
  /**
   * The GraphQL schema on which the operations
   * will be executed and validated against.
   */
  schema:
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
    | GraphQLExecutionContextValue
    | ((
        req: IncomingMessage,
        args: ExecutionArgs,
      ) =>
        | Promise<GraphQLExecutionContextValue>
        | GraphQLExecutionContextValue);
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
   * Called when a new event stream has connected right before the
   * accepting the stream.
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
   */
  onOperation?: (
    req: IncomingMessage,
    res: ServerResponse,
    args: ExecutionArgs,
    result: OperationResult,
  ) => Promise<OperationResult | void> | OperationResult | void;
}

/**
 * The ready-to-use handler. Simply plug it in your favourite HTTP framework
 * and enjoy.
 *
 * Beware that if you're expecting edge case internal errors. You have to take
 * care of them when implementing the handler. Something like:
 *
 * ```ts
 * const handler = createHandler({ ... });
 * try {
 *   await handler(req, res);
 * } catch (err) {
 *   return res.writeHead(500).end();
 * }
 * ```
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
    executionResult: AsyncIterableIterator<ExecutionResult> | ExecutionResult,
    opId?: string,
  ): Promise<void>;
}

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
        'http://' + req.headers.host + '/',
      ).searchParams.get('token');
      if (urlToken) return urlToken;

      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0,
          v = c == 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    },
    onConnect,
    onOperation,
  } = options;

  const streams: Record<string, Stream> = {};

  function createStream(token: string): Stream {
    let response: ServerResponse | null = null,
      pendingMsgs: string[] = [];
    const ops: Record<string, AsyncIterator<unknown> | null> = {};

    function write(msg: unknown) {
      return new Promise<boolean>((resolve, reject) => {
        if (!response) return resolve(false);
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
      msg += `\ndata: ${data == null ? '' : JSON.stringify(data)}`;
      msg += '\n\n';

      const wrote = await write(msg);
      if (!wrote) pendingMsgs.push(msg);
    }

    async function dispose() {
      // TODO-db-210618 if ended and new response comes in, end it too

      response?.end();
      response = null;

      delete streams[token];
      pendingMsgs = [];
      for (const op of Object.values(ops)) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        await op?.return!(); // iterator must implement the return method
      }
    }

    return {
      get open() {
        return Boolean(response);
      },
      ops,
      async use(req, res) {
        response = res;
        res.once('close', dispose);

        req.socket.setTimeout(0);
        req.socket.setNoDelay(true);
        req.socket.setKeepAlive(true);

        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('X-Accel-Buffering', 'no');
        if (req.httpVersionMajor < 2) res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        // TODO-db-210629 keep the connection alive by issuing pings (":\n\n")

        while (pendingMsgs.length) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const msg = pendingMsgs.shift()!;
          const wrote = await write(msg);
          if (!wrote) throw new Error('Unable to flush messages');
        }
      },
      async from(executionResult, opId) {
        if (isAsyncIterable(executionResult)) {
          /** multiple emitted results */
          for await (const result of executionResult) {
            await emit(
              'value',
              opId
                ? {
                    id: opId,
                    payload: result,
                  }
                : result,
            );
          }
        } else {
          /** single emitted result */
          await emit(
            'value',
            opId
              ? {
                  id: opId,
                  payload: executionResult,
                }
              : executionResult,
          );
        }

        await emit('done', opId ? { id: opId } : null);

        // end on complete when no operation id is present
        // because distinct event streams are used for each operation
        if (!opId) dispose();
        else delete ops[opId];
      },
    };
  }

  async function prepare(
    req: IncomingMessage,
    res: ServerResponse,
    { operationName, query, variables }: RequestParams,
  ): Promise<(() => OperationResult) | void> {
    if (typeof query === 'string') {
      try {
        query = parse(query);
      } catch {
        return res.writeHead(400, 'GraphQL query syntax error').end();
      }
    }

    let operation: OperationTypeNode;
    try {
      const ast = getOperationAST(query, operationName);
      if (!ast) throw null;
      operation = ast.operation;
    } catch {
      return res.writeHead(400, 'Invalid GraphQL query operation').end();
    }

    // mutations cannot happen over GETs
    if (operation === 'mutation' && req.method === 'GET')
      return res.writeHead(400, 'Cannot perform mutations over GET').end();

    try {
      const args = {
        operationName,
        document: query,
        variableValues: variables,
      };
      const execArgs: ExecutionArgs = {
        ...args,
        schema: typeof schema === 'function' ? await schema(req, args) : schema,
      };

      const validationErrs = validate(execArgs.schema, execArgs.document);
      if (validationErrs.length) {
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

      if (!('contextValue' in execArgs))
        execArgs.contextValue =
          typeof context === 'function'
            ? await context(req, execArgs)
            : context;

      return async function perform() {
        let result;
        result =
          operation === 'subscription'
            ? subscribe(execArgs)
            : execute(execArgs);

        const maybeResult = await onOperation?.(req, res, execArgs, result);
        if (maybeResult) result = maybeResult;

        return result;
      };
    } catch (err) {
      // TODO-db-210618 what if an instance of Error is not thrown?
      return res.writeHead(400, err.message).end();
    }
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
        await onConnect?.(req, res);
        if (res.writableEnded) return; // `onConnect` responded

        // TODO-db-210612 parse, perform and respond
        return res.writeHead(501).end();
      }

      // open stream cant exist, only one per token is allowed
      if (stream.open) return res.writeHead(409, 'Stream already open').end();

      await onConnect?.(req, res);
      if (res.writableEnded) return; // `onConnect` responded
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

      const opId = new URL(
        req.url ?? '',
        'http://' + req.headers.host + '/',
      ).searchParams.get('operationId');
      if (!opId) return res.writeHead(400, 'Operation ID is missing').end();

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      stream.ops[opId]?.return!(); // iterator must implement the return method
      delete stream.ops[opId]; // deleting the operation means no further activity should take place

      return res.writeHead(200).end();
    } else if (req.method !== 'GET' && req.method !== 'POST')
      // only POSTs and GETs are accepted at this point
      return res.writeHead(405).end();
    else if (!stream)
      // for all other methods, streams must exist to attach the result onto
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

    const perform = await prepare(req, res, params);
    if (res.writableEnded) return;
    if (!perform)
      throw new Error(
        "Operation preparation didn't respond, yet it was not prepared",
      );

    // operation might have completed before prepared
    if (!(opId in stream.ops)) return res.writeHead(204).end();

    const result = await perform();
    if (res.writableEnded)
      // TODO-db-210816 should the result cleanup be done by the lib here
      return; // `onOperation` responded

    // operation might have completed before performed
    if (!(opId in stream.ops)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      if (isAsyncIterable(result)) result.return!(); // iterator must implement the return method
      return res.writeHead(204).end();
    }

    if (isAsyncIterable(result)) stream.ops[opId] = result;

    // streaming to an empty reservation is ok (will be flushed on connect)
    stream.from(result, opId);

    return res.writeHead(202).end();
  };
}

async function parseReq(req: IncomingMessage): Promise<RequestParams> {
  const params: Partial<RequestParams> = {};

  if (req.method === 'GET') {
    // TODO-db-210618 parse query params
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
