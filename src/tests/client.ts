import fetch from 'node-fetch';
import { startTServer } from './utils/tserver';
import { createClient, Client, RequestParams } from '../client';

export function subscribe<T = unknown>(
  client: Client,
  payload: RequestParams,
): AsyncIterableIterator<T> & { dispose: () => void } {
  let deferred: {
    resolve: (done: boolean) => void;
    reject: (err: unknown) => void;
  } | null = null;
  const pending: T[] = [];
  let throwMe: unknown = null,
    done = false;
  const dispose = client.subscribe<T>(payload, {
    next: (data) => {
      pending.push(data);
      deferred?.resolve(false);
    },
    error: (err) => {
      throwMe = err;
      deferred?.reject(throwMe);
    },
    complete: () => {
      done = true;
      deferred?.resolve(true);
    },
  });
  return {
    [Symbol.asyncIterator]() {
      return this;
    },
    async next() {
      if (done) return { done: true, value: undefined };
      if (throwMe) throw throwMe;
      if (pending.length)
        return {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          value: pending.shift()!,
        };
      return (await new Promise<boolean>(
        (resolve, reject) => (deferred = { resolve, reject }),
      ))
        ? { done: true, value: undefined }
        : {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            value: pending.shift()!,
          };
    },
    dispose,
  };
}

it('should execute a simple query', async () => {
  const { url } = await startTServer();

  const client = createClient({
    url,
    fetchFn: fetch,
  });

  const sub = subscribe(client, {
    query: '{ getValue }',
  });

  for await (const val of sub) {
    expect(val).toMatchSnapshot();
  }
});

it('should complete subscription by disposing', async () => {
  const { url, waitForOperation, pong } = await startTServer();

  const client = createClient({
    url,
    fetchFn: fetch,
  });

  const sub = subscribe(client, {
    query: 'subscription { ping }',
  });

  await waitForOperation();

  pong();

  for await (const val of sub) {
    expect(val).toMatchSnapshot();
    sub.dispose();
  }
});

it('should connect on operation and disconnect after completion', async (done) => {
  const { url, waitForConnect } = await startTServer();

  const client = createClient({
    url,
    fetchFn: fetch,
  });

  const sub = subscribe(client, {
    query: 'subscription { ping }',
  });

  await waitForConnect((req) => {
    req.once('close', done);
  });

  sub.dispose();
});
