import fetch from 'node-fetch';
import { startTServer } from './utils/tserver';
import { createClient } from '../client';

it('should execute a simple query', async (done) => {
  const { url } = await startTServer({
    onConnect: (_req, res) => {
      // wait for close
      res.once('close', done);
    },
  });

  const client = createClient({
    url,
    fetchFn: fetch,
  });

  const control = new AbortController();

  const sub = client.subscribe(control.signal, {
    query: '{ getValue }',
  });

  for await (const val of sub) {
    expect(val).toMatchSnapshot();
  }
});
