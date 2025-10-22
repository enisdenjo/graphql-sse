/**
 *
 * client
 *
 */

import { createParser } from './parser';
import { isObject } from './utils';
import {
  RequestParams,
  Sink,
  StreamMessage,
  ExecutionResult,
  ExecutionPatchResult,
  TOKEN_HEADER_KEY,
  StreamEvent,
} from './common';

/** This file is the entry point for browsers, re-export common elements. */
export * from './common';

/** @category Client */
export interface EventListeners<SingleConnection extends boolean = false> {
  /**
   * Emitted when the client starts connecting to the server.
   *
   * @param reconnecting - Whether the client is reconnecting after the connection was broken.
   */
  connecting?: (reconnecting: boolean) => void;
  /**
   * Emitted when the client receives a message from the server.
   */
  message?: (message: StreamMessage<SingleConnection, StreamEvent>) => void;
  /**
   * Emitted when the client has successfully connected to the server.
   *
   * @param reconnected - Whether the client has reconnected after the connection was broken.
   */
  connected?: (reconnected: boolean) => void;
}

/** @category Client */
export interface ClientOptions<SingleConnection extends boolean = false> {
  /**
   * Reuses a single SSE connection for all GraphQL operations.
   *
   * When instantiating with `false` (default), the client will run
   * in a "distinct connections mode" mode. Meaning, a new SSE
   * connection will be established on each subscribe.
   *
   * On the other hand, when instantiating with `true`, the client
   * will run in a "single connection mode" mode. Meaning, a single SSE
   * connection will be used to transmit all operation results while
   * separate HTTP requests will be issued to dictate the behaviour.
   *
   * @default false
   */
  singleConnection?: SingleConnection;
  /**
   * Controls when should the connection be established while using the
   * client in "single connection mode" (see `singleConnection ` option).
   *
   * - `false`: Establish a connection immediately.
   * - `true`: Establish a connection on first subscribe and close on last unsubscribe.
   *
   * Note that the `lazy` option has NO EFFECT when using the client
   * in "distinct connections mode" (`singleConnection = false`).
   *
   * @default true
   */
  lazy?: SingleConnection extends true ? boolean : never;
  /**
   * How long should the client wait before closing the connection after the last operation has
   * completed. You might want to have a calmdown time before actually closing the connection.
   *
   * Meant to be used in combination with `lazy`.
   *
   * Note that the `lazy` option has NO EFFECT when using the client
   * in "distinct connections mode" (`singleConnection = false`).
   *
   * @default 0
   */
  lazyCloseTimeout?: SingleConnection extends true ? number : never;
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
  onNonLazyError?: SingleConnection extends true
    ? (error: unknown) => void
    : never;
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
   *
   * The request is passed for distinct connections mode only.
   */
  url:
    | string
    | ((
        request: SingleConnection extends true ? undefined : RequestParams,
      ) => Promise<string> | string);
  /**
   * Indicates whether the user agent should send cookies from the other domain in the case
   * of cross-origin requests.
   *
   * Possible options are:
   *   - `omit`: Never send or receive cookies.
   *   - `same-origin`: Send user credentials (cookies, basic http auth, etc..) if the URL is on the same origin as the calling script.
   *   - `include`: Always send user credentials (cookies, basic http auth, etc..), even for cross-origin calls.
   *
   * @default same-origin
   */
  credentials?: 'omit' | 'same-origin' | 'include';
  /**
   * A string specifying the referrer of the request. This can be a same-origin URL, about:client, or an empty string.
   *
   * @default undefined
   */
  referrer?: string;
  /**
   * Specifies the referrer policy to use for the request.
   *
   * Possible options are:
   *   - `no-referrer`: Does not send referrer information along with requests to any origin.
   *   - `no-referrer-when-downgrade`: Sends full referrerURL for requests: whose referrerURL and current URL are both potentially trustworthy URLs, or whose referrerURL is a non-potentially trustworthy URL.
   *   - `same-origin`: Sends full referrerURL as referrer information when making same-origin-referrer requests.
   *   - `origin`: Sends only the ASCII serialization of the request’s referrerURL when making both same-origin-referrer requests and cross-origin-referrer requests.
   *   - `strict-origin`: Sends the ASCII serialization of the origin of the referrerURL for requests: whose referrerURL and current URL are both potentially trustworthy URLs, or whose referrerURL is a non-potentially trustworthy URL
   *   - `origin-when-cross-origin`: Sends full referrerURL when making same-origin-referrer requests, and only the ASCII serialization of the origin of the request’s referrerURL is sent when making cross-origin-referrer requests
   *   - `strict-origin-when-cross-origin`: Sends full referrerURL when making same-origin-referrer requests, and only the ASCII serialization of the origin of the request’s referrerURL when making cross-origin-referrer requests: whose referrerURL and current URL are both potentially trustworthy URLs, or whose referrerURL is a non-potentially trustworthy URL.
   *   - `unsafe-url`: Sends full referrerURL along for both same-origin-referrer requests and cross-origin-referrer requests.
   *
   * @default undefined
   */
  referrerPolicy?:
    | 'no-referrer'
    | 'no-referrer-when-downgrade'
    | 'same-origin'
    | 'origin'
    | 'strict-origin'
    | 'origin-when-cross-origin'
    | 'strict-origin-when-cross-origin'
    | 'unsafe-url';
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
   *
   * The request is passed for distinct connections mode only.
   */
  headers?:
    | Record<string, string>
    | ((
        request: SingleConnection extends true ? undefined : RequestParams,
      ) => Promise<Record<string, string>> | Record<string, string>);
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
  /**
   * Browsers show stream messages in the DevTools **only** if they're received through the [native EventSource](https://developer.mozilla.org/en-US/docs/Web/API/EventSource),
   * and because `graphql-sse` implements a custom SSE parser - received messages will **not** appear in browser's DevTools.
   *
   * Use this function if you want to inspect valid messages received through the active SSE connection.
   *
   * @deprecated Consider using {@link ClientOptions.on} instead.
   */
  onMessage?: (message: StreamMessage<SingleConnection, StreamEvent>) => void;
  /**
   * Event listeners for events happening in the SSE connection.
   *
   * Will emit events for both the "single connection mode" and the default "distinct connections mode".
   *
   * Beware that the `connecting` event will be called for **each** subscription when using with "distinct connections mode".
   */
  on?: EventListeners<SingleConnection>;
}

/** @category Client */
export interface Client<SingleConnection extends boolean = false> {
  /**
   * Subscribes to receive through a SSE connection.
   *
   * It uses the `sink` to emit received data or errors. Returns a _dispose_
   * function used for dropping the subscription and cleaning up.
   *
   * @param on - The event listener for "distinct connections mode". Note that **no events will be emitted** in "single connection mode"; for that, consider using the event listener in {@link ClientOptions}.
   */
  subscribe<Data = Record<string, unknown>, Extensions = unknown>(
    request: RequestParams,
    sink: Sink<ExecutionResult<Data, Extensions>>,
    on?: SingleConnection extends true ? never : EventListeners<false>,
  ): () => void;
  /**
   * Subscribes and iterates over emitted results from an SSE connection
   * through the returned async iterator.
   *
   * @param on - The event listener for "distinct connections mode". Note that **no events will be emitted** in "single connection mode"; for that, consider using the event listener in {@link ClientOptions}.
   */
  iterate<Data = Record<string, unknown>, Extensions = unknown>(
    request: RequestParams,
    on?: SingleConnection extends true ? never : EventListeners<false>,
  ): AsyncIterableIterator<ExecutionResult<Data, Extensions>>;
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
 * in "distinct connections mode" (`singleConnection = false`) which will
 * create a new SSE connection for each subscribe. This is the default.
 *
 * However, when dealing with HTTP/1 servers from a browser, consider using
 * the "single connection mode" (`singleConnection = true`) which will
 * use only one SSE connection.
 *
 * @category Client
 */
export function createClient<SingleConnection extends boolean = false>(
  options: ClientOptions<SingleConnection>,
): Client<SingleConnection> {
  const {
    singleConnection = false,
    lazy = true,
    lazyCloseTimeout = 0,
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
    credentials = 'same-origin',
    referrer,
    referrerPolicy,
    onMessage,
    on: clientOn,
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

          clientOn?.connecting?.(!!retryingErr);

          // we must create a new controller here because lazy mode aborts currently active ones
          connCtrl = new AbortControllerImpl();
          const unlistenDispose = client.onDispose(() => connCtrl.abort());
          connCtrl.signal.addEventListener('abort', () => {
            unlistenDispose();
            conn = undefined;
          });

          const opts = options as ClientOptions<true>;
          const url =
            typeof opts.url === 'function'
              ? await opts.url(undefined)
              : opts.url;
          if (connCtrl.signal.aborted)
            throw new Error('Connection aborted by the client');

          const headers =
            typeof opts.headers === 'function'
              ? await opts.headers(undefined)
              : opts.headers ?? {};
          if (connCtrl.signal.aborted)
            throw new Error('Connection aborted by the client');

          let res;
          try {
            res = await fetchFn(url, {
              signal: connCtrl.signal,
              method: 'PUT',
              credentials,
              referrer,
              referrerPolicy,
              headers,
            });
          } catch (err) {
            throw new NetworkError(err);
          }
          if (res.status !== 201) throw new NetworkError(res);

          const token = await res.text();
          headers[TOKEN_HEADER_KEY] = token;

          const connected = await connect({
            signal: connCtrl.signal,
            headers,
            credentials,
            referrer,
            referrerPolicy,
            url,
            fetchFn,
            onMessage: (msg) => {
              clientOn?.message?.(msg);
              onMessage?.(msg); // @deprecated
            },
          });

          clientOn?.connected?.(!!retryingErr);

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

          // was a network error, get rid of the current connection to ensure retries
          conn = undefined;

          // retries are not allowed or we tried to many times, report error
          if (!retryAttempts || retries >= retryAttempts)
            return onNonLazyError?.(err);

          // try again
          retryingErr = err;
        }
      }
    })();
  }

  function subscribe(
    request: RequestParams,
    sink: Sink,
    on?: EventListeners<false>,
  ) {
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

            clientOn?.connecting?.(!!retryingErr);
            on?.connecting?.(!!retryingErr);

            const opts = options as ClientOptions;
            const url =
              typeof opts.url === 'function'
                ? await opts.url(request)
                : opts.url;
            if (control.signal.aborted)
              throw new Error('Connection aborted by the client');

            const headers =
              typeof opts.headers === 'function'
                ? await opts.headers(request)
                : opts.headers ?? {};
            if (control.signal.aborted)
              throw new Error('Connection aborted by the client');

            const { getResults } = await connect({
              signal: control.signal,
              headers: {
                ...headers,
                'content-type': 'application/json; charset=utf-8',
              },
              credentials,
              referrer,
              referrerPolicy,
              url,
              body: JSON.stringify(request),
              fetchFn,
              onMessage: (msg) => {
                clientOn?.message?.(msg);
                on?.message?.(msg);
                onMessage?.(msg); // @deprecated
              },
            });

            clientOn?.connected?.(!!retryingErr);
            on?.connected?.(!!retryingErr);

            for await (const result of getResults()) {
              // only after receiving results are future connects not considered retries.
              // this is because a client might successfully connect, but the server
              // ends up terminating the connection afterwards before streaming anything.
              // of course, if the client completes the subscription, this loop will
              // break and therefore stop the stream (it wont reconnect)
              retryingErr = null;
              retries = 0;

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
        .then(() => sink.complete())
        .catch((err) => sink.error(err));

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
              credentials,
              referrer,
              referrerPolicy,
              headers: {
                ...headers,
                'content-type': 'application/json; charset=utf-8',
              },
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
                credentials,
                referrer,
                referrerPolicy,
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
            // only after receiving results are future connects not considered retries.
            // this is because a client might successfully connect, but the server
            // ends up terminating the connection afterwards before streaming anything.
            // of course, if the client completes the subscription, this loop will
            // break and therefore stop the stream (it wont reconnect)
            retryingErr = null;
            retries = 0;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            sink.next(result as any);
          }

          complete = null; // completed by the server

          return control.abort();
        } catch (err) {
          if (control.signal.aborted) return await complete?.();

          // all non-network errors are worth reporting immediately
          if (!(err instanceof NetworkError)) {
            control.abort(); // TODO: tests for making sure the control's aborted
            throw err;
          }

          // was a network error, get rid of the current connection to ensure retries
          // but only if the client is running in lazy mode (otherwise the non-lazy lock will get rid of the connection)
          if (lazy) {
            conn = undefined;
          }

          // retries are not allowed or we tried to many times, report error
          if (!retryAttempts || retries >= retryAttempts) {
            control.abort(); // TODO: tests for making sure the control's aborted
            throw err;
          }

          // try again
          retryingErr = err;
        } finally {
          // release lock if subscription is aborted
          if (control.signal.aborted && --locks === 0) {
            if (isFinite(lazyCloseTimeout) && lazyCloseTimeout > 0) {
              // allow for the specified calmdown time and then close the
              // connection, only if no lock got created in the meantime and
              // if the connection is still open
              setTimeout(() => {
                if (!locks) connCtrl.abort();
              }, lazyCloseTimeout);
            } else {
              // otherwise close immediately
              connCtrl.abort();
            }
          }
        }
      }
    })()
      .then(() => sink.complete())
      .catch((err) => sink.error(err));

    return () => control.abort();
  }

  return {
    subscribe,
    iterate(request, on) {
      const pending: ExecutionResult<
        // TODO: how to not use `any` and not have a redundant function signature?
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        any
      >[] = [];
      const deferred = {
        done: false,
        error: null as unknown,
        resolve: () => {
          // noop
        },
      };
      const dispose = subscribe(
        request,
        {
          next(val) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            pending.push(val as any);
            deferred.resolve();
          },
          error(err) {
            deferred.done = true;
            deferred.error = err;
            deferred.resolve();
          },
          complete() {
            deferred.done = true;
            deferred.resolve();
          },
        },
        on,
      );

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
        }
        return { done: true, value: undefined };
      };
      iterator.return = async () => {
        dispose();
        return { done: true, value: undefined };
      };

      return iterator;
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
 * To avoid bundling DOM typings (because the client can run in Node env too),
 * you should supply the `Response` generic depending on your Fetch implementation.
 *
 * @category Client
 */
export class NetworkError<
  Response extends ResponseLike = ResponseLike,
> extends Error {
  /**
   * The underlying response that's considered an error.
   *
   * Will be undefined when no response is received,
   * instead an unexpected network error.
   */
  public response: Response | undefined;

  constructor(msgOrErrOrResponse: string | Error | Response) {
    let message, response: Response | undefined;
    if (isResponseLike(msgOrErrOrResponse)) {
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
}

interface ResponseLike {
  readonly ok: boolean;
  readonly status: number;
  readonly statusText: string;
}

function isResponseLike(val: unknown): val is ResponseLike {
  return (
    isObject(val) &&
    typeof val['ok'] === 'boolean' &&
    typeof val['status'] === 'number' &&
    typeof val['statusText'] === 'string'
  );
}

interface Connection {
  url: string;
  headers: Record<string, string> | undefined;
  waitForThrow: () => Promise<void>;
  getResults: (options?: {
    signal: AbortSignal;
    operationId: string;
  }) => AsyncIterable<ExecutionResult | ExecutionPatchResult>;
}

interface ConnectOptions<SingleConnection extends boolean> {
  signal: AbortSignal;
  url: string;
  credentials: 'omit' | 'same-origin' | 'include';
  referrer?: string;
  referrerPolicy?:
    | 'no-referrer'
    | 'no-referrer-when-downgrade'
    | 'same-origin'
    | 'origin'
    | 'strict-origin'
    | 'origin-when-cross-origin'
    | 'strict-origin-when-cross-origin'
    | 'unsafe-url';
  headers?: Record<string, string> | undefined;
  body?: string;
  fetchFn: typeof fetch;
  onMessage:
    | ((message: StreamMessage<SingleConnection, StreamEvent>) => void)
    | undefined;
}

async function connect<SingleConnection extends boolean>(
  options: ConnectOptions<SingleConnection>,
): Promise<Connection> {
  const {
    signal,
    url,
    credentials,
    headers,
    body,
    referrer,
    referrerPolicy,
    fetchFn,
    onMessage,
  } = options;

  const waiting: {
    [id: string]: { proceed: () => void };
  } = {};
  const queue: {
    [id: string]: (ExecutionResult | ExecutionPatchResult | 'complete')[];
  } = {};

  let res;
  try {
    res = await fetchFn(url, {
      signal,
      method: body ? 'POST' : 'GET',
      credentials,
      referrer,
      referrerPolicy,
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
  let waitingForThrow: ((error: unknown) => void) | undefined;
  (async () => {
    try {
      const parse = createParser<SingleConnection>();

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      for await (const chunk of toAsyncIterable(res.body!)) {
        if (typeof chunk === 'string')
          throw (error = new Error(`Unexpected string chunk "${chunk}"`)); // set error as fatal indicator

        // read chunk and if messages are ready, yield them
        let msgs;
        try {
          msgs = parse(chunk);
        } catch (err) {
          throw (error = err); // set error as fatal indicator
        }
        if (!msgs) continue;

        for (const msg of msgs) {
          try {
            onMessage?.(msg);
          } catch (err) {
            throw (error = err); // set error as fatal indicator
          }

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
              throw (error = new Error(
                `Unexpected message event "${msg.event}"`,
              )); // set error as fatal indicator
          }

          waiting[operationId]?.proceed();
        }
      }

      // some browsers (like Safari) closes the connection without errors even on abrupt server shutdowns,
      // we therefore make sure that no stream is active and waiting for results (not completed)
      if (Object.keys(waiting).length) {
        throw new Error('Connection closed while having active streams');
      }
    } catch (err) {
      if (!error && Object.keys(waiting).length) {
        // we assume the error is most likely a NetworkError because there are listeners waiting for events.
        // additionally, the `error` is another indicator because we set it early if the error is considered fatal
        error = new NetworkError(err);
      } else {
        error = err;
      }
      waitingForThrow?.(error);
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
function toAsyncIterable(
  val: ReadableStream | NodeJS.ReadableStream,
): AsyncIterable<string | Buffer | Uint8Array> {
  // node stream is already async iterable
  if (typeof Object(val)[Symbol.asyncIterator] === 'function') {
    val = val as NodeJS.ReadableStream;
    return val;
  }

  // convert web stream to async iterable
  return (async function* () {
    const reader = (val as ReadableStream).getReader();
    let result;
    do {
      result = await reader.read();
      if (result.value !== undefined) yield result.value;
    } while (!result.done);
  })();
}
