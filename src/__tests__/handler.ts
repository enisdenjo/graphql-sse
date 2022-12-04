import {
  createTHandler,
  assertString,
  assertAsyncGenerator,
} from './utils/thandler';
import { TOKEN_HEADER_KEY } from '../common';

it('should only accept valid accept headers', async () => {
  const { handler } = createTHandler();

  let [body, init] = await handler('PUT');
  assertString(body);
  const token = body;

  [body, init] = await handler('GET', {
    headers: {
      accept: 'gibberish',
      [TOKEN_HEADER_KEY]: token,
    },
  });
  expect(init.status).toBe(406);

  [body, init] = await handler('GET', {
    headers: {
      accept: 'application/json',
      [TOKEN_HEADER_KEY]: token,
    },
  });
  expect(init.status).toBe(400);
  expect(init.headers?.['content-type']).toBe(
    'application/json; charset=utf-8',
  );
  expect(body).toMatchInlineSnapshot(
    `"{\\"errors\\":[{\\"message\\":\\"Missing query\\"}]}"`,
  );

  [body, init] = await handler('GET', {
    headers: {
      accept: 'text/event-stream',
    },
  });
  expect(init.status).toBe(400);
  expect(init.headers?.['content-type']).toBe(
    'application/json; charset=utf-8',
  );
  expect(body).toMatchInlineSnapshot(
    `"{\\"errors\\":[{\\"message\\":\\"Missing query\\"}]}"`,
  );
});

it.each(['authenticate', 'onConnect', 'onSubscribe', 'context'])(
  'should bubble %s errors to the handler',
  async (hook) => {
    const err = new Error('hang hang');
    const { handler } = createTHandler({
      [hook]() {
        throw err;
      },
    });

    await expect(
      handler('POST', {
        headers: {
          accept: 'text/event-stream',
        },
        body: { query: '{ getValue }' },
      }),
    ).rejects.toBe(err);
  },
);

it.each(['onNext', 'onComplete'])(
  'should bubble %s errors to the response body iterator',
  async (hook) => {
    const err = new Error('hang hang');
    const { handler } = createTHandler({
      [hook]() {
        throw err;
      },
    });

    const [stream, init] = await handler('POST', {
      headers: {
        accept: 'text/event-stream',
      },
      body: { query: '{ getValue }' },
    });
    expect(init.status).toBe(200);
    assertAsyncGenerator(stream);

    await expect(
      (async () => {
        for await (const _ of stream) {
          // wait
        }
      })(),
    ).rejects.toBe(err);
  },
);

describe('single connection mode', () => {
  it('should respond with 404s when token was not previously registered', async () => {
    const { handler } = createTHandler();

    let [body, init] = await handler('POST', {
      headers: {
        [TOKEN_HEADER_KEY]: '0',
      },
    });
    expect(init.status).toBe(404);
    expect(init.headers?.['content-type']).toBe(
      'application/json; charset=utf-8',
    );
    expect(body).toMatchInlineSnapshot(
      `"{\\"errors\\":[{\\"message\\":\\"Stream not found\\"}]}"`,
    );

    const search = new URLSearchParams();
    search.set('token', '0');

    [body, init] = await handler('GET', { search });
    expect(init.status).toBe(404);
    expect(init.headers?.['content-type']).toBe(
      'application/json; charset=utf-8',
    );
    expect(body).toMatchInlineSnapshot(
      `"{\\"errors\\":[{\\"message\\":\\"Stream not found\\"}]}"`,
    );

    [body, init] = await handler('DELETE', { search });
    expect(init.status).toBe(404);
    expect(init.headers?.['content-type']).toBe(
      'application/json; charset=utf-8',
    );
    expect(body).toMatchInlineSnapshot(
      `"{\\"errors\\":[{\\"message\\":\\"Stream not found\\"}]}"`,
    );
  });

  it('should get a token with PUT request', async () => {
    const { handler } = createTHandler({
      authenticate() {
        return 'token';
      },
    });

    const [body, init] = await handler('PUT');
    expect(init.status).toBe(201);
    expect(init.headers?.['content-type']).toBe('text/plain; charset=utf-8');
    expect(body).toBe('token');
  });

  it('should treat event streams without reservations as regular requests', async () => {
    const { handler } = createTHandler();

    const [body, init] = await handler('GET', {
      headers: {
        [TOKEN_HEADER_KEY]: '0',
        accept: 'text/event-stream',
      },
    });
    expect(init.status).toBe(400);
    expect(body).toMatchInlineSnapshot(
      `"{\\"errors\\":[{\\"message\\":\\"Missing query\\"}]}"`,
    );
  });

  it('should allow event streams on reservations', async () => {
    const { handler } = createTHandler();

    // token can be sent through headers
    let [token] = await handler('PUT');
    assertString(token);
    let [stream, init] = await handler('GET', {
      headers: {
        [TOKEN_HEADER_KEY]: token,
        accept: 'text/event-stream',
      },
    });
    expect(init.status).toBe(200);
    assertAsyncGenerator(stream);
    stream.return();

    // token can be sent through url search param
    [token] = await handler('PUT');
    assertString(token);
    const search = new URLSearchParams();
    search.set('token', token);
    [stream, init] = await handler('GET', {
      search,
      headers: {
        accept: 'text/event-stream',
      },
    });
    expect(init.status).toBe(200);
    assertAsyncGenerator(stream);
    stream.return();
  });

  it('should not allow operations without providing an operation id', async () => {
    const { handler } = createTHandler();

    const [token] = await handler('PUT');
    assertString(token);

    const [body, init] = await handler('POST', {
      headers: { [TOKEN_HEADER_KEY]: token },
      body: { query: '{ getValue }' },
    });

    expect(init.status).toBe(400);
    expect(body).toMatchInlineSnapshot(
      `"{\\"errors\\":[{\\"message\\":\\"Operation ID is missing\\"}]}"`,
    );
  });

  it('should stream query operations to connected event stream', async () => {
    const { handler } = createTHandler();

    const [token] = await handler('PUT');
    assertString(token);

    const [stream] = await handler('POST', {
      headers: {
        [TOKEN_HEADER_KEY]: token,
        accept: 'text/event-stream',
      },
    });
    assertAsyncGenerator(stream);

    const [body, init] = await handler('POST', {
      headers: { [TOKEN_HEADER_KEY]: token },
      body: { query: '{ getValue }', extensions: { operationId: '1' } },
    });
    expect(init.status).toBe(202);
    expect(body).toBeNull();

    await expect(stream.next()).resolves.toMatchInlineSnapshot(`
      Object {
        "done": false,
        "value": ":

      ",
      }
    `); // ping

    await expect(stream.next()).resolves.toMatchInlineSnapshot(`
      Object {
        "done": false,
        "value": "event: next
      data: {\\"id\\":\\"1\\",\\"payload\\":{\\"data\\":{\\"getValue\\":\\"value\\"}}}

      ",
      }
    `);

    await expect(stream.next()).resolves.toMatchInlineSnapshot(`
      Object {
        "done": false,
        "value": "event: complete
      data: {\\"id\\":\\"1\\"}

      ",
      }
    `);

    stream.return();
  });

  it('should stream subscription operations to connected event stream', async () => {
    const { handler } = createTHandler();

    const [token] = await handler('PUT');
    assertString(token);

    const search = new URLSearchParams();
    search.set('token', token);
    const [stream] = await handler('GET', {
      search,
      headers: {
        accept: 'text/event-stream',
      },
    });
    assertAsyncGenerator(stream);
    await expect(stream.next()).resolves.toMatchInlineSnapshot(`
      Object {
        "done": false,
        "value": ":

      ",
      }
    `); // ping

    const [_0, init] = await handler('POST', {
      headers: {
        [TOKEN_HEADER_KEY]: token,
      },
      body: {
        query: 'subscription { greetings }',
        extensions: { operationId: '1' },
      },
    });
    expect(init.status).toBe(202);

    for await (const msg of stream) {
      expect(msg).toMatchSnapshot();

      if (msg.startsWith('event: complete')) {
        break;
      }
    }

    await expect(stream.next()).resolves.toMatchInlineSnapshot(`
      Object {
        "done": true,
        "value": undefined,
      }
    `);
  });

  it.todo('should stream operations even if event stream connects late');

  it('should report validation issues to operation request', async () => {
    const { handler } = createTHandler();

    const [token] = await handler('PUT');
    assertString(token);

    const search = new URLSearchParams();
    search.set('token', token);
    const [stream] = await handler('GET', {
      search,
      headers: {
        accept: 'text/event-stream',
      },
    });
    assertAsyncGenerator(stream);
    await expect(stream.next()).resolves.toMatchInlineSnapshot(`
      Object {
        "done": false,
        "value": ":

      ",
      }
    `); // ping

    const [body, init] = await handler('POST', {
      headers: {
        [TOKEN_HEADER_KEY]: token,
      },
      body: {
        query: 'subscription { notExists }',
        extensions: { operationId: '1' },
      },
    });
    expect(init.status).toBe(400);
    expect(body).toMatchInlineSnapshot(
      `"{\\"errors\\":[{\\"message\\":\\"Cannot query field \\\\\\"notExists\\\\\\" on type \\\\\\"Subscription\\\\\\".\\",\\"locations\\":[{\\"line\\":1,\\"column\\":16}]}]}"`,
    );

    // stream remains open
    await expect(
      Promise.race([
        stream.next(),
        await new Promise((resolve) => setTimeout(resolve, 20)),
      ]),
    ).resolves.toBeUndefined();
  });
});

describe('distinct connections mode', () => {
  it('should stream query operations to connected event stream and then disconnect', async () => {
    const { handler } = createTHandler();

    // GET
    const search = new URLSearchParams();
    search.set('query', '{ getValue }');
    let [stream, init] = await handler('GET', {
      search,
      headers: {
        accept: 'text/event-stream',
      },
    });
    expect(init.status).toBe(200);
    assertAsyncGenerator(stream);
    for await (const msg of stream) {
      expect(msg).toMatchSnapshot();
    }

    // POST
    [stream, init] = await handler('POST', {
      headers: {
        accept: 'text/event-stream',
      },
      body: { query: '{ getValue }' },
    });
    expect(init.status).toBe(200);
    assertAsyncGenerator(stream);
    for await (const msg of stream) {
      expect(msg).toMatchSnapshot();
    }
  });

  it('should stream subscription operations to connected event stream and then disconnect', async () => {
    const { handler } = createTHandler();

    // GET
    const search = new URLSearchParams();
    search.set('query', 'subscription { greetings }');
    let [stream, init] = await handler('GET', {
      search,
      headers: {
        accept: 'text/event-stream',
      },
    });
    expect(init.status).toBe(200);
    assertAsyncGenerator(stream);
    for await (const msg of stream) {
      expect(msg).toMatchSnapshot();
    }

    // POST
    [stream, init] = await handler('POST', {
      headers: {
        accept: 'text/event-stream',
      },
      body: { query: 'subscription { greetings }' },
    });
    expect(init.status).toBe(200);
    assertAsyncGenerator(stream);
    for await (const msg of stream) {
      expect(msg).toMatchSnapshot();
    }
  });

  it('should report operation validation issues by streaming them', async () => {
    const { handler } = createTHandler();

    const [stream, init] = await handler('POST', {
      headers: {
        accept: 'text/event-stream',
      },
      body: { query: '{ notExists }' },
    });
    expect(init.status).toBe(200);
    assertAsyncGenerator(stream);
    await expect(stream.next()).resolves.toMatchInlineSnapshot(`
      Object {
        "done": false,
        "value": ":

      ",
      }
    `); // ping
    await expect(stream.next()).resolves.toMatchInlineSnapshot(`
      Object {
        "done": false,
        "value": "event: next
      data: {\\"errors\\":[{\\"message\\":\\"Cannot query field \\\\\\"notExists\\\\\\" on type \\\\\\"Query\\\\\\".\\",\\"locations\\":[{\\"line\\":1,\\"column\\":3}]}]}

      ",
      }
    `);
    await expect(stream.next()).resolves.toMatchInlineSnapshot(`
      Object {
        "done": false,
        "value": "event: complete

      ",
      }
    `);
    await expect(stream.next()).resolves.toMatchInlineSnapshot(`
      Object {
        "done": true,
        "value": undefined,
      }
    `);
  });

  it('should complete subscription operations after client disconnects', async () => {
    const { handler } = createTHandler();

    const [stream, init] = await handler('POST', {
      headers: {
        accept: 'text/event-stream',
      },
      body: { query: `subscription { ping(key: "${Math.random()}") }` },
    });
    expect(init.status).toBe(200);
    assertAsyncGenerator(stream);

    // simulate client disconnect in next tick
    setTimeout(() => stream.return(), 0);

    for await (const _ of stream) {
      // loop must break for test to pass
    }
  });

  it('should complete when stream ends before the subscription sent all events', async () => {
    const { handler } = createTHandler();

    const [stream, init] = await handler('POST', {
      headers: {
        accept: 'text/event-stream',
      },
      body: { query: `subscription { greetings }` },
    });
    expect(init.status).toBe(200);
    assertAsyncGenerator(stream);

    await expect(stream.next()).resolves.toMatchInlineSnapshot(`
      Object {
        "done": false,
        "value": ":

      ",
      }
    `); // ping

    for await (const msg of stream) {
      expect(msg).toMatchInlineSnapshot(`
        "event: next
        data: {\\"data\\":{\\"greetings\\":\\"Hi\\"}}

        "
      `);

      // return after first message (there are more)
      break;
    }

    await expect(stream.next()).resolves.toMatchInlineSnapshot(`
          Object {
            "done": true,
            "value": undefined,
          }
      `);
  });

  it('should bubble onNext errors to the response body iterator even if late', async () => {
    const err = new Error('hang hang');
    let i = 0;
    const { handler } = createTHandler({
      onNext() {
        i++;
        if (i > 3) {
          throw err;
        }
      },
    });

    const [stream, init] = await handler('POST', {
      headers: {
        accept: 'text/event-stream',
      },
      body: { query: 'subscription { greetings }' },
    });
    expect(init.status).toBe(200);
    assertAsyncGenerator(stream);

    await expect(
      (async () => {
        for await (const _ of stream) {
          // wait
        }
      })(),
    ).rejects.toBe(err);
  });
});
