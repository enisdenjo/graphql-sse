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
  expect(body).toMatchInlineSnapshot(
    `"{\\"errors\\":[{\\"message\\":\\"Missing query\\"}]}"`,
  );

  [body, init] = await handler('GET', {
    headers: {
      accept: 'text/event-stream',
    },
  });
  expect(init.status).toBe(400);
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
});
