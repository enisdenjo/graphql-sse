/**
 *
 * client
 *
 */

import { createParser } from './parser';
import { RequestParams, Sink, StreamDataForID } from './common';
import { ExecutionResult } from 'graphql';

/** This file is the entry point for browsers, re-export common elements. */
export * from './common';

/** @category Client */
export interface ClientOptions {
  /**
   * Reuses a single SSE connection for all GraphQL operations.
   *
   * When instantiating with `false`, a new  SSE connection will
   * be established on each subscribe.
   *
   * @default true
   */
  singleConnection?: boolean;
  /**
   * Controls when should the connection be established.
   *
   * - `false`: Establish a connection immediately.
   * - `true`: Establish a connection on first subscribe and close on last unsubscribe.
   *
   * @default true
   */
  lazy?: boolean;
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
   * `retries` argument counts actual connection attempts, so it will begin with
   * 0 after the first retryable disconnect.
   *
   * Throwing an error will error out all subscribers and stop the retries.
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
   * Use the provided `AbortSignal` for completing the subscription.
   */
  subscribe<T = unknown>(
    signal: AbortSignal,
    payload: RequestParams,
  ): AsyncIterableIterator<T>;
}

/**
 * Creates a disposable GraphQL over SSE client to transmit
 * GraphQL operation results.
 *
 * Consider using `singleConnection = false` when dealing with HTTP/1
 * only servers which have SSE connection limitations on browsers.
 *
 * @category Client
 */
export function createClient(options: ClientOptions): Client {
  const {
    singleConnection = true,
    lazy = true,
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

  // TODO-db-210815 implement
  if (!singleConnection)
    throw new Error('Multi connection mode not implemented');

  // TODO-db-210815 implement
  if (!lazy) throw new Error('Non-lazy mode not implemented');

  let connCtrl = new AbortController(),
    conn: Promise<Connection> | undefined,
    token = '',
    locks = 0,
    retryingErr = null as unknown,
    retries = 0;
  async function getOrConnect(): Promise<Connection> {
    return await (conn ??
      (conn = (async () => {
        if (retryingErr) {
          if (retries > retryAttempts) throw retryingErr;
          await retry(retries);

          // connection might've been aborted while waiting for retry
          if (connCtrl.signal.aborted) throw new Error('Connection aborted');

          // TODO-db-210726 use last-event-id
          retries++;
        }

        // we must create a new controller here because lazy mode aborts currently active ones
        connCtrl = new AbortController();
        connCtrl.signal.addEventListener('abort', () => (conn = undefined));

        const url =
          typeof options.url === 'function' ? await options.url() : options.url;
        if (connCtrl.signal.aborted) throw new Error('Connection aborted');

        const headers =
          typeof options.headers === 'function'
            ? await options.headers()
            : options.headers ?? {};
        if (connCtrl.signal.aborted) throw new Error('Connection aborted');

        // TODO-db-210815 allow the user to provide and store the token
        // PUT/register only when no existing token
        if (!token) {
          const res = await fetchFn(url, {
            signal: connCtrl.signal,
            method: 'PUT',
            headers,
          });
          if (res.status !== 201) throw res;
          headers['x-graphql-stream-token'] = token = await res.text();
        }

        const connected = await connect({
          signal: connCtrl.signal,
          headers,
          url,
          fetchFn,
        });
        retryingErr = null; // future connects are not retries
        retries = 0; // reset the retries on connect

        return connected;
      })()));
  }

  return {
    async *subscribe(signal, payload) {
      locks++;
      const id = generateID();

      let completed = false;
      function complete() {
        if (completed) return;
        completed = true;

        // release lock and disconnect if no locks are present
        if (--locks === 0) connCtrl.abort();
      }
      signal.addEventListener('abort', complete);

      payload = {
        ...payload,
        extensions: { ...payload.extensions, operationId: id },
      };

      for (;;) {
        try {
          const { url, getResultsUntilDone } = await getOrConnect();

          const res = await fetchFn(url, {
            signal,
            method: 'POST',
            headers: {
              'x-graphql-stream-token': token,
            },
            body: JSON.stringify(payload),
          });
          if (res.status !== 202) throw res;

          for await (const result of getResultsUntilDone(id)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            yield result as any;
          }

          return complete();
        } catch (err) {
          if (signal.aborted) return; // aborted, shouldnt try again
          throw err;
          retryingErr = err; // TODO-db-210810 implement retrying
        }
      }
    },
  };
}

/**
 * A utility function that emits iterator values and events
 * to the passed sink.
 *
 * @category Client
 */
export async function asyncIteratorToSink<T = unknown>(
  iterator: AsyncIterableIterator<T>,
  sink: Sink<T>,
): Promise<void> {
  try {
    for await (const value of iterator) {
      sink.next(value);
    }
    sink.complete();
  } catch (err) {
    sink.error(err);
  }
}

/** @private */
interface Connection {
  url: string; // because it might change when supplying a function
  getResultsUntilDone: (id?: string) => AsyncIterableIterator<ExecutionResult>;
}

/** @private */
interface ConnectOptions {
  signal: AbortSignal;
  url: string;
  headers: Record<string, string> | undefined;
  body?: string;
  fetchFn: typeof fetch;
}

/** @private */
async function connect(options: ConnectOptions): Promise<Connection> {
  const { signal, url, headers, body, fetchFn } = options;

  // when id == '' then StreamData
  // else id != '' then StreamDataForID
  const waiting: {
    [id: string]: { proceed: () => void };
  } = {};
  const queue: { [id: string]: (ExecutionResult | 'done')[] } = {};

  let error: unknown = null,
    done = false;
  (async () => {
    try {
      const res = await fetchFn(url, {
        signal,
        method: 'POST',
        headers: {
          ...headers,
          accept: 'text/event-stream',
        },
        body,
      });
      if (!res.ok) throw res;
      if (!res.body) throw new Error('Missing response body');

      const parse = createParser();
      for await (const chunk of toAsyncIterator(res.body)) {
        if (typeof chunk === 'string')
          throw new Error(`Unexpected string chunk "${chunk}"`);

        // read chunk and if messages are ready, yield them
        const msgs = parse(chunk);
        if (!msgs) continue;

        for (const msg of msgs) {
          if (!msg.data) throw new Error('Message data missing');

          const id = 'id' in msg.data ? msg.data.id : '';
          if (!(id in queue)) throw new Error(`No queue for ID: "${id}"`);

          switch (msg.event) {
            case 'value':
              if ('id' in msg.data)
                queue[id].push(
                  // TODO-db-210815 derive instead of assert
                  (msg.data as StreamDataForID<'value'>).payload,
                );
              else queue[id].push(msg.data);
              break;
            case 'done':
              queue[id].push('done');
              break;
            default:
              throw new Error(`Unexpected message event "${msg.event}"`);
          }

          waiting[id]?.proceed();
        }
      }

      done = true;
    } catch (err) {
      error = err;
    } finally {
      Object.values(waiting).forEach(({ proceed }) => proceed());
    }
  })();

  return {
    url,
    async *getResultsUntilDone(
      // when id == undefined then StreamData
      // else id != undefined then StreamDataForID
      id = '',
    ) {
      if (id in queue)
        throw new Error(`Queue already registered for ID: "${id}"`);

      queue[id] = [];

      try {
        for (;;) {
          if (signal.aborted) return;

          while (queue[id].length) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const result = queue[id].shift()!;
            if (result === 'done') return;
            yield result;
          }
          if (error) throw error;
          if (done) return;

          // wait for action or abort
          await new Promise<void>((resolve) => {
            const proceed = () => {
              signal.removeEventListener('abort', proceed);
              resolve();
            };
            signal.addEventListener('abort', proceed);
            waiting[id] = { proceed };
          }).then(() => delete waiting[id]);
        }
      } finally {
        delete queue[id];
      }
    },
  };
}

/**
 * Isomorphic ReadableStream to AsyncIterator converter.
 *
 * @private
 */
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
