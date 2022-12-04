import { createClient, StreamMessage, StreamEvent } from '../client';
import { createTFetch } from './utils/tfetch';
import { tsubscribe } from './utils/tsubscribe';

it('should use the provided headers', async () => {
  // single connection mode
  let headers!: Headers;
  let { fetch } = createTFetch({
    authenticate: (req) => {
      headers = req.raw.headers;
      return '';
    },
  });

  const singleConnClient = createClient({
    singleConnection: true,
    url: 'http://localhost',
    fetchFn: fetch,
    retryAttempts: 0,
    headers: () => {
      return { 'x-single': 'header' };
    },
  });

  let client = tsubscribe(singleConnClient, {
    query: '{ getValue }',
  });
  await Promise.race([client.throwOnError(), client.waitForComplete()]);
  client.dispose();

  expect(headers.get('x-single')).toBe('header');

  // distinct connections mode
  ({ fetch } = createTFetch({
    authenticate: (req) => {
      headers = req.raw.headers;
      return '';
    },
  }));

  const distinctConnClient = createClient({
    singleConnection: false,
    url: 'http://localhost',
    fetchFn: fetch,
    retryAttempts: 0,
    headers: () => {
      return { 'x-distinct': 'header' };
    },
  });

  client = tsubscribe(distinctConnClient, {
    query: '{ getValue }',
  });
  await Promise.race([client.throwOnError(), client.waitForComplete()]);
  client.dispose();

  expect(headers.get('x-distinct')).toBe('header');
});

it('should supply all valid messages received to onMessage', async () => {
  const { fetch } = createTFetch();

  // single connection mode
  let msgs: StreamMessage<boolean, StreamEvent>[] = [];
  let client = createClient({
    singleConnection: true,
    url: 'http://localhost',
    fetchFn: fetch,
    retryAttempts: 0,
    generateID: () => 'veryunique',
    onMessage: (msg) => msgs.push(msg),
  });
  let sub = tsubscribe(client, {
    query: '{ getValue }',
  });
  await Promise.race([sub.throwOnError(), sub.waitForComplete()]);
  expect(msgs).toMatchInlineSnapshot(`
    Array [
      Object {
        "data": Object {
          "id": "veryunique",
          "payload": Object {
            "data": Object {
              "getValue": "value",
            },
          },
        },
        "event": "next",
      },
      Object {
        "data": Object {
          "id": "veryunique",
        },
        "event": "complete",
      },
    ]
  `);

  // distinct connection mode
  msgs = [];
  client = createClient({
    singleConnection: false,
    url: 'http://localhost',
    fetchFn: fetch,
    retryAttempts: 0,
    generateID: () => 'veryunique',
    onMessage: (msg) => msgs.push(msg),
  });
  sub = tsubscribe(client, {
    query: '{ getValue }',
  });
  await Promise.race([sub.throwOnError(), sub.waitForComplete()]);
  expect(msgs).toMatchInlineSnapshot(`
    Array [
      Object {
        "data": Object {
          "data": Object {
            "getValue": "value",
          },
        },
        "event": "next",
      },
      Object {
        "data": null,
        "event": "complete",
      },
    ]
  `);
});

it('should report error to sink if server goes away', async () => {
  const { fetch, dispose } = createTFetch();

  const client = createClient({
    fetchFn: fetch,
    url: 'http://localhost',
    retryAttempts: 0,
  });

  const sub = tsubscribe(client, {
    query: `subscription { ping(key: "${Math.random()}") }`,
  });

  setTimeout(() => dispose(), 0);

  await expect(sub.waitForError()).resolves.toMatchInlineSnapshot(
    `[NetworkError: Connection closed while having active streams]`,
  );
});
