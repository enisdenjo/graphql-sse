<div align="center">
  <br />

  <h3>graphql-sse</h3>

  <h6>Zero-dependency, HTTP/1 safe, simple, <a href="PROTOCOL.md">GraphQL over Server-Sent Events Protocol</a> server and client.</h6>

[![Continuous integration](https://github.com/enisdenjo/graphql-sse/workflows/Continuous%20integration/badge.svg)](https://github.com/enisdenjo/graphql-sse/actions?query=workflow%3A%22Continuous+integration%22) [![graphql-sse](https://img.shields.io/npm/v/graphql-sse.svg?label=graphql-sse&logo=npm)](https://www.npmjs.com/package/graphql-sse)

  <br />
</div>

## Getting started

#### Install

```shell
$ yarn add graphql-sse
```

#### Create a GraphQL schema

```ts
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

```ts
import http from 'http';
import { createHandler } from 'graphql-sse';

// Create the GraphQL over SSE handler
const handler = createHandler({
  schema, // from the previous step
});

// Create a HTTP server using the handler on `/graphql/stream`
const server = http.createServer((req, res) => {
  if (req.url.startsWith('/graphql/stream')) return handler(req, res);
  return res.writeHead(404).end();
});

server.listen(4000);
console.log('Listening to port 4000');
```

##### With [`express`](https://expressjs.com/)

```ts
import express from 'express'; // yarn add express
import { createHandler } from 'graphql-sse';

// Create the GraphQL over SSE handler
const handler = createHandler({ schema });

// Create an express app serving all methods on `/graphql/stream`
const app = express();
app.all('/graphql/stream', handler);

app.listen(4000);
console.log('Listening to port 4000');
```

##### With [`fastify`](https://www.fastify.io/)

```ts
import Fastify from 'fastify'; // yarn add fastify
import { createHandler } from 'graphql-sse';

// Create the GraphQL over SSE handler
const handler = createHandler({ schema });

// Create a fastify instance serving all methods on `/graphql/stream`
const fastify = Fastify();
fastify.all('/graphql/stream', (req, res) =>
  handler(
    req.raw,
    res.raw,
    req.body, // fastify reads the body for you
  ),
);

fastify.listen(4000);
console.log('Listening to port 4000');
```

#### Use the client

```ts
import { createClient } from 'graphql-sse';

const client = createClient({
  url: 'http://welcomer.com:4000/graphql/stream',
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

## [Documentation](docs/)

Check the [docs folder](docs/) out for [TypeDoc](https://typedoc.org) generated documentation.

## [How does it work?](PROTOCOL.md)

Read about the exact transport intricacies used by the library in the [GraphQL over Server-Sent Events Protocol document](PROTOCOL.md).

## [Want to help?](CONTRIBUTING.md)

File a bug, contribute with code, or improve documentation? Read up on our guidelines for [contributing](CONTRIBUTING.md) and drive development with `yarn test --watch` away!
