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

describe('distinct connections mode', () => {
  it('should stream query operations to connected event stream and then disconnect', async () => {
    const { handler } = createTHandler();

    // GET
    const search = new URLSearchParams();
    search.set('query', '{ getValue }');
    let [body, init] = await handler('GET', {
      search,
      headers: {
        accept: 'text/event-stream',
      },
    });
    expect(init.status).toBe(200);
    assertAsyncGenerator(body);
    for await (const msg of body) {
      expect(msg).toMatchSnapshot();
    }

    // POST
    [body, init] = await handler('POST', {
      headers: {
        accept: 'text/event-stream',
      },
      body: { query: '{ getValue }' },
    });
    expect(init.status).toBe(200);
    assertAsyncGenerator(body);
    for await (const msg of body) {
      expect(msg).toMatchSnapshot();
    }
  });

  it('should stream subscription operations to connected event stream and then disconnect', async () => {
    const { handler } = createTHandler();

    // GET
    const search = new URLSearchParams();
    search.set('query', 'subscription { greetings }');
    let [body, init] = await handler('GET', {
      search,
      headers: {
        accept: 'text/event-stream',
      },
    });
    expect(init.status).toBe(200);
    assertAsyncGenerator(body);
    for await (const msg of body) {
      expect(msg).toMatchSnapshot();
    }

    // POST
    [body, init] = await handler('POST', {
      headers: {
        accept: 'text/event-stream',
      },
      body: { query: 'subscription { greetings }' },
    });
    expect(init.status).toBe(200);
    assertAsyncGenerator(body);
    for await (const msg of body) {
      expect(msg).toMatchSnapshot();
    }
  });

  it('should report operation validation issues by streaming them', async () => {
    const { handler } = createTHandler();

    const [body, init] = await handler('POST', {
      headers: {
        accept: 'text/event-stream',
      },
      body: { query: '{ notExists }' },
    });
    expect(init.status).toBe(200);
    assertAsyncGenerator(body);
    await expect(body.next()).resolves.toMatchInlineSnapshot(`
      Object {
        "done": false,
        "value": ":

      ",
      }
    `); // ping
    await expect(body.next()).resolves.toMatchInlineSnapshot(`
      Object {
        "done": false,
        "value": "event: next
      data: {\\"errors\\":[{\\"message\\":\\"Cannot query field \\\\\\"notExists\\\\\\" on type \\\\\\"Query\\\\\\".\\",\\"locations\\":[{\\"line\\":1,\\"column\\":3}]}]}

      ",
      }
    `);
    await expect(body.next()).resolves.toMatchInlineSnapshot(`
      Object {
        "done": false,
        "value": "event: complete

      ",
      }
    `);
    await expect(body.next()).resolves.toMatchInlineSnapshot(`
      Object {
        "done": true,
        "value": undefined,
      }
    `);
  });

  it('should complete subscription operations after client disconnects', async () => {
    const { handler } = createTHandler();

    const [body, init] = await handler('POST', {
      headers: {
        accept: 'text/event-stream',
      },
      body: { query: `subscription { ping(key: "${Math.random()}") }` },
    });
    expect(init.status).toBe(200);
    assertAsyncGenerator(body);

    // simulate client disconnect in next tick
    setTimeout(() => body.return(undefined), 0);

    for await (const _ of body) {
      // loop must break for test to pass
    }
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

      const [body, init] = await handler('POST', {
        headers: {
          accept: 'text/event-stream',
        },
        body: { query: '{ getValue }' },
      });
      expect(init.status).toBe(200);
      assertAsyncGenerator(body);

      await expect(
        (async () => {
          for await (const _ of body) {
            // wait
          }
        })(),
      ).rejects.toBe(err);
    },
  );

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

    const [body, init] = await handler('POST', {
      headers: {
        accept: 'text/event-stream',
      },
      body: { query: 'subscription { greetings }' },
    });
    expect(init.status).toBe(200);
    assertAsyncGenerator(body);

    await expect(
      (async () => {
        for await (const _ of body) {
          // wait for throw
        }
      })(),
    ).rejects.toBe(err);
  });
});
