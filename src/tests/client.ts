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

it('should connect on operation and disconnect after completion', async (done) => {
  const { url, waitForConnect } = await startTServer();

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
      next: noop,
      error: (err) => fail(err),
      complete: done,
    },
  );

  await waitForConnect((req) => {
    req.once('close', done);
  });

  dispose();
});
