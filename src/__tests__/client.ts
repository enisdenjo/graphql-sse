import { jest } from '@jest/globals';
import { createClient, StreamMessage, StreamEvent } from '../client';
import { createTFetch } from './utils/tfetch';
import { tsubscribe } from './utils/tsubscribe';
import { pong } from './fixtures/simple';
import { sleep } from './utils/testkit';

function noop() {
  // do nothing
}

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
    [
      {
        "data": {
          "id": "veryunique",
          "payload": {
            "data": {
              "getValue": "value",
            },
          },
        },
        "event": "next",
      },
      {
        "data": {
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
    [
      {
        "data": {
          "data": {
            "getValue": "value",
          },
        },
        "event": "next",
      },
      {
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

  await dispose();

  await expect(sub.waitForError()).resolves.toMatchInlineSnapshot(
    `[NetworkError: Connection closed while having active streams]`,
  );
});

it('should report error to sink if server goes away during generator emission', async () => {
  const { fetch, dispose } = createTFetch();

  const client = createClient({
    fetchFn: fetch,
    url: 'http://localhost',
    retryAttempts: 0,
  });

  const sub = tsubscribe(client, {
    query: 'subscription { slowGreetings }',
  });
  await sub.waitForNext();

  await dispose();

  await expect(sub.waitForError()).resolves.toMatchInlineSnapshot(
    `[NetworkError: Connection closed while having active streams]`,
  );
});

describe('single connection mode', () => {
  it('should not call complete after subscription error', async () => {
    const { fetch } = createTFetch();

    const client = createClient({
      singleConnection: true,
      url: 'http://localhost',
      fetchFn: fetch,
      retryAttempts: 0,
    });

    const sub = tsubscribe(client, {
      query: '}}',
    });

    await expect(
      Promise.race([sub.waitForError(), sub.waitForComplete()]),
    ).resolves.toMatchInlineSnapshot(
      `[NetworkError: Server responded with 400: Bad Request]`,
    );
  });

  it('should execute a simple query', async () => {
    const { fetch } = createTFetch();

    const client = createClient({
      singleConnection: true,
      url: 'http://localhost',
      fetchFn: fetch,
      retryAttempts: 0,
    });

    const sub = tsubscribe(client, {
      query: '{ getValue }',
    });

    await expect(sub.waitForNext()).resolves.toMatchInlineSnapshot(`
      {
        "data": {
          "getValue": "value",
        },
      }
    `);

    await sub.waitForComplete();
  });

  it('should complete subscriptions when disposing them', async () => {
    const { fetch } = createTFetch();

    const client = createClient({
      singleConnection: true,
      url: 'http://localhost',
      fetchFn: fetch,
      retryAttempts: 0,
      lazy: true,
    });

    const key = Math.random().toString();
    const sub = tsubscribe(client, {
      query: `subscription { ping(key: "${key}") }`,
    });

    setTimeout(() => pong(key), 0);

    await expect(sub.waitForNext()).resolves.toMatchInlineSnapshot(`
      {
        "data": {
          "ping": "pong",
        },
      }
    `);

    sub.dispose();

    await sub.waitForComplete();
  });

  describe('lazy', () => {
    it('should connect on first subscribe and disconnect on last complete', async () => {
      const { fetch, waitForOperation, waitForRequest } = createTFetch();

      const client = createClient({
        singleConnection: true,
        lazy: true,
        url: 'http://localhost',
        fetchFn: fetch,
        retryAttempts: 0,
      });

      const sub1 = tsubscribe(client, {
        query: `subscription { ping(key: "${Math.random()}") }`,
      });
      await waitForOperation();

      // put
      await waitForRequest();
      // stream
      const streamReq = await waitForRequest();

      const sub2 = tsubscribe(client, {
        query: `subscription { ping(key: "${Math.random()}") }`,
      });
      await waitForOperation();

      sub1.dispose();
      await sub1.waitForComplete();
      await sleep(20);
      expect(streamReq.signal.aborted).toBeFalsy();

      sub2.dispose();
      await sub2.waitForComplete();
      await sleep(20);
      expect(streamReq.signal.aborted).toBeTruthy();
    });

    it('should disconnect after the lazyCloseTimeout has passed after last unsubscribe', async () => {
      const { fetch, waitForOperation, waitForRequest } = createTFetch();

      const client = createClient({
        singleConnection: true,
        lazy: true, // default
        lazyCloseTimeout: 20,
        url: 'http://localhost',
        fetchFn: fetch,
        retryAttempts: 0,
      });

      const sub = tsubscribe(client, {
        query: `subscription { ping(key: "${Math.random()}") }`,
      });
      await waitForOperation();

      // put
      await waitForRequest();
      // stream
      const streamReq = await waitForRequest();

      sub.dispose();
      await sub.waitForComplete();

      await sleep(10);
      // still connected due to timeout
      expect(streamReq.signal.aborted).toBeFalsy();

      await sleep(10);
      // but will disconnect after timeout
      expect(streamReq.signal.aborted).toBeTruthy();
    });
  });

  describe('non-lazy', () => {
    it('should connect as soon as the client is created and disconnect when disposed', async () => {
      const { fetch, waitForRequest } = createTFetch();

      const client = createClient({
        singleConnection: true,
        url: 'http://localhost',
        fetchFn: fetch,
        retryAttempts: 0,
        lazy: false,
        onNonLazyError: noop, // avoiding premature close errors
      });

      // put
      await waitForRequest();
      // stream
      const stream = await waitForRequest();

      client.dispose();

      expect(stream.signal.aborted).toBeTruthy();
    });
  });

  it('should respect retry attempts when server goes away after connecting', async () => {
    const { fetch, waitForRequest, dispose } = createTFetch();

    const client = createClient({
      singleConnection: true,
      fetchFn: fetch,
      url: 'http://localhost',
      retryAttempts: 2,
      retry: () => Promise.resolve(),
    });

    const sub = tsubscribe(client, {
      query: `subscription { ping(key: "${Math.random()}") }`,
    });

    // start
    await waitForRequest(); // reservation
    await waitForRequest(); // connect
    await waitForRequest(); // operation
    await dispose();

    // 1st retry
    await waitForRequest(); // reservation
    await waitForRequest(); // connect
    await waitForRequest(); // operation
    await dispose();

    // 2nd retry
    await waitForRequest(); // reservation
    await waitForRequest(); // connect
    await waitForRequest(); // operation
    await dispose();

    // no more retries
    await expect(
      Promise.race([waitForRequest(), sub.waitForError()]),
    ).resolves.toMatchInlineSnapshot(
      `[NetworkError: Connection closed while having active streams]`,
    );
  });
});

describe('distinct connections mode', () => {
  it('should not call complete after subscription error', async () => {
    const { fetch } = createTFetch();

    const client = createClient({
      url: 'http://localhost',
      fetchFn: fetch,
      retryAttempts: 0,
    });

    const sub = tsubscribe(client, {
      query: '}}',
    });

    await sub.waitForError();

    await Promise.race([
      sleep(20),
      sub.waitForComplete().then(() => {
        throw new Error("Shouldn't have completed");
      }),
    ]);
  });

  it('should establish separate connections for each subscribe', async () => {
    const { fetch, waitForRequest, waitForOperation } = createTFetch();

    const client = createClient({
      singleConnection: false,
      url: 'http://localhost',
      retryAttempts: 0,
      fetchFn: fetch,
    });

    const sub1 = tsubscribe(client, {
      query: `subscription { ping(key: "${Math.random()}") }`,
    });
    await waitForOperation();
    const stream1 = await waitForRequest();

    const sub2 = tsubscribe(client, {
      query: `subscription { ping(key: "${Math.random()}") }`,
    });
    await waitForOperation();
    const stream2 = await waitForRequest();

    sub1.dispose();
    await Promise.race([sub1.throwOnError(), sub1.waitForComplete()]);
    expect(stream1.signal.aborted).toBeTruthy();

    sub2.dispose();
    await Promise.race([sub2.throwOnError(), sub2.waitForComplete()]);
    expect(stream2.signal.aborted).toBeTruthy();
  });

  it('should complete all connections when client disposes', async () => {
    const { fetch, waitForRequest, waitForOperation } = createTFetch();

    const client = createClient({
      singleConnection: false,
      url: 'http://localhost',
      retryAttempts: 0,
      fetchFn: fetch,
    });

    tsubscribe(client, {
      query: `subscription { ping(key: "${Math.random()}") }`,
    });
    await waitForOperation();
    const stream1 = await waitForRequest();

    tsubscribe(client, {
      query: `subscription { ping(key: "${Math.random()}") }`,
    });
    await waitForOperation();
    const stream2 = await waitForRequest();

    client.dispose();

    expect(stream1.signal.aborted).toBeTruthy();
    expect(stream2.signal.aborted).toBeTruthy();
  });

  it('should respect retry attempts when server goes away after connecting', async () => {
    const { fetch, waitForRequest, dispose } = createTFetch();

    const client = createClient({
      singleConnection: false,
      fetchFn: fetch,
      url: 'http://localhost',
      retryAttempts: 2,
      retry: () => Promise.resolve(),
    });

    const sub = tsubscribe(client, {
      query: `subscription { ping(key: "${Math.random()}") }`,
    });

    // start
    await waitForRequest();
    await dispose();

    // 1st retry
    await waitForRequest();
    await dispose();

    // 2nd retry
    await waitForRequest();
    await dispose();

    // no more retries
    await expect(
      Promise.race([waitForRequest(), sub.waitForError()]),
    ).resolves.toMatchInlineSnapshot(
      `[NetworkError: Connection closed while having active streams]`,
    );
  });
});

describe('retries', () => {
  it('should keep retrying network errors until the retry attempts are exceeded', async () => {
    let tried = 0;
    const { fetch } = createTFetch({
      authenticate() {
        tried++;
        return [null, { status: 403, statusText: 'Forbidden' }];
      },
    });

    // non-lazy
    tried = 0;
    await new Promise<void>((resolve) => {
      const client = createClient({
        singleConnection: true,
        url: 'http://localhost',
        fetchFn: fetch,
        retryAttempts: 2,
        retry: () => Promise.resolve(),
        lazy: false,
        onNonLazyError: (err) => {
          expect(err).toMatchInlineSnapshot(
            `[NetworkError: Server responded with 403: Forbidden]`,
          );
          expect(tried).toBe(3); // initial + 2 retries
          resolve();
          client.dispose();
        },
      });
    });

    // lazy
    tried = 0;
    let client = createClient({
      singleConnection: true,
      url: 'http://localhost',
      fetchFn: fetch,
      retryAttempts: 2,
      retry: () => Promise.resolve(),
    });
    let sub = tsubscribe(client, { query: '{ getValue }' });
    await expect(sub.waitForError()).resolves.toMatchInlineSnapshot(
      `[NetworkError: Server responded with 403: Forbidden]`,
    );
    expect(tried).toBe(3); // initial + 2 retries
    client.dispose();

    // distinct connections mode
    tried = 0;
    client = createClient({
      singleConnection: false,
      url: 'http://localhost',
      fetchFn: fetch,
      retryAttempts: 2,
      retry: () => Promise.resolve(),
    });
    sub = tsubscribe(client, { query: '{ getValue }' });
    await expect(sub.waitForError()).resolves.toMatchInlineSnapshot(
      `[NetworkError: Server responded with 403: Forbidden]`,
    );
    expect(tried).toBe(3); // initial + 2 retries
    client.dispose();
  });

  it('should retry network errors even if they occur during event emission', async () => {
    const { fetch, dispose } = createTFetch();

    const retryFn = jest.fn(async () => {
      // noop
    });
    const client = createClient({
      url: 'http://localhost',
      fetchFn: fetch,
      retryAttempts: 1,
      retry: retryFn,
    });

    const sub = tsubscribe(client, {
      query: 'subscription { slowGreetings }',
    });

    await sub.waitForNext();

    await dispose();

    expect(retryFn).toHaveBeenCalled();

    client.dispose();
  });

  it('should not retry fatal errors occurring during event emission', async () => {
    const { fetch } = createTFetch();

    let msgsCount = 0;
    const fatalErr = new Error('Boom, I am fatal');
    const retryFn = jest.fn(async () => {
      // noop
    });

    const client = createClient({
      url: 'http://localhost',
      fetchFn: fetch,
      retryAttempts: 1,
      retry: retryFn,
      onMessage: () => {
        // onMessage is in the middle of stream processing, throwing from it is considered fatal
        msgsCount++;
        if (msgsCount > 3) {
          throw fatalErr;
        }
      },
    });

    const sub = tsubscribe(client, {
      query: 'subscription { slowGreetings }',
    });

    await sub.waitForNext();

    await expect(sub.waitForError()).resolves.toBe(fatalErr);

    expect(retryFn).not.toHaveBeenCalled();
  });
});

describe('iterate', () => {
  it('should iterate a single result query', async () => {
    const { fetch } = createTFetch();

    const client = createClient({
      url: 'http://localhost',
      fetchFn: fetch,
      retryAttempts: 0,
    });

    const iterator = client.iterate({
      query: '{ getValue }',
    });

    await expect(iterator.next()).resolves.toMatchInlineSnapshot(`
      {
        "done": false,
        "value": {
          "data": {
            "getValue": "value",
          },
        },
      }
    `);

    await expect(iterator.next()).resolves.toMatchInlineSnapshot(`
      {
        "done": true,
        "value": undefined,
      }
    `);
  });

  it('should iterate over subscription events', async () => {
    const { fetch } = createTFetch();

    const client = createClient({
      url: 'http://localhost',
      fetchFn: fetch,
      retryAttempts: 0,
    });

    const iterator = client.iterate({
      query: 'subscription { greetings }',
    });

    // Hi
    await expect(iterator.next()).resolves.toBeDefined();
    // Bonjour
    await expect(iterator.next()).resolves.toBeDefined();
    // Hola
    await expect(iterator.next()).resolves.toBeDefined();
    // Ciao
    await expect(iterator.next()).resolves.toBeDefined();
    // Zdravo
    await expect(iterator.next()).resolves.toBeDefined();

    await expect(iterator.next()).resolves.toMatchInlineSnapshot(`
      {
        "done": true,
        "value": undefined,
      }
    `);
  });

  it('should report execution errors to iterator', async () => {
    const { fetch } = createTFetch();

    const client = createClient({
      url: 'http://localhost',
      fetchFn: fetch,
      retryAttempts: 0,
    });

    const iterator = client.iterate({
      query: 'subscription { throwing }',
    });

    await expect(iterator.next()).resolves.toMatchInlineSnapshot(`
      {
        "done": false,
        "value": {
          "errors": [
            {
              "locations": [
                {
                  "column": 16,
                  "line": 1,
                },
              ],
              "message": "Kaboom!",
              "path": [
                "throwing",
              ],
            },
          ],
        },
      }
    `);

    await expect(iterator.next()).resolves.toMatchInlineSnapshot(`
      {
        "done": true,
        "value": undefined,
      }
    `);
  });

  it('should throw in iterator connection errors', async () => {
    const { fetch, dispose } = createTFetch();

    const client = createClient({
      fetchFn: fetch,
      url: 'http://localhost',
      retryAttempts: 0,
    });

    const pingKey = Math.random().toString();
    const iterator = client.iterate({
      query: `subscription { ping(key: "${pingKey}") }`,
    });

    pong(pingKey);
    await expect(iterator.next()).resolves.toMatchInlineSnapshot(`
      {
        "done": false,
        "value": {
          "data": {
            "ping": "pong",
          },
        },
      }
    `);

    await dispose();

    await expect(iterator.next()).rejects.toMatchInlineSnapshot(
      `[NetworkError: Connection closed while having active streams]`,
    );
  });

  it('should complete subscription when iterator loop breaks', async () => {
    const { fetch, waitForRequest } = createTFetch();

    const client = createClient({
      fetchFn: fetch,
      url: 'http://localhost',
      retryAttempts: 0,
    });

    const pingKey = Math.random().toString();
    const iterator = client.iterate({
      query: `subscription { ping(key: "${pingKey}") }`,
    });
    iterator.return = jest.fn(iterator.return);

    const req = await waitForRequest();

    setTimeout(() => pong(pingKey), 0);

    for await (const val of iterator) {
      expect(val).toMatchInlineSnapshot(`
        {
          "data": {
            "ping": "pong",
          },
        }
      `);
      break;
    }

    expect(iterator.return).toHaveBeenCalled();

    expect(req.signal.aborted).toBeTruthy();
  });

  it('should complete subscription when iterator loop throws', async () => {
    const { fetch, waitForRequest } = createTFetch();

    const client = createClient({
      fetchFn: fetch,
      url: 'http://localhost',
      retryAttempts: 0,
    });

    const pingKey = Math.random().toString();
    const iterator = client.iterate({
      query: `subscription { ping(key: "${pingKey}") }`,
    });
    iterator.return = jest.fn(iterator.return);

    const req = await waitForRequest();

    setTimeout(() => pong(pingKey), 0);

    await expect(async () => {
      for await (const val of iterator) {
        expect(val).toMatchInlineSnapshot(`
          {
            "data": {
              "ping": "pong",
            },
          }
        `);
        throw new Error(':)');
      }
    }).rejects.toBeDefined();

    expect(iterator.return).toHaveBeenCalled();

    expect(req.signal.aborted).toBeTruthy();
  });

  it('should complete subscription when calling return directly on iterator', async () => {
    const { fetch, waitForRequest } = createTFetch();

    const client = createClient({
      fetchFn: fetch,
      url: 'http://localhost',
      retryAttempts: 0,
    });

    const pingKey = Math.random().toString();
    const iterator = client.iterate({
      query: `subscription { ping(key: "${pingKey}") }`,
    });

    const req = await waitForRequest();

    pong(pingKey);

    await expect(iterator.next()).resolves.toMatchInlineSnapshot(`
      {
        "done": false,
        "value": {
          "data": {
            "ping": "pong",
          },
        },
      }
    `);

    await expect(iterator.return?.()).resolves.toMatchInlineSnapshot(`
      {
        "done": true,
        "value": undefined,
      }
    `);

    await expect(iterator.next()).resolves.toMatchInlineSnapshot(`
      {
        "done": true,
        "value": undefined,
      }
    `);

    expect(req.signal.aborted).toBeTruthy();
  });
});
