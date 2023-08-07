import net from 'net';
import http from 'http';
import express from 'express';
import Fastify from 'fastify';
import { schema, pong } from './fixtures/simple';

import { createHandler as createHttpHandler } from '../use/http';
import { createHandler as createExpressHandler } from '../use/express';
import { createHandler as createFastifyHandler } from '../use/fastify';

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

it.each([
  {
    name: 'http',
    startServer: async () => {
      const server = http.createServer(createHttpHandler({ schema }));
      server.listen(0);
      const port = (server.address() as net.AddressInfo).port;
      return [
        `http://localhost:${port}`,
        makeDisposeForServer(server),
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
      ] as const;
    },
  },
  {
    name: 'fastify',
    startServer: async () => {
      const fastify = Fastify();
      fastify.all('/', createFastifyHandler({ schema }));
      const url = await fastify.listen({ port: 0 });
      return [url, makeDisposeForServer(fastify.server)] as const;
    },
  },
  // no need to test fetch because the handler is pure (gets request, returns response)
  // {
  //   name: 'fetch',
  //   startServer: async () => {
  //     //
  //   },
  // },
])(
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
    await expect(reader.next()).resolves.toMatchInlineSnapshot(`
      {
        "done": false,
        "value": "event: next
      data: {"data":{"ping":"pong"}}

      ",
      }
    `);

    ctrl.abort();
    await expect(reader.next()).rejects.toEqual(
      expect.objectContaining({
        message: 'The operation was aborted.',
      }),
    );

    // wait for one tick
    await new Promise((resolve) => setTimeout(resolve, 0));

    // issue ping
    pong(pingKey);

    // nothing should explode
  },
);
