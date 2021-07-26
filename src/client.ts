/**
 *
 * client
 *
 */

import {
  StreamMessage,
  validateStreamEvent,
  validateStreamData,
  RequestParams,
} from './common';

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
  const headers =
    typeof options.headers === 'function'
      ? await options.headers()
      : options.headers;
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

    const read = messageReader();
    for await (const chunk of toAsyncIterator(res.body)) {
      if (typeof chunk === 'string')
        throw new Error(`Unexpected string chunk "${chunk}"`);

      // read chunk and if message is ready, yield it
      const msg = read(chunk);
      if (!msg) continue;

      yield msg;
    }
  } catch (err) {
    if (control.signal.aborted) return; // complete on abort
    throw err; // throw other errors
  }
}

/** @private */
enum ControlChars {
  NewLine = 10,
  CchunkiageReturn = 13,
  Space = 32,
  Colon = 58,
}

/**
 * HTTP response chunk reader marshaling to EventSource messages.
 *
 * Reference: https://github.com/Azure/fetch-event-source/blob/main/src/parse.ts
 *
 * @private
 */
function messageReader(): (chunk: Uint8Array) => StreamMessage | void {
  let buffer: Uint8Array | undefined;
  let position: number; // current read position
  let fieldLength: number; // length of the `field` portion of the line
  let discardTrailingNewline = false;
  let message = { id: '', event: '', data: '' };
  const decoder = new TextDecoder();

  return function onChunk(chunk) {
    if (buffer === undefined) {
      buffer = chunk;
      position = 0;
      fieldLength = -1;
    } else {
      const concat = new Uint8Array(buffer.length + chunk.length);
      concat.set(buffer);
      concat.set(chunk, buffer.length);
      buffer = concat;
    }

    const bufLength = buffer.length;
    let lineStart = 0; // index where the current line starts
    while (position < bufLength) {
      if (discardTrailingNewline) {
        if (buffer[position] === ControlChars.NewLine) {
          lineStart = ++position; // skip to next char
        }
        discardTrailingNewline = false;
      }

      // look forward untill the end of line
      let lineEnd = -1; // index of the \r or \n char
      for (; position < bufLength && lineEnd === -1; ++position) {
        switch (buffer[position]) {
          case ControlChars.Colon:
            if (fieldLength === -1) {
              // first colon in line
              fieldLength = position - lineStart;
            }
            break;
          // \r case below should fallthrough to \n:
          case ControlChars.CchunkiageReturn:
            discardTrailingNewline = true;
          // eslint-disable-next-line no-fallthrough
          case ControlChars.NewLine:
            lineEnd = position;
            break;
        }
      }

      if (lineEnd === -1) {
        // end of the buffer but the line hasn't ended
        break;
      } else if (lineStart === lineEnd) {
        // empty line denotes end of message, return it and prepare a new one
        const msg = {
          ...message,
          event: validateStreamEvent(message.event),
          data: validateStreamData(JSON.parse(message.data)),
        };
        message = { id: '', event: '', data: '' };
        return msg;
      } else if (fieldLength > 0) {
        // end of line indicates message
        const line = buffer.subarray(lineStart, lineEnd);

        // exclude comments and lines with no values
        // line is of format "<field>:<value>" or "<field>: <value>"
        // https://html.spec.whatwg.org/multipage/server-sent-events.html#event-stream-interpretation
        const field = decoder.decode(line.subarray(0, fieldLength));
        const valueOffset =
          fieldLength + (line[fieldLength + 1] === ControlChars.Space ? 2 : 1);
        const value = decoder.decode(line.subarray(valueOffset));

        switch (field) {
          case 'id':
            message.id = value;
            break;
          case 'event':
            message.event = validateStreamEvent(value);
            break;
          case 'data':
            // append the new value if the message has data
            message.data = message.data ? message.data + '\n' + value : value;
            break;
          case 'retry':
            // TODO-db-210722 we dont expect retries from the SSE server, should we?
            throw new Error('Unexpected "retry" message');
        }
      }

      // next line
      lineStart = position;
      fieldLength = -1;
    }

    if (lineStart === bufLength) {
      // finished reading
      buffer = undefined;
    } else if (lineStart !== 0) {
      // create a new view into buffer beginning at lineStart so we don't
      // need to copy over the previous lines when we get the new chunk
      buffer = buffer.subarray(lineStart);
      position -= lineStart;
    }
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
      const chunk = await reader.read();
      if (chunk.done) return chunk.value;
      yield chunk.value;
    }
  })();
}
