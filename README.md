<div align="center">
  <br />

  <h3>graphql-sse</h3>

  <h6>Zero-dependency, HTTP/1 safe, simple, <a href="PROTOCOL.md">GraphQL over Server-Sent Events Protocol</a> server and client.</h6>

[![Continuous integration](https://github.com/enisdenjo/graphql-sse/workflows/Continuous%20integration/badge.svg)](https://github.com/enisdenjo/graphql-sse/actions?query=workflow%3A%22Continuous+integration%22) [![graphql-sse](https://img.shields.io/npm/v/graphql-sse.svg?label=graphql-sse&logo=npm)](https://www.npmjs.com/package/graphql-sse)

<i>Use [WebSockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket) instead? Check out <b>[graphql-ws](https://github.com/enisdenjo/graphql-ws)</b>!</i>

  <br />
</div>

## Getting started

#### Install

```shell
yarn add graphql-sse
```

#### Create a GraphQL schema

```js
import { GraphQLSchema, GraphQLObjectType, GraphQLString } from 'graphql';

/**
 * Construct a GraphQL schema and define the necessary resolvers.
 *
 * type Query {
 *   hello: String
 * }
 * type Subscription {
 *   greetings: String
 * }
 */
const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    fields: {
      hello: {
        type: GraphQLString,
        resolve: () => 'world',
      },
    },
  }),
  subscription: new GraphQLObjectType({
    name: 'Subscription',
    fields: {
      greetings: {
        type: GraphQLString,
        subscribe: async function* () {
          for (const hi of ['Hi', 'Bonjour', 'Hola', 'Ciao', 'Zdravo']) {
            yield { greetings: hi };
          }
        },
      },
    },
  }),
});
```

#### Start the server

##### With [`http`](https://nodejs.org/api/http.html)

```js
import http from 'http';
import { createHandler } from 'graphql-sse/lib/use/http';
import { schema } from './previous-step';

// Create the GraphQL over SSE handler
const handler = createHandler({ schema });

// Create an HTTP server using the handler on `/graphql/stream`
const server = http.createServer((req, res) => {
  if (req.url.startsWith('/graphql/stream')) {
    return handler(req, res);
  }
  res.writeHead(404).end();
});

server.listen(4000);
console.log('Listening to port 4000');
```

##### With [`http2`](https://nodejs.org/api/http2.html)

_Browsers might complain about self-signed SSL/TLS certificates. [Help can be found on StackOverflow.](https://stackoverflow.com/questions/7580508/getting-chrome-to-accept-self-signed-localhost-certificate)_

```shell
$ openssl req -x509 -newkey rsa:2048 -nodes -sha256 -subj '/CN=localhost' \
  -keyout localhost-privkey.pem -out localhost-cert.pem
```

```js
import fs from 'fs';
import http2 from 'http2';
import { createHandler } from 'graphql-sse/lib/use/http2';
import { schema } from './previous-step';

// Create the GraphQL over SSE handler
const handler = createHandler({ schema });

// Create an HTTP/2 server using the handler on `/graphql/stream`
const server = http2.createServer((req, res) => {
  if (req.url.startsWith('/graphql/stream')) {
    return handler(req, res);
  }
  res.writeHead(404).end();
});

server.listen(4000);
console.log('Listening to port 4000');
```

##### With [`express`](https://expressjs.com)

```js
import express from 'express'; // yarn add express
import { createHandler } from 'graphql-sse/lib/use/express';
import { schema } from './previous-step';

// Create the GraphQL over SSE handler
const handler = createHandler({ schema });

// Create an express app
const app = express();

// Serve all methods on `/graphql/stream`
app.use('/graphql/stream', handler);

server.listen(4000);
console.log('Listening to port 4000');
```

##### With [`fastify`](https://www.fastify.io)

```js
import Fastify from 'fastify'; // yarn add fastify
import { createHandler } from 'graphql-sse/lib/use/fastify';

// Create the GraphQL over SSE handler
const handler = createHandler({ schema });

// Create a fastify app
const fastify = Fastify();

// Serve all methods on `/graphql/stream`
fastify.all('/graphql/stream', handler);

fastify.listen({ port: 4000 });
console.log('Listening to port 4000');
```

##### With [`Deno`](https://deno.land/)

```ts
import { serve } from 'https://deno.land/std/http/server.ts';
import { createHandler } from 'https://esm.sh/graphql-sse/lib/use/fetch';
import { schema } from './previous-step';

// Create the GraphQL over SSE native fetch handler
const handler = createHandler({ schema });

// Serve on `/graphql/stream` using the handler
await serve(
  (req: Request) => {
    const [path, _search] = req.url.split('?');
    if (path.endsWith('/graphql/stream')) {
      return await handler(req);
    }
    return new Response(null, { status: 404 });
  },
  {
    port: 4000, // Listening to port 4000
  },
);
```

##### With [`Bun@>=0.5.7`](https://bun.sh/)

[⚠️ Bun's fetch does not support streaming.](https://github.com/oven-sh/bun/issues/2103#issuecomment-1435652020)

```js
import { createHandler } from 'graphql-sse/lib/use/fetch'; // bun install graphql-sse
import { schema } from './previous-step';

// Create the GraphQL over SSE native fetch handler
const handler = createHandler({ schema });

// Serve on `/graphql/stream` using the handler
export default {
  port: 4000, // Listening to port 4000
  async fetch(req) {
    const [path, _search] = req.url.split('?');
    if (path.endsWith('/graphql/stream')) {
      return await handler(req);
    }
    return new Response(null, { status: 404 });
  },
};
```

#### Use the client

```js
import { createClient } from 'graphql-sse';

const client = createClient({
  // singleConnection: true, preferred for HTTP/1 enabled servers. read more below
  url: 'http://localhost:4000/graphql/stream',
});

// query
(async () => {
  const result = await new Promise((resolve, reject) => {
    let result;
    client.subscribe(
      {
        query: '{ hello }',
      },
      {
        next: (data) => (result = data),
        error: reject,
        complete: () => resolve(result),
      },
    );
  });

  expect(result).toEqual({ hello: 'world' });
})();

// subscription
(async () => {
  const onNext = () => {
    /* handle incoming values */
  };

  let unsubscribe = () => {
    /* complete the subscription */
  };

  await new Promise((resolve, reject) => {
    unsubscribe = client.subscribe(
      {
        query: 'subscription { greetings }',
      },
      {
        next: onNext,
        error: reject,
        complete: resolve,
      },
    );
  });

  expect(onNext).toBeCalledTimes(5); // we say "Hi" in 5 languages
})();
```

## [Recipes](https://the-guild.dev/graphql/sse/recipes)

Short and concise code snippets for starting with common use-cases. [Available on the website.](https://the-guild.dev/graphql/sse/recipes)

</details>

## [Documentation](https://the-guild.dev/graphql/sse/docs)

Check the [website docs folder](website/src/pages/docs) out for [TypeDoc](https://typedoc.org) generated documentation and the [website for the render](https://the-guild.dev/graphql/sse/docs).

## [How does it work?](PROTOCOL.md)

Read about the exact transport intricacies used by the library in the [GraphQL over Server-Sent Events Protocol document](PROTOCOL.md).

## [Want to help?](CONTRIBUTING.md)

File a bug, contribute with code, or improve documentation? Read up on our guidelines for [contributing](CONTRIBUTING.md) and drive development with `yarn test --watch` away!
