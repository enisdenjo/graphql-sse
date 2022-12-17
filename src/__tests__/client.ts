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

  dispose();

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

  dispose();

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
    const { fetch, waitForRequest } = createTFetch();

    const client = createClient({
      singleConnection: false,
      url: 'http://localhost',
      retryAttempts: 0,
      fetchFn: fetch,
    });

    const sub1 = tsubscribe(client, {
      query: `subscription { ping(key: "${Math.random()}") }`,
    });
    const stream1 = await waitForRequest();

    const sub2 = tsubscribe(client, {
      query: `subscription { ping(key: "${Math.random()}") }`,
    });
    const stream2 = await waitForRequest();

    sub1.dispose();
    await Promise.race([sub1.throwOnError(), sub1.waitForComplete()]);
    expect(stream1.signal.aborted).toBeTruthy();

    sub2.dispose();
    await Promise.race([sub2.throwOnError(), sub2.waitForComplete()]);
    expect(stream2.signal.aborted).toBeTruthy();
  });
});
