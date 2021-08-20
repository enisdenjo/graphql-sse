import fetch from 'node-fetch';
import { startTServer } from './utils/tserver';
import { createClient } from '../client';

// just does nothing
function noop(): void {
  /**/
}

it('should use the provided headers', async (done) => {
  expect.assertions(4);

  // single connection mode

  const singleConnServer = await startTServer({
    authenticate: (req) => {
      expect(req.headers['x-single']).toBe('header');
      return '';
    },
  });

  const singleConnClient = createClient({
    singleConnection: true,
    url: singleConnServer.url,
    fetchFn: fetch,
    retryAttempts: 0,
    headers: async () => {
      return { 'x-single': 'header' };
    },
  });

  await new Promise<void>((resolve) => {
    singleConnClient.subscribe(
      {
        query: '{ getValue }',
      },
      {
        next: noop,
        error: fail,
        complete: () => {
          singleConnClient.dispose();
          singleConnServer.dispose();
          resolve();
        },
      },
    );
  });

  // distinct connections mode

  const distinctConnServer = await startTServer({
    authenticate: (req) => {
      distinctConnClient.dispose();
      distinctConnServer.dispose();
      expect(req.headers['x-distinct']).toBe('header');
      done();
      return '';
    },
  });

  const distinctConnClient = createClient({
    singleConnection: false,
    url: distinctConnServer.url,
    fetchFn: fetch,
    retryAttempts: 0,
    headers: async () => {
      return { 'x-distinct': 'header' };
    },
  });

  distinctConnClient.subscribe(
    {
      query: '{ getValue }',
    },
    {
      next: noop,
      error: fail,
      complete: noop,
    },
  );
});

describe('single connection mode', () => {
  it('should execute a simple query', async (done) => {
    expect.hasAssertions();

    const { url } = await startTServer();

    const client = createClient({
      singleConnection: true,
      url,
      fetchFn: fetch,
      retryAttempts: 0,
    });

    client.subscribe(
      {
        query: '{ getValue }',
      },
      {
        next: (val) => expect(val).toMatchSnapshot(),
        error: fail,
        complete: done,
      },
    );
  });

  it('should complete subscription by disposing', async (done) => {
    expect.hasAssertions();

    const { url, waitForOperation, pong } = await startTServer();

    const client = createClient({
      singleConnection: true,
      url,
      fetchFn: fetch,
      retryAttempts: 0,
      lazy: false,
    });

    const dispose = client.subscribe(
      {
        query: 'subscription { ping }',
      },
      {
        next: (val) => {
          expect(val).toMatchSnapshot();
          dispose();
        },
        error: fail,
        complete: done,
      },
    );

    await waitForOperation();

    pong();
  });

  describe('lazy', () => {
    it('should connect on first subscribe and disconnect on last complete', async () => {
      const { url, waitForOperation, waitForDisconnect, waitForComplete } =
        await startTServer();

      const client = createClient({
        singleConnection: true,
        url,
        fetchFn: fetch,
        retryAttempts: 0,
      });

      const dispose1 = client.subscribe(
        {
          query: 'subscription { ping(key: "1") }',
        },
        {
          next: noop,
          error: fail,
          complete: noop,
        },
      );
      await waitForOperation();

      const dispose2 = client.subscribe(
        {
          query: 'subscription { ping(key: "2") }',
        },
        {
          next: noop,
          error: fail,
          complete: noop,
        },
      );
      await waitForOperation();

      dispose1();
      await waitForComplete();
      await waitForDisconnect(() => fail("Shouldn't have disconnected"), 30);

      dispose2();
      await waitForComplete();
      await waitForDisconnect();
    });
  });

  describe('non-lazy', () => {
    it('should connect as soon as the client is created', async () => {
      const { url, waitForConnected } = await startTServer();

      createClient({
        singleConnection: true,
        url,
        fetchFn: fetch,
        retryAttempts: 0,
        lazy: false,
        onNonLazyError: fail,
      });

      await waitForConnected();
    });

    it('should disconnect when the client gets disposed', async () => {
      const { url, waitForConnected, waitForDisconnect } = await startTServer();

      const client = createClient({
        singleConnection: true,
        url,
        fetchFn: fetch,
        retryAttempts: 0,
        lazy: false,
        onNonLazyError: fail,
      });

      await waitForConnected();

      client.dispose();

      await waitForDisconnect();
    });
  });
});

describe('distinct connections mode', () => {
  it('should establish separate connections for each subscribe', async () => {
    const { url, waitForConnected, waitForDisconnect } = await startTServer();

    const client = createClient({
      singleConnection: false,
      url,
      retryAttempts: 0,
      fetchFn: fetch,
    });

    const dispose1 = client.subscribe(
      {
        query: 'subscription { ping(key: "1") }',
      },
      {
        next: noop,
        error: fail,
        complete: noop,
      },
    );
    await waitForConnected();

    const dispose2 = client.subscribe(
      {
        query: 'subscription { ping(key: "2") }',
      },
      {
        next: noop,
        error: fail,
        complete: noop,
      },
    );
    await waitForConnected();

    dispose1();
    await waitForDisconnect();

    dispose2();
    await waitForDisconnect();
  });

  it('should complete all connections when client disposes', async () => {
    const { url, waitForConnected, waitForDisconnect } = await startTServer();

    const client = createClient({
      singleConnection: false,
      url,
      retryAttempts: 0,
      fetchFn: fetch,
    });

    client.subscribe(
      {
        query: 'subscription { ping(key: "1") }',
      },
      {
        next: noop,
        error: fail,
        complete: noop,
      },
    );
    await waitForConnected();

    client.subscribe(
      {
        query: 'subscription { ping(key: "2") }',
      },
      {
        next: noop,
        error: fail,
        complete: noop,
      },
    );
    await waitForConnected();

    client.dispose();
    await waitForDisconnect();
    await waitForDisconnect();
  });
});

describe('retries', () => {
  it('should keep retrying network errors until the retry attempts are exceeded', async () => {
    let tried = 0;
    const { url } = await startTServer({
      authenticate: (_, res) => {
        tried++;
        res.writeHead(403).end();
      },
    });

    await new Promise<void>((resolve) => {
      // non-lazy

      createClient({
        singleConnection: true,
        url,
        fetchFn: fetch,
        retryAttempts: 2,
        retry: () => Promise.resolve(),
        lazy: false,
        onNonLazyError: (err) => {
          expect(err).toMatchSnapshot();
          expect(tried).toBe(3); // initial + 2 retries
          resolve();
        },
      });
    });

    await new Promise<void>((resolve) => {
      // lazy

      tried = 0;
      const client = createClient({
        singleConnection: true,
        url,
        fetchFn: fetch,
        retryAttempts: 2,
        retry: () => Promise.resolve(),
      });

      client.subscribe(
        {
          query: '{ getValue }',
        },
        {
          next: noop,
          error: (err) => {
            expect(err).toMatchSnapshot();
            expect(tried).toBe(3); // initial + 2 retries
            resolve();
          },
          complete: noop,
        },
      );
    });

    await new Promise<void>((resolve) => {
      // distinct connections mode

      tried = 0;
      const client = createClient({
        singleConnection: false,
        url,
        fetchFn: fetch,
        retryAttempts: 2,
        retry: () => Promise.resolve(),
      });

      client.subscribe(
        {
          query: '{ getValue }',
        },
        {
          next: noop,
          error: (err) => {
            expect(err).toMatchSnapshot();
            expect(tried).toBe(3); // initial + 2 retries
            resolve();
          },
          complete: noop,
        },
      );
    });
  });
});
