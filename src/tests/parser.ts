import { createParser } from '../parser';

const encoder = new TextEncoder();

it('should parse whole message', () => {
  const parse = createParser();

  // with space
  expect(
    parse(encoder.encode('id: 1\nevent: value\ndata: { "iAm": "data" }\n\n')),
  ).toMatchSnapshot();

  // no space
  expect(
    parse(encoder.encode('id:1\nevent:value\ndata:{ "iAm": "data" }\n\n')),
  ).toMatchSnapshot();

  // no data or id
  expect(parse(encoder.encode('event: done\n\n'))).toMatchSnapshot();
});

it('should parse chunked message', () => {
  const parse = createParser();

  parse(encoder.encode('id: 1\neven'));
  parse(encoder.encode(''));
  parse(encoder.encode('t: val'));
  parse(encoder.encode('ue\nda'));
  parse(encoder.encode('ta:{'));
  parse(encoder.encode(''));
  parse(encoder.encode(' "iAm'));
  const msg = parse(encoder.encode('": "data" }\n\n'));

  expect(msg).toMatchSnapshot();
});

it('should parse message whose lines are separated by \\r\\n', () => {
  const parse = createParser();

  const msg = parse(
    encoder.encode('id: 1\r\nevent: value\r\ndata: { "iAm": "data" }\r\n\r\n'),
  );

  expect(msg).toMatchSnapshot();
});

it('should ignore comments', () => {
  const parse = createParser();

  const msg = parse(
    encoder.encode(': I am comment\nevent: value\ndata: { "iAm": "data" }\n\n'),
  );

  expect(msg).toMatchSnapshot();
});

it('should accept valid events only', () => {
  expect(() => {
    const parse = createParser();
    parse(encoder.encode('event: complete\ndata: {}\n\n'));
  }).toThrowErrorMatchingSnapshot();

  expect(() => {
    const parse = createParser();
    parse(encoder.encode('event: next\ndata: {}\n\n'));
  }).toThrowErrorMatchingSnapshot();

  expect(() => {
    const parse = createParser();
    parse(encoder.encode('event: value\ndata: {}\n\n'));
  }).not.toThrow();

  expect(() => {
    const parse = createParser();
    parse(encoder.encode('event: done\ndata: {}\n\n'));
  }).not.toThrow();
});

it('should ignore server pings', () => {
  const parse = createParser();

  expect(parse(encoder.encode(':\n\n'))).toBeUndefined();
});

it('should parse multiple messages from one chunk', () => {
  const parse = createParser();

  expect(
    parse(
      encoder.encode(
        'id: 1\nevent: value\ndata: {}\n\n' +
          'id: 2\nevent: value\ndata: { "no": "data" }\n\n',
      ),
    ),
  ).toMatchSnapshot();

  expect(
    parse(
      encoder.encode(
        'id: 3\nevent: value\ndata: { "almost": "done" }\n\n' +
          'id: 4\nevent: done\ndata: {}\n\n',
      ),
    ),
  ).toMatchSnapshot();
});
