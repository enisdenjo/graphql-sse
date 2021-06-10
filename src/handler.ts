import type * as http from 'http';

export interface HandlerOptions {
  /**
   * Authorize the client through the incoming request. Returned string will be
   * used as an authenticaiton token for the follow-up event stream.
   *
   * If nothing is returned, the execution will stop. Meaning, if you want to
   * respond to the client with a custom status or body, you should do so using
   * the provided arguments and return.
   *
   * Will be called ONLY if the request does not have a `X-GraphQL-Stream-Token`
   * header set. This token indicates that the client was already authorized
   * and wants to append operations to the stream behind the token.
   *
   * @default UUID // https://gist.github.com/jed/982883
   */
  authorize?: (
    req: http.IncomingMessage,
    res: http.ServerResponse,
  ) => Promise<string | void> | string | void;
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
   * timeout expires, all open operations will be completed. However, if the client
   * does connect in a timely matter, missed messages will be flushed starting from the
   * `Last-Event-Id` header value.
   *
   * @default 0
   */
  reconnectTimeout?: number;
}

export type Handler = (
  req: http.IncomingMessage,
  res: http.ServerResponse,
) => Promise<void>;

enum StreamEvent {
  Next = 'next',
  Error = 'error',
  Complete = 'complete',
}

interface Stream {
  readonly open: boolean;
  use(
    req: http.IncomingMessage,
    res: http.ServerResponse,
  ): Promise<void> | void;
  send<E extends StreamEvent>(event: E, data?: unknown): Promise<void>;
  end(chunk?: unknown): Promise<void>;
}

export function createHandler(options: HandlerOptions): Handler {
  const {
    authorize = function generateUUID() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0,
          v = c == 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    },
    compress,
    reconnectTimeout = 0,
  } = options;

  const streams = new Map<string, Stream>();
  function createStream(token: string): Stream {
    let response: http.ServerResponse | null = null,
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

    function end(chunk?: unknown): Promise<void> {
      streams.delete(token);
      msgs = [];
      return new Promise((resolve) => {
        if (!response) return resolve();
        response.end(chunk, resolve);
      });
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
        if (rawLastEventId)
          return flush(
            parseInt(
              Array.isArray(rawLastEventId)
                ? rawLastEventId.join('')
                : rawLastEventId,
            ),
          );
      },
      async send(event, data) {
        let msg = `id: ${currId}\nevent: ${event}`;
        if (data) msg += `\ndata: ${JSON.stringify(data)}`;
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

  return async function handler(
    req: http.IncomingMessage,
    res: http.ServerResponse,
  ) {
    if (req.headers.accept === 'text/event-stream') {
      // subscription

      const token = new URL(req.url ?? '').searchParams.get('token') ?? '';
      const stream = streams.get(token);
      if (!stream) return res.writeHead(401).end();
      if (stream.open) return res.writeHead(409, 'Stream already open').end();
      return await stream.use(req, res);
    }

    // auth or operation

    const headerToken = req.headers['x-graphql-stream-token'];
    if (headerToken) {
      let token: string;
      if (Array.isArray(headerToken)) token = headerToken.join('');
      else token = headerToken;

      const stream = streams.get(token);
      if (!stream) return res.writeHead(404, 'Stream not found').end();

      // TODO-db-210610 do operation and assign to stream
      return res.writeHead(501).end();
    }

    const maybeToken = await authorize(req, res);
    if (typeof maybeToken !== 'string') return;
    streams.set(maybeToken, createStream(maybeToken));

    res.statusCode = 201;
    res.statusMessage = 'Stream created';
    res.setHeader('Content-Type', 'text/plain');
    res.write(maybeToken);
    res.end();
  };
}
