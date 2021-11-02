import http from 'http';
import net from 'net';
import { EventEmitter } from 'events';
import { schema, pong } from '../fixtures/simple';
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
  pong: typeof pong;
  waitForConnecting(
    test?: (req: http.IncomingMessage, res: http.ServerResponse) => void,
    expire?: number,
  ): Promise<void>;
  waitForConnected(
    test?: (req: http.IncomingMessage) => void,
    expire?: number,
  ): Promise<void>;
  waitForOperation(test?: () => void, expire?: number): Promise<void>;
  waitForComplete(test?: () => void, expire?: number): Promise<void>;
  waitForDisconnect(test?: () => void, expire?: number): Promise<void>;
  dispose: Dispose;
}

export async function startTServer(
  options: Partial<HandlerOptions> = {},
): Promise<TServer> {
  const emitter = new EventEmitter();

  const pendingConnectings: [
    req: http.IncomingMessage,
    res: http.ServerResponse,
  ][] = [];
  const pendingConnecteds: http.IncomingMessage[] = [];
  let pendingOperations = 0,
    pendingCompletes = 0,
    pendingDisconnects = 0;
  const handler = createHandler({
    schema,
    ...options,
    onConnecting: async (...args) => {
      pendingConnectings.push([args[0], args[1]]);
      await options?.onConnecting?.(...args);
      emitter.emit('connecting');
    },
    onConnected: async (...args) => {
      pendingConnecteds.push(args[0]);
      await options?.onConnected?.(...args);
      emitter.emit('connected');
    },
    onOperation: async (...args) => {
      pendingOperations++;
      const maybeResult = await options?.onOperation?.(...args);
      emitter.emit('operation');
      return maybeResult;
    },
    onComplete: async (...args) => {
      pendingCompletes++;
      await options?.onComplete?.(...args);
      emitter.emit('complete');
    },
    onDisconnect: async (...args) => {
      pendingDisconnects++;
      await options?.onDisconnect?.(...args);
      emitter.emit('disconn');
    },
  });

  const [server, url, dispose] = await startDisposableServer(
    http.createServer(async (req, res) => {
      try {
        await handler(req, res);
      } catch (err) {
        fail(err);
      }
    }),
  );

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
    pong,
    waitForConnecting(test, expire) {
      return new Promise((resolve) => {
        function done() {
          // the on connect listener below will be called before our listener, populating the queue
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const args = pendingConnectings.shift()!;
          test?.(...args);
          resolve();
        }
        if (pendingConnectings.length > 0) return done();
        emitter.once('connecting', done);
        if (expire)
          setTimeout(() => {
            emitter.off('connecting', done); // expired
            resolve();
          }, expire);
      });
    },
    waitForConnected(test, expire) {
      return new Promise((resolve) => {
        function done() {
          // the on connect listener below will be called before our listener, populating the queue
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const arg = pendingConnecteds.shift()!;
          test?.(arg);
          resolve();
        }
        if (pendingConnecteds.length > 0) return done();
        emitter.once('connected', done);
        if (expire)
          setTimeout(() => {
            emitter.off('connected', done); // expired
            resolve();
          }, expire);
      });
    },
    waitForOperation(test, expire) {
      return new Promise((resolve) => {
        function done() {
          pendingOperations--;
          test?.();
          resolve();
        }
        if (pendingOperations > 0) return done();
        emitter.once('operation', done);
        if (expire)
          setTimeout(() => {
            emitter.off('operation', done); // expired
            resolve();
          }, expire);
      });
    },
    waitForComplete(test, expire) {
      return new Promise((resolve) => {
        function done() {
          pendingCompletes--;
          test?.();
          resolve();
        }
        if (pendingCompletes > 0) return done();
        emitter.once('complete', done);
        if (expire)
          setTimeout(() => {
            emitter.off('complete', done); // expired
            resolve();
          }, expire);
      });
    },
    waitForDisconnect(test, expire) {
      return new Promise((resolve) => {
        function done() {
          pendingDisconnects--;
          test?.();
          resolve();
        }
        if (pendingDisconnects > 0) return done();
        emitter.once('disconn', done);
        if (expire)
          setTimeout(() => {
            emitter.off('disconn', done); // expired
            resolve();
          }, expire);
      });
    },
    dispose,
  };
}

/**
 * Starts a disposable server thet is really stopped when the dispose func resolves.
 *
 * Additionally adds the server kill function to the post tests `leftovers`
 * to be invoked after each test.
 */
export async function startDisposableServer(
  server: http.Server,
): Promise<[server: http.Server, url: string, dispose: () => Promise<void>]> {
  const sockets = new Set<net.Socket>();
  server.on('connection', (socket) => {
    sockets.add(socket);
    socket.once('close', () => sockets.delete(socket));
  });

  const kill = async () => {
    for (const socket of sockets) {
      socket.destroy();
    }
    await new Promise<void>((resolve) => server.close(() => resolve()));
    leftovers.splice(leftovers.indexOf(kill), 1);
  };
  leftovers.push(kill);

  await new Promise<void>((resolve) => server.listen(0, resolve));

  const { port } = server.address() as net.AddressInfo;
  const url = `http://localhost:${port}`;

  return [server, url, kill];
}
