/**
 *
 * tserver
 *
 */

import http from 'http';
import net from 'net';
import { schema } from '../fixtures/simple';
import { createHandler, HandlerOptions } from '../../handler';

type Dispose = () => Promise<void>;

// distinct server for each test; if you forget to dispose, the fixture wont
const leftovers: Dispose[] = [];
afterEach(async () => {
  while (leftovers.length > 0) {
    // if not disposed by test, cleanup
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const dispose = leftovers.pop()!;
    await dispose();
  }
});

export interface TServer {
  url: string;
  server: http.Server;
  request(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    headers?: http.IncomingHttpHeaders,
    params?: Record<string, unknown>,
  ): Promise<{
    statusCode: number;
    statusMessage: string;
    headers: http.IncomingHttpHeaders;
    data: string;
  }>;
  dispose: Dispose;
}

export async function startTServer(
  options: Partial<HandlerOptions> = {},
): Promise<TServer> {
  const server = http.createServer(createHandler({ schema, ...options }));

  const sockets = new Set<net.Socket>();
  server.on('connection', (socket) => {
    sockets.add(socket);
    socket.once('close', () => sockets.delete(socket));
  });

  const dispose = async () => {
    for (const socket of sockets) {
      socket.destroy();
    }
    await new Promise<void>((resolve) => server.close(() => resolve()));
    leftovers.splice(leftovers.indexOf(dispose), 1);
  };
  leftovers.push(dispose);

  const port = await getAvailablePort();
  const url = `http://localhost:${port}/`;

  await new Promise<void>((resolve) => server.listen(port, resolve));

  return {
    url,
    server,
    request(method, headers = {}, params = {}) {
      const u = new URL(url);

      if (method !== 'POST')
        for (const [key, val] of Object.entries(params)) {
          u.searchParams.set(key, String(val ?? ''));
        }

      return new Promise((resolve, reject) => {
        const req = http
          .request(url, { method, headers }, (res) => {
            let data = '';
            res.on('data', (chunk) => {
              data += chunk;
            });
            res.on('end', () => {
              if (!res.statusCode)
                return reject(new Error('No status code in response'));
              if (!res.statusMessage)
                return reject(new Error('No status message in response'));
              resolve({
                statusCode: res.statusCode,
                statusMessage: res.statusMessage,
                headers: res.headers,
                data,
              });
            });
          })
          .on('error', reject);
        if (method === 'POST' && Object.keys(params).length)
          req.write(JSON.stringify(params));
        req.end();
      });
    },
    dispose,
  };
}

async function getAvailablePort() {
  const httpServer = http.createServer();

  let tried = 0;
  for (;;) {
    try {
      await new Promise((resolve, reject) => {
        httpServer.once('error', reject);
        httpServer.once('listening', resolve);
        try {
          httpServer.listen(0);
        } catch (err) {
          reject(err);
        }
      });
      break; // listening
    } catch (err) {
      if ('code' in err && err.code === 'EADDRINUSE') {
        tried++;
        if (tried > 10)
          throw new Error(
            `Cant find open port, stopping search after ${tried} tries`,
          );
        continue; // try another one if this port is in use
      } else {
        throw err; // throw all other errors immediately
      }
    }
  }

  const addr = httpServer.address();
  if (!addr || typeof addr !== 'object')
    throw new Error(`Unexpected http server address ${addr}`);

  // port found, stop server
  await new Promise<void>((resolve) => httpServer.close(() => resolve()));

  return addr.port;
}
