import { afterAll, it, expect } from 'vitest';
import net from 'net';
import http from 'http';
import express from 'express';
import Fastify from 'fastify';
import Koa from 'koa';
import mount from 'koa-mount';
import bodyparser from 'koa-bodyparser';
import { schema, pong } from './fixtures/simple';
import { queue } from './utils/testkit';

import { createHandler as createHttpHandler } from '../src/use/http';
import { createHandler as createExpressHandler } from '../src/use/express';
import { createHandler as createFastifyHandler } from '../src/use/fastify';
import { createHandler as createKoaHandler } from '../src/use/koa';

type Dispose = () => Promise<void>;

const leftovers: Dispose[] = [];
afterAll(async () => {
  while (leftovers.length > 0) {
    await leftovers.pop()?.();
  }
});

function makeDisposeForServer(server: http.Server): Dispose {
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
  };
  leftovers.push(dispose);

  return dispose;
}

function getStream(body: ReadableStream<Uint8Array> | null) {
  if (!body) {
    throw new Error('body cannot be empty');
  }
  const reader = body.getReader();
  return {
    async next(): Promise<{ done: true } | { done: false; value: string }> {
      const chunk = await reader.read();
      if (chunk.done) {
        return {
          done: true,
        };
      }
      return {
        done: false,
        value: Buffer.from(chunk.value).toString(),
      };
    },
  };
}

const adapters = [
  {
    name: 'http',
    startServer: async () => {
      const server = http.createServer(createHttpHandler({ schema }));
      server.listen(0);
      const port = (server.address() as net.AddressInfo).port;
      return [
        `http://localhost:${port}`,
        makeDisposeForServer(server),
        server,
      ] as const;
    },
  },
  {
    name: 'express',
    startServer: async () => {
      const app = express();
      app.all('/', createExpressHandler({ schema }));
      const server = app.listen(0);
      const port = (server.address() as net.AddressInfo).port;
      return [
        `http://localhost:${port}`,
        makeDisposeForServer(server),
        server,
      ] as const;
    },
  },
  {
    name: 'fastify',
    startServer: async () => {
      const fastify = Fastify();
      fastify.all('/', createFastifyHandler({ schema }));
      const url = await fastify.listen({ port: 0 });
      return [
        url,
        makeDisposeForServer(fastify.server),
        fastify.server,
      ] as const;
    },
  },
  {
    name: 'koa',
    startServer: async () => {
      const app = new Koa();
      app.use(mount('/', createKoaHandler({ schema })));
      const server = app.listen({ port: 0 });
      const port = (server.address() as net.AddressInfo).port;
      return [
        `http://localhost:${port}`,
        makeDisposeForServer(server),
        server,
      ] as const;
    },
  },
  {
    name: 'koa with bodyparser',
    startServer: async () => {
      const app = new Koa();
      app.use(bodyparser());
      app.use(mount('/', createKoaHandler({ schema })));
      const server = app.listen({ port: 0 });
      const port = (server.address() as net.AddressInfo).port;
      return [
        `http://localhost:${port}`,
        makeDisposeForServer(server),
        server,
      ] as const;
    },
  },
  // no need to test fetch because the handler is pure (gets request, returns response)
  // {
  //   name: 'fetch',
  //   startServer: async () => {
  //     //
  //   },
  // },
];

it.each(adapters)(
  'should not write to stream after closed with $name handler',
  async ({ startServer }) => {
    const [url] = await startServer();

    const pingKey = Math.random().toString();

    const ctrl = new AbortController();
    const res = await fetch(url, {
      signal: ctrl.signal,
      method: 'POST',
      headers: {
        accept: 'text/event-stream',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        query: `subscription { ping(key: "${pingKey}") }`,
      }),
    });

    const reader = getStream(res.body);

    await expect(reader.next()).resolves.toBeDefined(); // keepalive

    pong(pingKey);
    await expect(reader.next()).resolves.toEqual({
      done: false,
      value: `event: next
data: {"data":{"ping":"pong"}}

`,
    });

    ctrl.abort();
    await expect(reader.next()).rejects.toThrowError(
      'This operation was aborted',
    );

    // wait for one tick
    await new Promise((resolve) => setTimeout(resolve, 0));

    // issue ping
    pong(pingKey);

    // nothing should explode
  },
);

it.each(adapters)(
  'should not write to stream after response ended with $name handler',
  async ({ startServer }) => {
    const [url, , server] = await startServer();

    let lastRes: http.ServerResponse | undefined;
    server.on('request', (_req, res) => {
      lastRes = res;
    });

    const pingKey = Math.random().toString();

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        accept: 'text/event-stream',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        query: `subscription { ping(key: "${pingKey}") }`,
      }),
    });

    const reader = getStream(res.body);
    await expect(reader.next()).resolves.toBeDefined(); // keepalive

    // end the response (e.g. a framework error handler or a timeout) while
    // a message is being delivered and queue more behind it
    pong(pingKey);
    lastRes!.end();
    for (let i = 0; i < 3; i++) {
      pong(pingKey);
    }

    // give the handler a few ticks to flush queued messages
    await new Promise((resolve) => setTimeout(resolve, 50));

    // nothing should explode and the server should still work
    const ok = await fetch(url, {
      method: 'POST',
      headers: {
        accept: 'text/event-stream',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ query: 'subscription { greetings }' }),
    });
    await expect(ok.text()).resolves.toContain('event: complete');
  },
);

it("should include middleware headers with 'fastify' handler", async () => {
  const fastify = Fastify();

  fastify.addHook('onRequest', (_, reply, done) => {
    reply.header('x-custom', 'cust');
    done();
  });
  fastify.all(
    '/',
    createFastifyHandler({
      schema,
      onConnect(req) {
        expect(req.headers.get('x-custom')).toBe('cust');
      },
    }),
  );

  const url = await fastify.listen({ port: 0 });
  makeDisposeForServer(fastify.server);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      accept: 'text/event-stream',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      query: '{ getValue }',
    }),
  });

  expect(res.ok).toBeTruthy();
  expect(res.headers.get('x-custom')).toBe('cust');
});

it.each([
  { name: 'the client disconnects', mode: 'streaming' },
  { name: 'the subscription completes', mode: 'complete' },
  { name: 'the client disconnects while ending', mode: 'ending' },
])('should resolve the express handler when $name', async ({ mode }) => {
  const app = express();
  const handler = createExpressHandler({ schema });
  const ending = queue<void>();
  const handled = new Promise<boolean>((resolve, reject) => {
    app.all('/', (req, res) => {
      if (mode === 'ending') {
        res.end = () => {
          ending.add(undefined);
          return res;
        };
      }
      handler(req, res).then(() => resolve(res.writableFinished), reject);
    });
  });
  const server = app.listen(0);
  makeDisposeForServer(server);
  const port = (server.address() as net.AddressInfo).port;
  const ctrl = new AbortController();
  const pingKey = Math.random().toString();
  const response = await fetch(`http://localhost:${port}`, {
    signal: ctrl.signal,
    method: 'POST',
    headers: {
      accept: 'text/event-stream',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      query:
        mode === 'streaming'
          ? `subscription { ping(key: "${pingKey}") }`
          : 'subscription { greetings }',
    }),
  });

  expect(response.ok).toBeTruthy();

  if (mode === 'streaming') {
    const reader = getStream(response.body);
    await reader.next(); // keepalive
    pong(pingKey);
    await expect(reader.next()).resolves.toEqual({
      done: false,
      value: 'event: next\ndata: {"data":{"ping":"pong"}}\n\n',
    });
    ctrl.abort();
    await expect(reader.next()).rejects.toThrowError(
      'This operation was aborted',
    );
    await expect(handled).resolves.toBe(false);
  } else if (mode === 'ending') {
    await ending.next();
    const body = response.text();
    ctrl.abort();
    await expect(body).rejects.toThrowError('This operation was aborted');
    await expect(handled).resolves.toBe(false);
  } else {
    const body = await response.text();
    expect(body.match(/event: next/g)).toHaveLength(5);
    expect(body).toContain('event: complete');
    await expect(handled).resolves.toBe(true);
  }
});
