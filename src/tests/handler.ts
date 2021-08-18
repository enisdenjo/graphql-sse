/* eslint-disable @typescript-eslint/no-explicit-any */

import { startTServer } from './utils/tserver';
import { eventStream } from './utils/eventStream';
import EventSource from 'eventsource';

it('should only accept valid accept headers', async () => {
  const { request } = await startTServer();

  const { data: token } = await request('PUT');

  let res = await request('GET', {
    accept: 'gibberish',
    ['x-graphql-stream-token']: token,
  });
  expect(res.statusCode).toBe(406);

  res = await request('GET', {
    accept: 'application/graphql+json',
    ['x-graphql-stream-token']: token,
  });
  expect(res.statusCode).toBe(400);
  expect(res.statusMessage).toBe('Missing query');

  res = await request('GET', {
    accept: 'application/json',
    ['x-graphql-stream-token']: token,
  });
  expect(res.statusCode).toBe(400);
  expect(res.statusMessage).toBe('Missing query');

  res = await request('GET', { accept: 'text/event-stream' });
  expect(res.statusCode).toBe(400);
  expect(res.statusMessage).toBe('Missing query');

  res = await request('POST', { accept: 'text/event-stream' }, { query: '' });
  expect(res.statusCode).toBe(400);
  expect(res.statusMessage).toBe('Missing query');
});

describe('single stream mode', () => {
  it('should respond with 404s when token was not previously registered', async () => {
    const { request } = await startTServer();

    // maybe POST gql request
    let res = await request('POST');
    expect(res.statusCode).toBe(404);
    expect(res.statusMessage).toBe('Stream not found');

    // maybe GET gql request
    res = await request('GET');
    expect(res.statusCode).toBe(404);
    expect(res.statusMessage).toBe('Stream not found');

    // completing/ending an operation
    res = await request('DELETE');
    expect(res.statusCode).toBe(404);
    expect(res.statusMessage).toBe('Stream not found');
  });

  it('should get a token with PUT request', async () => {
    const { request } = await startTServer({ authenticate: () => 'token' });

    const { statusCode, headers, data } = await request('PUT');

    expect(statusCode).toBe(201);
    expect(headers['content-type']).toBe('text/plain; charset=utf-8');
    expect(data).toBe('token');
  });

  it('should allow event streams on reservations only', async () => {
    const { url, request } = await startTServer();

    // no reservation no connect
    let es = new EventSource(url);
    await new Promise<void>((resolve) => {
      es.onerror = () => {
        resolve();
        es.close(); // no retry
      };
    });

    // token can be sent through the header
    let res = await request('PUT');
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
    res = await request('PUT');
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

  it('should not allow operations without providing an operation id', async () => {
    const { request } = await startTServer();

    const { data: token } = await request('PUT');

    const { statusCode, statusMessage } = await request(
      'POST',
      { 'x-graphql-stream-token': token },
      { query: '{ getValue }' },
    );

    expect(statusCode).toBe(400);
    expect(statusMessage).toBe('Operation ID is missing');
  });

  it('should stream query operations to connected event stream', async (done) => {
    const { url, request } = await startTServer();

    const { data: token } = await request('PUT');

    const es = new EventSource(url + '?token=' + token);
    es.addEventListener('value', (event) => {
      expect((event as any).data).toMatchSnapshot();
    });
    es.addEventListener('done', () => {
      es.close();
      done();
    });

    const { statusCode } = await request(
      'POST',
      { 'x-graphql-stream-token': token },
      { query: '{ getValue }', extensions: { operationId: '1' } },
    );
    expect(statusCode).toBe(202);
  });

  it.todo('should stream query operations even if event stream connects later');

  it('should stream subscription operations to connected event stream', async (done) => {
    const { url, request } = await startTServer();

    const { data: token } = await request('PUT');

    const es = new EventSource(url + '?token=' + token);
    es.addEventListener('value', (event) => {
      // called 5 times
      expect((event as any).data).toMatchSnapshot();
    });
    es.addEventListener('done', () => {
      es.close();
      done();
    });

    const { statusCode } = await request(
      'POST',
      { 'x-graphql-stream-token': token },
      { query: 'subscription { greetings }', extensions: { operationId: '1' } },
    );
    expect(statusCode).toBe(202);
  });

  it('should report operation validation issues to request', async () => {
    const { url, request } = await startTServer();

    const { data: token } = await request('PUT');

    const es = new EventSource(url + '?token=' + token);
    es.addEventListener('value', () => {
      fail('Shouldnt have omitted');
    });
    es.addEventListener('done', () => {
      fail('Shouldnt have omitted');
    });

    const { statusCode, data } = await request(
      'POST',
      { 'x-graphql-stream-token': token },
      { query: '{ notExists }', extensions: { operationId: '1' } },
    );
    expect(statusCode).toBe(400);
    expect(data).toMatchSnapshot();

    es.close();
  });
});

describe('distinct streams mode', () => {
  it('should stream query operations to connected event stream and then disconnect', async () => {
    const { url, waitForDisconnect } = await startTServer();

    const control = new AbortController();

    const msgs = await eventStream({
      signal: control.signal,
      url,
      body: { query: '{ getValue }' },
    });

    for await (const msg of msgs) {
      expect(msg).toMatchSnapshot();
    }

    await waitForDisconnect();
  });
});
