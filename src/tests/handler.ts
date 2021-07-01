/**
 *
 * handler
 *
 */

import { startTServer } from './utils/tserver';
import { request } from './utils/request';

it('should get a token with PUT request', async () => {
  const { url } = await startTServer({
    authenticate: () => 'token',
  });

  const data = await request('PUT', url);

  expect(data).toBe('token');
});
