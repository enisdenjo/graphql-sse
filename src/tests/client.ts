import fetch from 'node-fetch';
import { startTServer } from './utils/tserver';
import { createClient } from '../client';

// just does nothing
function noop(): void {
  /**/
}

it('should execute a simple query', async (done) => {
  expect.hasAssertions();

  const { url } = await startTServer();

  const client = createClient({
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
      error: (err) => fail(err),
      complete: done,
    },
  );
});

it('should complete subscription by disposing', async (done) => {
  expect.hasAssertions();

  const { url, waitForOperation, pong } = await startTServer();

  const client = createClient({
    url,
    fetchFn: fetch,
    retryAttempts: 0,
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
      error: (err) => fail(err),
      complete: done,
    },
  );

  await waitForOperation();

  pong();
});

it('should connect on first subscribe and disconnect on last complete', async () => {
  const { url, waitForOperation, waitForDisconnect } = await startTServer();

  const client = createClient({
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
      error: (err) => fail(err),
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
      error: (err) => fail(err),
      complete: noop,
    },
  );
  await waitForOperation();

  dispose1();
  await waitForDisconnect(() => fail("Shouldn't have disconnected"), 30);

  dispose2();
  await waitForDisconnect();
});
