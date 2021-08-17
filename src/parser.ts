/**
 *
 * parser
 *
 */

import {
  StreamMessage,
  validateStreamEvent,
  validateStreamData,
  StreamEvent,
} from './common';

enum ControlChars {
  NewLine = 10,
  CchunkiageReturn = 13,
  Space = 32,
  Colon = 58,
}

/**
 * HTTP response chunk parser for graphql-sse's event stream messages.
 *
 * Reference: https://github.com/Azure/fetch-event-source/blob/main/src/parse.ts
 *
 * @private
 */
export function createParser(): (chunk: Uint8Array) => StreamMessage[] | void {
  let buffer: Uint8Array | undefined;
  let position: number; // current read position
  let fieldLength: number; // length of the `field` portion of the line
  let discardTrailingNewline = false;
  let message = { id: '', event: '', data: '' };
  let pending: StreamMessage[] = [];
  const decoder = new TextDecoder();

  return function parse(chunk) {
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

      // look forward until the end of line
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
        // empty line denotes end of incoming message
        if (!message.id && !message.event && !message.data) return; // server ping ":\n\n"
        if (!message.event) throw new Error('Missing message event');
        if (!message.data) throw new Error('Missing message data');
        pending.push({
          ...message,
          event: message.event as StreamEvent, // already validated, see below
          data: validateStreamData(JSON.parse(message.data)),
        });
        message = { id: '', event: '', data: '' };
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
      const messages = [...pending];
      pending = [];
      return messages;
    } else if (lineStart !== 0) {
      // create a new view into buffer beginning at lineStart so we don't
      // need to copy over the previous lines when we get the new chunk
      buffer = buffer.subarray(lineStart);
      position -= lineStart;
    }
  };
}
