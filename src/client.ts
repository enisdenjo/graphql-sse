/**
 *
 * client
 *
 */

import { createParser } from './parser';
import { StreamMessage, RequestParams, StreamDataForID } from './common';

/** This file is the entry point for browsers, re-export common elements. */
export * from './common';

/**
 * Creates a GraphQL over SSE subscription through a distinct
 * SSE connection. Each subscribe creates a new connection.
 *
 * Beware, if your server is not HTTP/2 ready, the subscribe
 * limit (different between browsers) is quite low. Consider using
 * the `createClient` instead which reuses a single SSE connection.
 *
 * Supplied `AbortController` is used to complete/close the connection.
 *
 * @category Client
 */
export async function* subscribe<T = unknown>(
  options: { control: AbortController } & StreamOptions,
  payload: RequestParams,
): AsyncIterableIterator<T> {
  const { control } = options;
  for await (const msg of createStream(options, JSON.stringify(payload))) {
    switch (msg.event) {
      case 'value':
        // make sure the event stream data is correct and not mixed with ID based subscriptions
        if (!msg.data) throw new Error('Message data missing');
        if ('payload' in msg.data)
          throw new Error('Unexpected "payload" field in data');

        yield msg.data as T;
        continue;
      case 'done':
        control.abort();
        return;
      default:
        throw new Error(`Unexpected event "${msg.event}"`);
    }
  }
}

/** @category Client */
export interface ClientOptions extends StreamOptions {
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
  retry?: (retries: number, retryingErr: unknown) => Promise<void>;
}

/** @category Client */
export interface Client {
  /**
   * Subscribes to receive through the single SSE connection.
   *
   * Use the provided `AbortSignal` for completing the subscription.
   */
  subscribe<T = unknown>(
    signal: AbortSignal,
    payload: RequestParams,
  ): AsyncIterableIterator<T>;
}

/**
 * Creates a disposable GraphQL over SSE client that reuses
 * a single SSE connection to transmit GraphQL operation
 * results.
 *
 * Useful for HTTP/1 only servers which have SSE connection
 * limitations on browsers.
 *
 * @category Client
 */
export function createClient(options: ClientOptions): Client {
  const {
    retry = async function randomisedExponentialBackoff(retries, retryingErr) {
      if (retries > 5) throw retryingErr;
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

  type Connected = [
    url: string, // because it might change when supplying a function
    getPayloadUntilDone: (
      id: string,
    ) => AsyncIterableIterator<StreamDataForID<'value'>['payload']>,
  ];
  let connecting: Promise<Connected> | undefined,
    token = '',
    locks = 0,
    retryingErr = null as unknown,
    retries = 0;
  async function connect(signal: AbortSignal): Promise<Connected> {
    return await (connecting ??
      (connecting = (async () => {
        if (retryingErr) {
          await retry(retries, retryingErr);

          // subscriptions might complete while waiting for retry
          if (!locks) {
            connecting = undefined;
            throw new Error('All subscriptions gone');
          }

          retries++;
        }

        const control = new AbortController();

        const url =
          typeof options.url === 'function' ? await options.url() : options.url;
        const headers =
          typeof options.headers === 'function'
            ? await options.headers()
            : options.headers;

        // PUT/register only when no existing token
        if (!token) {
          const res = await fetchFn(url, {
            signal: control.signal,
            method: 'PUT',
            headers,
          });
          if (res.status !== 201) throw res;
          token = await res.text();
        }

        const waiting: {
          [id: string]: { proceed: () => void };
        } = {};
        const queue: { [id: string]: StreamMessage[] } = {};
        let error: unknown = null,
          done = false;
        (async () => {
          try {
            // TODO-db-210726 use last-event-id

            const stream = await createStream({
              ...options,
              control,
              url,
              headers: { ...headers, 'x-graphql-stream-token': token },
            });
            retryingErr = null; // future connects are not retries
            retries = 0; // reset the retries on connect

            for await (const msg of stream) {
              if (!msg.data) throw new Error('Message data missing');
              if (!('id' in msg.data))
                throw new Error('Message data ID missing');

              const id = msg.data.id;
              if (!(id in queue)) throw new Error(`No queue for ID: "${id}"`);

              queue[id].push(msg);
              waiting[id]?.proceed();
            }

            done = true;
          } catch (err) {
            error = err;
          } finally {
            connecting = undefined;
            Object.values(waiting).forEach(({ proceed }) => proceed());
          }
        })();

        return [
          url,
          async function* getPayloadUntilDone(id) {
            if (id in queue)
              throw new Error(`Queue already registered for ID: "${id}"`);

            queue[id] = [];

            try {
              for (;;) {
                if (signal.aborted) return;

                while (queue[id].length) {
                  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                  const { event, data } = queue[id].shift()!;
                  switch (event) {
                    case 'value':
                      if (!data) throw new Error('Message data missing');
                      if (!('payload' in data))
                        throw new Error('Missing data payload');
                      yield data.payload;
                      break;
                    case 'done':
                      return;
                    default:
                      throw new Error(`Unexpected event "${event}"`);
                  }
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
              if (locks === 0 && !control.signal.aborted) control.abort();
            }
          },
        ] as Connected;
      })()));
  }

  return {
    async *subscribe(signal, payload) {
      const id = ''; // TODO-db-210726

      locks++;
      signal.addEventListener('abort', () => locks--);

      payload = {
        ...payload,
        extensions: { ...payload.extensions, operationId: id },
      };

      for (;;) {
        try {
          const [url, getPayloadUntilDone] = await connect(signal);

          const res = await fetchFn(url, {
            signal,
            method: 'POST',
            headers: {
              'x-graphql-stream-token': token,
            },
            body: JSON.stringify(payload),
          });
          if (res.status !== 202) throw res;

          for await (const payload of getPayloadUntilDone(id)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            yield payload as any;
          }

          return; // aborted, shouldnt try again
        } catch (err) {
          if (signal.aborted) return; // aborted, shouldnt try again
          retryingErr = err;
        }
      }
    },
  };
}

/** @private */
interface StreamOptions {
  /**
   * URL of the GraphQL over SSE server to connect.
   *
   * If the option is a function, it will be called on each connection attempt.
   * Returning a Promise is supported too and the connecting phase will stall until it
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
   * Returning a Promise is supported too and the connecting phase will stall until it
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
}

/** @private */
async function* createStream(
  options: { control: AbortController } & StreamOptions,
  body?: string,
): AsyncGenerator<StreamMessage> {
  const { control } = options;

  const url =
    typeof options.url === 'function' ? await options.url() : options.url;
  if (control.signal.aborted) return;

  const headers =
    typeof options.headers === 'function'
      ? await options.headers()
      : options.headers;
  if (control.signal.aborted) return;

  const fetchFn = (options.fetchFn || fetch) as typeof fetch;

  try {
    const res = await fetchFn(url, {
      signal: control.signal,
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

      // read chunk and if message is ready, yield it
      const msg = parse(chunk);
      if (!msg) continue;

      yield msg;
    }
  } catch (err) {
    if (control.signal.aborted) return; // complete on abort
    throw err; // throw other errors
  }
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
      const chunk = await reader.read();
      if (chunk.done) return chunk.value;
      yield chunk.value;
    }
  })();
}
