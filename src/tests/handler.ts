/**
 *
 * handler
 *
 */

import { startTServer } from './utils/tserver';
import { request } from './utils/request';
import EventSource from 'eventsource';

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

it('should get a token with PUT request', async () => {
  const { url } = await startTServer({ authenticate: () => 'token' });

  const { statusCode, headers, data } = await request('PUT', url);

  expect(statusCode).toBe(201);
  expect(headers['content-type']).toBe('text/plain; charset=utf-8');
  expect(data).toBe('token');
});

it('should allow event streams on reservations only', async () => {
  const { url } = await startTServer();

  // no reservation no connect
  let es = new EventSource(url);
  await new Promise<void>((resolve) => {
    es.onerror = () => {
      resolve();
      es.close(); // no retry
    };
  });

  // token can be sent through the header
  let res = await request('PUT', url);
  es = new EventSource(url, {
    headers: { ['x-graphql-stream-token']: res.data },
  });
  await new Promise<void>((resolve, reject) => {
    es.onopen = () => resolve();
    es.onerror = (e) => {
      reject(e);
      es.close(); // no retry
    };
  });
  es.close();

  // token can be sent through the url
  res = await request('PUT', url);
  es = new EventSource(url + '?token=' + res.data);
  await new Promise<void>((resolve, reject) => {
    es.onopen = () => resolve();
    es.onerror = (e) => {
      reject(e);
      es.close(); // no retry
    };
  });
  es.close();
});
