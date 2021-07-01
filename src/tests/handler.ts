/**
 *
 * handler
 *
 */

import { startTServer } from './utils/tserver';
import { request } from './utils/request';

it('should only accept valid accept headers', async () => {
  const { url } = await startTServer();

  let res = await request('GET', url, { accept: 'gibberish' });
  expect(res.statusCode).toBe(406);

  res = await request('GET', url, { accept: 'application/graphql+json' });
  expect(res.statusCode).toBe(404); // no token registered

  res = await request('GET', url, { accept: 'application/json' });
  expect(res.statusCode).toBe(404); // no token registered

  // TODO-db-210701 implement
  res = await request('GET', url, { accept: 'text/event-stream' });
  expect(res.statusCode).toBe(501); // no token registered
});

it('should get a token with PUT request', async () => {
  const { url } = await startTServer({
    authenticate: () => 'token',
  });

  const { statusCode, headers, data } = await request('PUT', url);

  expect(statusCode).toBe(201);
  expect(headers['content-type']).toBe('text/plain; charset=utf-8');
  expect(data).toBe('token');
});

it('should respond with 404s when token was not previously registered', async () => {
  const { url } = await startTServer();

  // maybe POST gql request
  let res = await request('POST', url);
  expect(res.statusCode).toBe(404);
  expect(res.statusMessage).toBe('Stream not found');

  // maybe GET gql request
  res = await request('GET', url);
  expect(res.statusCode).toBe(404);
  expect(res.statusMessage).toBe('Stream not found');

  // completing/ending a stream
  res = await request('DELETE', url);
  expect(res.statusCode).toBe(404);
  expect(res.statusMessage).toBe('Stream not found');
});
