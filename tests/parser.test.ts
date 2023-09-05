import { it } from 'vitest';
import { createParser } from '../src/parser';

const encoder = new TextEncoder();

it('should parse whole message', ({ expect }) => {
  const parse = createParser();

  // with space
  expect(
    parse(encoder.encode('event: next\ndata: { "iAm": "data" }\n\n')),
  ).toMatchSnapshot();

  // no space
  expect(
    parse(encoder.encode('event:next\ndata:{ "iAm": "data" }\n\n')),
  ).toMatchSnapshot();

  // no data
  expect(parse(encoder.encode('event: complete\n\n'))).toMatchSnapshot();
});

it('should parse message with prepended ping', ({ expect }) => {
  const parse = createParser();

  expect(
    parse(encoder.encode(':\n\nevent:next\ndata:{ "iAm": "data" }\n\n')),
  ).toMatchSnapshot();
});

it('should parse chunked message', ({ expect }) => {
  const parse = createParser();

  parse(encoder.encode('even'));
  parse(encoder.encode(''));
  parse(encoder.encode('t: ne'));
  parse(encoder.encode('xt\nda'));
  parse(encoder.encode('ta:{'));
  parse(encoder.encode(''));
  parse(encoder.encode(' "iAm'));
  const msg = parse(encoder.encode('": "data" }\n\n'));

  expect(msg).toMatchSnapshot();
});

it('should parse message whose lines are separated by \\r\\n', ({ expect }) => {
  const parse = createParser();

  const msg = parse(
    encoder.encode('event: next\r\ndata: { "iAm": "data" }\r\n\r\n'),
  );

  expect(msg).toMatchSnapshot();
});

it('should ignore comments', ({ expect }) => {
  const parse = createParser();

  const msg = parse(
    encoder.encode(': I am comment\nevent: next\ndata: { "iAm": "data" }\n\n'),
  );

  expect(msg).toMatchSnapshot();
});

it('should accept valid events only', ({ expect }) => {
  expect(() => {
    const parse = createParser();
    parse(encoder.encode('event: done\ndata: {}\n\n'));
  }).toThrowErrorMatchingSnapshot();

  expect(() => {
    const parse = createParser();
    parse(encoder.encode('event: value\ndata: {}\n\n'));
  }).toThrowErrorMatchingSnapshot();

  expect(() => {
    const parse = createParser();
    parse(encoder.encode('event: next\ndata: {}\n\n'));
  }).not.toThrow();

  expect(() => {
    const parse = createParser();
    parse(encoder.encode('event: complete\ndata: {}\n\n'));
  }).not.toThrow();
});

it('should ignore server pings', ({ expect }) => {
  const parse = createParser();

  expect(parse(encoder.encode(':\n\n'))).toEqual([]);
});

it('should parse multiple messages from one chunk', ({ expect }) => {
  const parse = createParser();

  expect(
    parse(
      encoder.encode(
        'event: next\ndata: {}\n\n' + 'event: next\ndata: { "no": "data" }\n\n',
      ),
    ),
  ).toMatchSnapshot();

  expect(
    parse(
      encoder.encode(
        'event: next\ndata: { "almost": "done" }\n\n' +
          'event: complete\ndata: {}\n\n',
      ),
    ),
  ).toMatchSnapshot();
});
