/**
 *
 * client
 *
 */

import { ExecutionResult } from 'graphql';
import { createParser } from './parser';
import { isObject } from './utils';
import { RequestParams, Sink, StreamMessage } from './common';

/** This file is the entry point for browsers, re-export common elements. */
export * from './common';

/** @category Client */
export interface ClientOptions {
  /**
   * Reuses a single SSE connection for all GraphQL operations.
   *
   * When instantiating with `false` (default), the client will run
   * in a "distinct connections mode" mode. Meaning, a new SSE
   * connection will be established on each subscribe.
   *
   * On the other hand, when instantiating with `true` (default), the client
   * will run in a "single connection mode" mode. Meaning, a single SSE
   * connection will be used to transmit all operation results while
   * separate HTTP requests will be issued to dictate the behaviour.
   *
   * @default false
   */
  singleConnection?: boolean;
  /**
   * Controls when should the connection be established while using the
   * client in "single connection mode" (see `singleConnection ` option).
   *
   * - `false`: Establish a connection immediately.
   * - `true`: Establish a connection on first subscribe and close on last unsubscribe.
   *
   * Note that the `lazy` option has NO EFFECT when using the client
   * in "distinct connection mode" (`singleConnection = false`).
   *
   * @default true
   */
  lazy?: boolean;
  /**
   * Used ONLY when the client is in non-lazy mode (`lazy = false`). When
   * using this mode, errors might have no sinks to report to; however,
   * to avoid swallowing errors, `onNonLazyError` will be called when either:
   * - An unrecoverable error/close event occurs
   * - Silent retry attempts have been exceeded
   *
   * After a client has errored out, it will NOT perform any automatic actions.
   *
   * @default console.error
   */
  onNonLazyError?: (error: unknown) => void;
  /**
   * URL of the GraphQL over SSE server to connect.
   *
   * If the option is a function, it will be called on each connection attempt.
   * Returning a Promise is supported too and the connection phase will stall until it
   * resolves with the URL.
   *
   * A good use-case for having a function is when using the URL for authentication,
   * where subsequent reconnects (due to auth) may have a refreshed identity token in
   * the URL.
   */
  url: string | (() => Promise<string> | string);
  /**
   * HTTP headers to pass along the request.
   *
   * If the option is a function, it will be called on each connection attempt.
   * Returning a Promise is supported too and the connection phase will stall until it
   * resolves with the headers.
   *
   * A good use-case for having a function is when using the headers for authentication,
   * where subsequent reconnects (due to auth) may have a refreshed identity token in
   * the header.
   */
  headers?:
    | Record<string, string>
    | (() => Promise<Record<string, string>> | Record<string, string>);
  /**
   * The Fetch function to use.
   *
   * For NodeJS environments consider using [`node-fetch`](https://github.com/node-fetch/node-fetch).
   *
   * @default global.fetch
   */
  fetchFn?: unknown;
  /**
   * The AbortController implementation to use.
   *
   * For NodeJS environments before v15 consider using [`node-abort-controller`](https://github.com/southpolesteve/node-abort-controller).
   *
   * @default global.AbortController
   */
  abortControllerImpl?: unknown;
  /**
   * A custom ID generator for identifying subscriptions.
   *
   * The default generates a v4 UUID to be used as the ID using `Math`
   * as the random number generator. Supply your own generator
   * in case you need more uniqueness.
   *
   * Reference: https://gist.github.com/jed/982883
   */
  generateID?: () => string;
  /**
   * How many times should the client try to reconnect before it errors out?
   *
   * @default 5
   */
  retryAttempts?: number;
  /**
   * Control the wait time between retries. You may implement your own strategy
   * by timing the resolution of the returned promise with the retries count.
   *
   * `retries` argument counts actual reconnection attempts, so it will begin with
   * 0 after the first retryable disconnect.
   *
   * @default 'Randomised exponential backoff, 5 times'
   */
  retry?: (retries: number) => Promise<void>;
}

/** @category Client */
export interface Client {
  /**
   * Subscribes to receive through a SSE connection.
   *
   * It uses the `sink` to emit received data or errors. Returns a _dispose_
   * function used for dropping the subscription and cleaning up.
   */
  subscribe<Data = Record<string, unknown>, Extensions = unknown>(
    request: RequestParams,
    sink: Sink<ExecutionResult<Data, Extensions>>,
  ): () => void;
  /**
   * Dispose of the client, destroy connections and clean up resources.
   */
  dispose: () => void;
}

/**
 * Creates a disposable GraphQL over SSE client to transmit
 * GraphQL operation results.
 *
 * If you have an HTTP/2 server, it is recommended to use the client
 * in "distinct connections mode" (`singleConnection = true`) which will
 * create a new SSE connection for each subscribe. This is the default.
 *
 * However, when dealing with HTTP/1 servers from a browser, consider using
 * the "single connection mode" (`singleConnection = false`) which will
 * use only one SSE connection.
 *
 * @category Client
 */
export function createClient(options: ClientOptions): Client {
  const {
    singleConnection = false,
    lazy = true,
    onNonLazyError = console.error,
    /**
     * Generates a v4 UUID to be used as the ID using `Math`
     * as the random number generator. Supply your own generator
     * in case you need more uniqueness.
     *
     * Reference: https://gist.github.com/jed/982883
     */
    generateID = function generateUUID() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0,
          v = c == 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    },
    retryAttempts = 5,
    retry = async function randomisedExponentialBackoff(retries) {
      let retryDelay = 1000; // start with 1s delay
      for (let i = 0; i < retries; i++) {
        retryDelay *= 2;
      }
      await new Promise((resolve) =>
        setTimeout(
          resolve,
          retryDelay +
            // add random timeout from 300ms to 3s
            Math.floor(Math.random() * (3000 - 300) + 300),
        ),
      );
    },
  } = options;
  const fetchFn = (options.fetchFn || fetch) as typeof fetch;
  const AbortControllerImpl = (options.abortControllerImpl ||
    AbortController) as typeof AbortController;

  // we dont use yet another AbortController here because of
  // node's max EventEmitters listeners being only 10
  const client = (() => {
    let disposed = false;
    const listeners: (() => void)[] = [];
    return {
      get disposed() {
        return disposed;
      },
      onDispose(cb: () => void) {
        if (disposed) {
          // empty the call stack and then call the cb
          setTimeout(() => cb(), 0);
          return () => {
            // noop
          };
        }
        listeners.push(cb);
        return () => {
          listeners.splice(listeners.indexOf(cb), 1);
        };
      },
      dispose() {
        if (disposed) return;
        disposed = true;
        // we copy the listeners so that onDispose unlistens dont "pull the rug under our feet"
        for (const listener of [...listeners]) {
          listener();
        }
      },
    };
  })();

  let connCtrl: AbortController,
    conn: Promise<Connection> | undefined,
    locks = 0,
    retryingErr = null as unknown,
    retries = 0;
  async function getOrConnect(): Promise<NonNullable<typeof conn>> {
    try {
      if (client.disposed) throw new Error('Client has been disposed');

      return await (conn ??
        (conn = (async () => {
          if (retryingErr) {
            await retry(retries);

            // connection might've been aborted while waiting for retry
            if (connCtrl.signal.aborted)
              throw new Error('Connection aborted by the client');

            retries++;
          }

          // we must create a new controller here because lazy mode aborts currently active ones
          connCtrl = new AbortControllerImpl();
          const unlistenDispose = client.onDispose(() => connCtrl.abort());
          connCtrl.signal.addEventListener('abort', () => {
            unlistenDispose();
            conn = undefined;
          });

          const url =
            typeof options.url === 'function'
              ? await options.url()
              : options.url;
          if (connCtrl.signal.aborted)
            throw new Error('Connection aborted by the client');

          const headers =
            typeof options.headers === 'function'
              ? await options.headers()
              : options.headers ?? {};
          if (connCtrl.signal.aborted)
            throw new Error('Connection aborted by the client');

          let res;
          try {
            res = await fetchFn(url, {
              signal: connCtrl.signal,
              method: 'PUT',
              headers,
            });
          } catch (err) {
            throw new NetworkError(err);
          }
          if (res.status !== 201) throw new NetworkError(res);

          const token = await res.text();
          headers['x-graphql-stream-token'] = token;

          const connected = await connect({
            signal: connCtrl.signal,
            headers,
            url,
            fetchFn,
          });
          retryingErr = null; // future connects are not retries
          retries = 0; // reset the retries on connect

          connected.waitForThrow().catch(() => (conn = undefined));

          return connected;
        })()));
    } catch (err) {
      // whatever problem happens during connect means the connection was not established
      conn = undefined;
      throw err;
    }
  }

  // non-lazy mode always holds one lock to persist the connection
  if (singleConnection && !lazy) {
    (async () => {
      locks++;
      for (;;) {
        try {
          const { waitForThrow } = await getOrConnect();
          await waitForThrow();
        } catch (err) {
          if (client.disposed) return;

          // all non-network errors are worth reporting immediately
          if (!(err instanceof NetworkError)) return onNonLazyError?.(err);

          // retries are not allowed or we tried to many times, report error
          if (!retryAttempts || retries >= retryAttempts)
            return onNonLazyError?.(err);

          // try again
          retryingErr = err;
        }
      }
    })();
  }

  return {
    subscribe(request, sink) {
      if (!singleConnection) {
        // distinct connections mode

        const control = new AbortControllerImpl();
        const unlisten = client.onDispose(() => {
          unlisten();
          control.abort();
        });

        (async () => {
          let retryingErr = null as unknown,
            retries = 0;

          for (;;) {
            try {
              if (retryingErr) {
                await retry(retries);

                // connection might've been aborted while waiting for retry
                if (control.signal.aborted)
                  throw new Error('Connection aborted by the client');

                retries++;
              }

              const url =
                typeof options.url === 'function'
                  ? await options.url()
                  : options.url;
              if (control.signal.aborted)
                throw new Error('Connection aborted by the client');

              const headers =
                typeof options.headers === 'function'
                  ? await options.headers()
                  : options.headers ?? {};
              if (control.signal.aborted)
                throw new Error('Connection aborted by the client');

              const { getResults } = await connect({
                signal: control.signal,
                headers,
                url,
                body: JSON.stringify(request),
                fetchFn,
              });
              retryingErr = null; // future connects are not retries
              retries = 0; // reset the retries on connect

              for await (const result of getResults()) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                sink.next(result as any);
              }

              return control.abort();
            } catch (err) {
              if (control.signal.aborted) return;

              // all non-network errors are worth reporting immediately
              if (!(err instanceof NetworkError)) throw err;

              // retries are not allowed or we tried to many times, report error
              if (!retryAttempts || retries >= retryAttempts) throw err;

              // try again
              retryingErr = err;
            }
          }
        })()
          .catch((err) => sink.error(err))
          .then(() => sink.complete());

        return () => control.abort();
      }

      // single connection mode

      locks++;

      const control = new AbortControllerImpl();
      const unlisten = client.onDispose(() => {
        unlisten();
        control.abort();
      });

      (async () => {
        const operationId = generateID();

        request = {
          ...request,
          extensions: { ...request.extensions, operationId },
        };

        let complete: (() => Promise<void>) | null = null;
        for (;;) {
          complete = null;
          try {
            const { url, headers, getResults } = await getOrConnect();

            let res;
            try {
              res = await fetchFn(url, {
                signal: control.signal,
                method: 'POST',
                headers,
                body: JSON.stringify(request),
              });
            } catch (err) {
              throw new NetworkError(err);
            }
            if (res.status !== 202) throw new NetworkError(res);

            complete = async () => {
              let res;
              try {
                const control = new AbortControllerImpl();
                const unlisten = client.onDispose(() => {
                  unlisten();
                  control.abort();
                });
                res = await fetchFn(url + '?operationId=' + operationId, {
                  signal: control.signal,
                  method: 'DELETE',
                  headers,
                });
              } catch (err) {
                throw new NetworkError(err);
              }
              if (res.status !== 200) throw new NetworkError(res);
            };

            for await (const result of getResults({
              signal: control.signal,
              operationId,
            })) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              sink.next(result as any);
            }

            complete = null; // completed by the server

            return control.abort();
          } catch (err) {
            if (control.signal.aborted) return await complete?.();

            // all non-network errors are worth reporting immediately
            if (!(err instanceof NetworkError)) throw err;

            // retries are not allowed or we tried to many times, report error
            if (!retryAttempts || retries >= retryAttempts) throw err;

            // try again
            retryingErr = err;
          } finally {
            // release lock if aborted, and disconnect if no more locks
            if (control.signal.aborted && --locks === 0) connCtrl.abort();
          }
        }
      })()
        .catch((err) => sink.error(err))
        .then(() => sink.complete());

      return () => control.abort();
    },
    dispose() {
      client.dispose();
    },
  };
}

/**
 * A network error caused by the client or an unexpected response from the server.
 *
 * Network errors are considered retryable, all others error types will be reported
 * immediately.
 *
 * @category Client
 */
export class NetworkError extends Error {
  /**
   * The underlyig response thats considered an error.
   *
   * Will be undefined when no response is received,
   * instead an unexpected network error.
   */
  public response: Response | undefined;

  constructor(msgOrErrOrResponse: string | Error | Response) {
    let message, response: Response | undefined;
    if (NetworkError.isResponse(msgOrErrOrResponse)) {
      response = msgOrErrOrResponse;
      message =
        'Server responded with ' +
        msgOrErrOrResponse.status +
        ': ' +
        msgOrErrOrResponse.statusText;
    } else if (msgOrErrOrResponse instanceof Error)
      message = msgOrErrOrResponse.message;
    else message = String(msgOrErrOrResponse);

    super(message);

    this.name = this.constructor.name;
    this.response = response;
  }

  static isResponse(
    msgOrErrOrResponse: string | Error | Response,
  ): msgOrErrOrResponse is Response {
    return (
      isObject(msgOrErrOrResponse) &&
      'status' in msgOrErrOrResponse &&
      'statusText' in msgOrErrOrResponse
    );
  }
}

interface Connection {
  url: string;
  headers: Record<string, string> | undefined;
  waitForThrow: () => Promise<void>;
  getResults: (options?: {
    signal: AbortSignal;
    operationId: string;
  }) => AsyncIterableIterator<ExecutionResult>;
}

interface ConnectOptions {
  signal: AbortSignal;
  url: string;
  headers?: Record<string, string> | undefined;
  body?: string;
  fetchFn: typeof fetch;
}

async function connect(options: ConnectOptions): Promise<Connection> {
  const { signal, url, headers, body, fetchFn } = options;

  const waiting: {
    [id: string]: { proceed: () => void };
  } = {};
  const queue: { [id: string]: (ExecutionResult | 'complete')[] } = {};

  let res;
  try {
    res = await fetchFn(url, {
      signal,
      method: 'POST',
      headers: {
        ...headers,
        accept: 'text/event-stream',
      },
      body,
    });
  } catch (err) {
    throw new NetworkError(err);
  }
  if (!res.ok) throw new NetworkError(res);
  if (!res.body) throw new Error('Missing response body');

  let error: unknown = null;
  let waitingForThrow: ((error: unknown) => void) | null = null;
  (async () => {
    try {
      const parse = createParser();

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      for await (const chunk of toAsyncIterator(res.body!)) {
        if (typeof chunk === 'string')
          throw new Error(`Unexpected string chunk "${chunk}"`);

        // read chunk and if messages are ready, yield them
        const msgs = parse(chunk);
        if (!msgs) continue;

        for (const msg of msgs) {
          const operationId =
            msg.data && 'id' in msg.data
              ? msg.data.id // StreamDataForID
              : ''; // StreamData

          if (!(operationId in queue)) queue[operationId] = [];

          switch (msg.event) {
            case 'next':
              if (operationId)
                queue[operationId].push(
                  (msg as StreamMessage<true, 'next'>).data.payload,
                );
              else
                queue[operationId].push(
                  (msg as StreamMessage<false, 'next'>).data,
                );
              break;
            case 'complete':
              queue[operationId].push('complete');
              break;
            default:
              throw new Error(`Unexpected message event "${msg.event}"`);
          }

          waiting[operationId]?.proceed();
        }
      }
    } catch (err) {
      error = err;
      if (waitingForThrow) waitingForThrow(err);
    } finally {
      Object.values(waiting).forEach(({ proceed }) => proceed());
    }
  })();

  return {
    url,
    headers,
    waitForThrow: () =>
      new Promise((_, reject) => {
        if (error) return reject(error);
        waitingForThrow = reject;
      }),
    async *getResults(options) {
      const { signal, operationId = '' } = options ?? {};
      // operationId === '' ? StreamData : StreamDataForID

      try {
        for (;;) {
          while (queue[operationId]?.length) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const result = queue[operationId].shift()!;
            if (result === 'complete') return;
            yield result;
          }
          if (error) throw error;
          if (signal?.aborted)
            throw new Error('Getting results aborted by the client');

          await new Promise<void>((resolve) => {
            const proceed = () => {
              signal?.removeEventListener('abort', proceed);
              delete waiting[operationId];
              resolve();
            };
            signal?.addEventListener('abort', proceed);
            waiting[operationId] = { proceed };
          });
        }
      } finally {
        delete queue[operationId];
      }
    },
  };
}

/** Isomorphic ReadableStream to AsyncIterator converter. */
function toAsyncIterator(
  val: ReadableStream | NodeJS.ReadableStream,
): AsyncIterableIterator<string | Buffer | Uint8Array> {
  // node stream is already async iterable
  if (typeof Object(val)[Symbol.asyncIterator] === 'function') {
    val = val as NodeJS.ReadableStream;
    return val[Symbol.asyncIterator]();
  }

  // convert web stream to async iterable
  return (async function* () {
    val = val as ReadableStream;
    const reader = val.getReader();
    for (;;) {
      const { value, done } = await reader.read();
      if (done) return value;
      yield value;
    }
  })();
}
