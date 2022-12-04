import { createClient } from '../client';
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
  await client.waitForComplete();
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
  await client.waitForComplete();
  client.dispose();

  expect(headers.get('x-distinct')).toBe('header');
});
