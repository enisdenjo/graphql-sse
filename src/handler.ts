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
   * If nothing is returned, the execution will stop. Meaning, if you want to
   * respond to the client with a custom status or body, you should do so using
   * the provided arguments and then return.
   *
   * @default 'req.headers["x-graphql-stream-token"] || req.url.searchParams["token"] || generateRandomUUID()' // https://gist.github.com/jed/982883
   */
  authenticate?: (
    req: IncomingMessage,
    res: ServerResponse,
  ) => Promise<string | undefined | void> | string | undefined | void;
  /**
   * Should the event source messages be compressed.
   *
   * @default false
   */
  compress?: boolean;
  /**
   * How long should the server wait for the client to reconnect in milisconds
   * before completing its open operations.
   *
   * When set, the server will keep all operations open if the client disconnects
   * abruptly for the set amount of time. If the client does not reconnect before the
   * timeout expires, all open operations will be Doned. However, if the client
   * does connect in a timely matter, missed messages will be flushed starting from the
   * `Last-Event-Id` header value.
   *
   * @default 0
   */
  reconnectTimeout?: number;
}

export type Handler = (
  req: IncomingMessage,
  res: ServerResponse,
) => Promise<void>;

export enum StreamEvent {
  Value = 'value',
  Done = 'done',
}

export type StreamData<E extends StreamEvent> = E extends StreamEvent.Value
  ? ExecutionResult | { id: string; payload: ExecutionResult }
  : E extends StreamEvent.Done
  ? null | { id: string }
  : never;

interface Stream {
  readonly open: boolean;
  use(req: IncomingMessage, res: ServerResponse): Promise<void> | void;
  emit<E extends StreamEvent>(event: E, data: StreamData<E>): Promise<void>;
  end(): void;
}

export function createHandler(options: HandlerOptions): Handler {
  const {
    schema,
    context,
    validate = graphqlValidate,
    execute = graphqlExecute,
    subscribe = graphqlSubscribe,
    authenticate = function extractStreamToken(req) {
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
    compress,
    reconnectTimeout = 0,
  } = options;

  const activeStreams = new Map<string, Stream[]>();
  function createStream(token: string): Stream {
    let response: ServerResponse | null = null,
      currId = 0,
      wentAway: ReturnType<typeof setTimeout>;

    let msgs: { id: number; msg: string }[] = [];
    async function flush(lastId: number) {
      while (msgs.length) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const { id, msg } = msgs.shift()!;
        if (id > lastId) {
          if (!(await write(msg))) throw new Error('Unable to flush messages');
        }
      }
    }

    function write(chunk: unknown) {
      return new Promise<boolean>((resolve, reject) => {
        if (!response) return resolve(false);
        response.write(chunk, (err) => {
          if (err) return reject(err);
          resolve(true);
        });
      });
    }

    function end() {
      activeStreams.delete(token);
      msgs = [];
      response?.end();
    }

    return {
      get open() {
        return Boolean(response);
      },
      use(req, res) {
        clearTimeout(wentAway);

        response = res;

        req.socket.setTimeout(0);
        req.socket.setNoDelay(true);
        req.socket.setKeepAlive(true);

        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('X-Accel-Buffering', 'no');
        if (req.httpVersionMajor < 2) res.setHeader('Connection', 'keep-alive');
        if (compress) res.setHeader('Content-Encoding', 'deflate');

        res.once('close', () => {
          response = null;

          if (isFinite(reconnectTimeout) && reconnectTimeout > 0)
            wentAway = setTimeout(end, reconnectTimeout);
          else end();
        });

        const rawLastEventId = req.headers['last-event-id'];
        if (rawLastEventId) {
          let lastEventId: number | null = null;
          try {
            lastEventId = parseInt(
              Array.isArray(rawLastEventId)
                ? rawLastEventId.join('')
                : rawLastEventId,
            );
          } catch {
            /* noop */
          }
          if (lastEventId !== null) return flush(lastEventId);
        }
      },
      async emit(event, data) {
        let msg = `id: ${currId}\nevent: ${event}`;
        msg += `\ndata: ${data == null ? '' : JSON.stringify(data)}`;
        msg += '\n\n';
        msgs.push({ id: currId, msg });
        currId++;

        const wrote = await write(msg);
        if (wrote) {
          // TODO-db-210610 take care of msgs array on successful writes
        }
      },
      end,
    };
  }

  async function perform(
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<OperationResult | void> {
    let operationName: string | undefined,
      query: DocumentNode | string | undefined,
      variables: Record<string, unknown> | undefined,
      extensions: Record<string, unknown> | undefined;

    // validate and check the accept header
    if (
      ![
        '',
        'application/graphql+json',
        'application/json',
        'text/event-stream',
      ].includes(req.headers.accept ?? '')
    )
      return res.writeHead(406).end();

    // parse
    if (req.method === 'POST') {
      const success = await new Promise<boolean>((resolve) => {
        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            operationName = data.operationName;
            query = data.query;
            variables = data.variables;
            extensions = data.extensions;
            resolve(true);
          } catch {
            resolve(false);
          }
        });
      });
      if (!success) return res.writeHead(400, 'Unparsable body').end();
    } else if (req.method === 'GET') {
      // TODO-db-210618 parse query params
    } else return res.writeHead(405).end();

    // validate
    if (!query) return res.writeHead(400, 'Missing query').end();
    if (variables && typeof variables !== 'object')
      return res.writeHead(400, 'Invalid variables').end();
    if (extensions && typeof extensions !== 'object')
      return res.writeHead(400, 'Invalid extensions').end();

    // if query is a string, parse it
    if (typeof query === 'string') {
      try {
        query = parse(query);
      } catch {
        return res.writeHead(400, 'GraphQL query syntax error').end();
      }
    }

    // detect query opration
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

      // validate execution arguments
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

      // inject context
      if (!('contextValue' in execArgs))
        execArgs.contextValue =
          typeof context === 'function'
            ? await context(req, execArgs)
            : context;

      // the execution arguments have been prepared, perform the operation
      if (operation === 'subscription')
        return await (subscribe ?? graphqlSubscribe)(execArgs);
      // operation === 'query' || 'mutation'
      else return await (execute ?? graphqlExecute)(execArgs);
    } catch (err) {
      // TODO-db-210618 what if an instance of Error is not thrown?
      return res.writeHead(400, err.message).end();
    }
  }

  return async function handler(req: IncomingMessage, res: ServerResponse) {
    // authenticate first and acquire unique identification token
    const token = await authenticate(req, res);
    if (typeof token !== 'string' || res.writableEnded) return; // `authenticate` responded

    // if event stream, add to streams list or perform directly
    if (req.headers.accept === 'text/event-stream') {
      const streams = activeStreams.get(token);
      const stream = createStream(token);
      await stream.use(req, res);

      // if event stream and has not token in list, process it directly
      if (!streams) {
        // TODO-db-210612 perform operation and respond
        return res.writeHead(501).end();
      }

      // otherwise add it to the list and wait
      activeStreams.set(token, [...streams, stream]);
      return;
    }

    // if a regular request is made with the method PUT,
    // prepare a stream for future incoming connections.
    // otherwise, just guarantee that the streams exist
    if (req.method === 'PUT') {
      // streams mustnt exist if putting new one
      if (activeStreams.has(token)) return res.writeHead(409).end();
      // create streams, assign to token
      activeStreams.set(token, []);
      // and respond with it indicating success
      res
        .writeHead(201, { 'Content-Type': 'text/plain; charset=utf-8' })
        .write(token);
      return res.end();
    } else if (!activeStreams.has(token))
      // for all other methods, streams must exist to attach the result onto
      return res.writeHead(401).end();

    // ready to perform the requested operation
    const result = await perform(req, res);
    if (!result || res.writableEnded) return; // `perform` responded

    // TODO-db-210618 connect result to existing stream
    return res.writeHead(501).end();
  };
}
