import { createTHandler, assertString } from './utils/thandler';
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
