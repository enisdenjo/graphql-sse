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

## Recipes

<details id="promise">
<summary><a href="#promise">🔗</a> Client usage with Promise</summary>

```ts
import { createClient, SubscribePayload } from 'graphql-sse';

const client = createClient({
  url: 'http://hey.there:4000/graphql/stream',
});

async function execute<T>(payload: SubscribePayload) {
  return new Promise<T>((resolve, reject) => {
    let result: T;
    client.subscribe<T>(payload, {
      next: (data) => (result = data),
      error: reject,
      complete: () => resolve(result),
    });
  });
}

// use
(async () => {
  try {
    const result = await execute({
      query: '{ hello }',
    });
    // complete
    // next = result = { data: { hello: 'Hello World!' } }
  } catch (err) {
    // error
  }
})();
```

</details>

<details id="async-iterator">
<summary><a href="#async-iterator">🔗</a> Client usage with <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/asyncIterator">AsyncIterator</a></summary>

```ts
import { createClient, SubscribePayload } from 'graphql-sse';

const client = createClient({
  url: 'http://iterators.ftw:4000/graphql/stream',
});

function subscribe<T>(payload: SubscribePayload): AsyncIterableIterator<T> {
  let deferred: {
    resolve: (done: boolean) => void;
    reject: (err: unknown) => void;
  } | null = null;
  const pending: T[] = [];
  let throwMe: unknown = null,
    done = false;
  const dispose = client.subscribe<T>(payload, {
    next: (data) => {
      pending.push(data);
      deferred?.resolve(false);
    },
    error: (err) => {
      throwMe = err;
      deferred?.reject(throwMe);
    },
    complete: () => {
      done = true;
      deferred?.resolve(true);
    },
  });
  return {
    [Symbol.asyncIterator]() {
      return this;
    },
    async next() {
      if (done) return { done: true, value: undefined };
      if (throwMe) throw throwMe;
      if (pending.length) return { value: pending.shift()! };
      return (await new Promise<boolean>(
        (resolve, reject) => (deferred = { resolve, reject }),
      ))
        ? { done: true, value: undefined }
        : { value: pending.shift()! };
    },
    async return() {
      dispose();
      return { done: true, value: undefined };
    },
  };
}

(async () => {
  const subscription = subscribe({
    query: 'subscription { greetings }',
  });
  // subscription.return() to dispose

  for await (const result of subscription) {
    // next = result = { data: { greetings: 5x } }
  }
  // complete
})();
```

</details>

<details id="observable">
<summary><a href="#observable">🔗</a> Client usage with <a href="https://github.com/tc39/proposal-observable">Observable</a></summary>

```ts
import { Observable } from 'relay-runtime';
// or
import { Observable } from '@apollo/client/core';
// or
import { Observable } from 'rxjs';
// or
import Observable from 'zen-observable';
// or any other lib which implements Observables as per the ECMAScript proposal: https://github.com/tc39/proposal-observable

const client = createClient({
  url: 'http://graphql.loves:4000/observables',
});

function toObservable(operation) {
  return new Observable((observer) =>
    client.subscribe(operation, {
      next: (data) => observer.next(data),
      error: (err) => observer.error(err),
      complete: () => observer.complete(),
    }),
  );
}

const observable = toObservable({ query: `subscription { ping }` });

const subscription = observable.subscribe({
  next: (data) => {
    expect(data).toBe({ data: { ping: 'pong' } });
  },
});

// ⏱

subscription.unsubscribe();
```

</details>

<details id="relay">
<summary><a href="#relay">🔗</a> Client usage with <a href="https://relay.dev">Relay</a></summary>

```ts
import { GraphQLError } from 'graphql';
import {
  Network,
  Observable,
  RequestParameters,
  Variables,
} from 'relay-runtime';
import { createClient } from 'graphql-sse';

const subscriptionsClient = createClient({
  url: 'http://i.love:4000/graphql/stream',
  headers: () => {
    const session = getSession();
    if (!session) return {};
    return {
      Authorization: `Bearer ${session.token}`,
    };
  },
});

// yes, both fetch AND subscribe can be handled in one implementation
function fetchOrSubscribe(operation: RequestParameters, variables: Variables) {
  return Observable.create((sink) => {
    if (!operation.text) {
      return sink.error(new Error('Operation text cannot be empty'));
    }
    return subscriptionsClient.subscribe(
      {
        operationName: operation.name,
        query: operation.text,
        variables,
      },
      sink,
    );
  });
}

export const network = Network.create(fetchOrSubscribe, fetchOrSubscribe);
```

</details>

<details id="urql">
<summary><a href="#urql">🔗</a> Client usage with <a href="https://formidable.com/open-source/urql/">urql</a></summary>

```ts
import { createClient, defaultExchanges, subscriptionExchange } from 'urql';
import { createClient as createWSClient } from 'graphql-sse';

const sseClient = createWSClient({
  url: 'http://its.urql:4000/graphql/stream',
});

const client = createClient({
  url: '/graphql/stream',
  exchanges: [
    ...defaultExchanges,
    subscriptionExchange({
      forwardSubscription(operation) {
        return {
          subscribe: (sink) => {
            const dispose = sseClient.subscribe(operation, sink);
            return {
              unsubscribe: dispose,
            };
          },
        };
      },
    }),
  ],
});
```

</details>

<details id="apollo-client">
<summary><a href="#apollo-client">🔗</a> Client usage with <a href="https://www.apollographql.com">Apollo</a></summary>

```typescript
import {
  ApolloLink,
  Operation,
  FetchResult,
  Observable,
} from '@apollo/client/core';
import { print, GraphQLError } from 'graphql';
import { createClient, ClientOptions, Client } from 'graphql-sse';

class SSELink extends ApolloLink {
  private client: Client;

  constructor(options: ClientOptions) {
    super();
    this.client = createClient(options);
  }

  public request(operation: Operation): Observable<FetchResult> {
    return new Observable((sink) => {
      return this.client.subscribe<FetchResult>(
        { ...operation, query: print(operation.query) },
        {
          next: sink.next.bind(sink),
          complete: sink.complete.bind(sink),
          error: sink.error.bind(sink),
        },
      );
    });
  }
}

const link = new SSELink({
  url: 'http://where.is:4000/graphql/stream',
  headers: () => {
    const session = getSession();
    if (!session) return {};
    return {
      Authorization: `Bearer ${session.token}`,
    };
  },
});
```

</details>

<details id="single-connection-mode">
<summary><a href="#single-connection-mode">🔗</a> Client usage for HTTP/1 (aka. <a href="https://github.com/enisdenjo/graphql-sse/blob/master/PROTOCOL.md#single-connection-mode">single connection mode</a>)</summary>

```typescript
import { createClient } from 'graphql-sse';

const client = createClient({
  singleConnection: true, // this is literally it 😄
  url: 'http://use.single:4000/connection/graphql/stream',
  // lazy: true (default) -> connect on first subscribe and disconnect on last unsubscribe
  // lazy: false -> connect as soon as the client is created
});

// The client will now run in a "single connection mode" mode. Meaning,
// a single SSE connection will be used to transmit all operation results
// while separate HTTP requests will be issued to dictate the behaviour.
```

</details>

<details id="retry-strategy">
<summary><a href="#retry-strategy">🔗</a> Client usage with custom retry timeout strategy</summary>

```typescript
import { createClient } from 'graphql-sse';
import { waitForHealthy } from './my-servers';

const url = 'http://i.want.retry:4000/control/graphql/stream';

const client = createClient({
  url,
  retryWait: async function waitForServerHealthyBeforeRetry() {
    // if you have a server healthcheck, you can wait for it to become
    // healthy before retrying after an abrupt disconnect (most commonly a restart)
    await waitForHealthy(url);

    // after the server becomes ready, wait for a second + random 1-4s timeout
    // (avoid DDoSing yourself) and try connecting again
    await new Promise((resolve) =>
      setTimeout(resolve, 1000 + Math.random() * 3000),
    );
  },
});
```

</details>

<details id="browser">
<summary><a href="#browser">🔗</a> Client usage in browser</summary>

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>GraphQL over Server-Sent Events</title>
    <script
      type="text/javascript"
      src="https://unpkg.com/graphql-sse/umd/graphql-sse.min.js"
    ></script>
  </head>
  <body>
    <script type="text/javascript">
      const client = graphqlSse.createClient({
        url: 'http://umdfor.the:4000/win/graphql/stream',
      });

      // consider other recipes for usage inspiration
    </script>
  </body>
</html>
```

</details>

<details id="node-client">
<summary><a href="#node-client">🔗</a> Client usage in Node</summary>

```ts
const ws = require('ws'); // yarn add ws
const fetch = require('node-fetch'); // yarn add node-fetch
const { AbortController } = require('node-abort-controller'); // (node < v15) yarn add node-abort-controller
const Crypto = require('crypto');
const { createClient } = require('graphql-sse');

const client = createClient({
  url: 'http://no.browser:4000/graphql/stream',
  fetchFn: fetch,
  abortControllerImpl: AbortController, // node < v15
  /**
   * Generates a v4 UUID to be used as the ID.
   * Reference: https://gist.github.com/jed/982883
   */
  generateID: () =>
    ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
      (c ^ (Crypto.randomBytes(1)[0] & (15 >> (c / 4)))).toString(16),
    ),
});

// consider other recipes for usage inspiration
```

</details>

<details id="auth">
<summary><a href="#schema">🔗</a> Server handler usage with custom authentication</summary>

```typescript
import { createHandler } from 'graphql-sse';
import {
  schema,
  getOrCreateTokenFromCookies,
  customAuthenticationTokenDiscovery,
  processAuthorizationHeader,
} from './my-graphql';

const handler = createHandler({
  schema,
  authenticate: async (req, res) => {
    let token = req.headers['x-graphql-event-stream-token'];
    if (token) {
      // When the client is working in a "single connection mode"
      // all subsequent requests for operations will have the
      // stream token set in the `X-GraphQL-Event-Stream-Token` header.
      //
      // It is considered safe to accept the header token always
      // because if a stream reservation does not exist, or is already
      // fulfilled, the handler itself will reject the request.
      //
      // Read more: https://github.com/enisdenjo/graphql-sse/blob/master/PROTOCOL.md#single-connection-mode
      return Array.isArray(token) ? token.join('') : token;
    }

    // It is necessary to generate a unique token when dealing with
    // clients that operate in the "single connection mode". The process
    // of generating the token is completely up to the implementor.
    token = getOrCreateTokenFromCookies(req);
    // or
    token = processAuthorizationHeader(req.headers['authorization']);
    // or
    token = await customAuthenticationTokenDiscovery(req);

    // Using the response argument the implementor may respond to
    // authentication issues however he sees fit.
    if (!token) return res.writeHead(401, 'Unauthorized').end();

    // Clients that operate in "distinct connections mode" dont
    // need a unique stream token. It is completely ok to simply
    // return an empty string for authenticated clients.
    //
    // Read more: https://github.com/enisdenjo/graphql-sse/blob/master/PROTOCOL.md#distinct-connections-mode
    if (req.method === 'POST' && req.headers.accept === 'text/event-stream') {
      // "distinct connections mode" requests an event-stream with a POST
      // method. These two checks, together with the lack of `X-GraphQL-Event-Stream-Token`
      // header, are sufficient for accurate detection.
      return ''; // return token; is OK too
    }

    // On the other hand, clients operating in "single connection mode"
    // need a unique stream token which will be provided alongside the
    // incoming event stream request inside the `X-GraphQL-Event-Stream-Token` header.
    //
    // Read more: https://github.com/enisdenjo/graphql-sse/blob/master/PROTOCOL.md#single-connection-mode
    return token;
  },
});

// use `handler` with your favourite http library
```

</details>

<details id="dynamic-schema">
<summary><a href="#dynamic-schema">🔗</a> Server handler usage with dynamic schema</summary>

```typescript
import { createHandler } from 'graphql-sse';
import { schema, checkIsAdmin, getDebugSchema } from './my-graphql';

const handler = createHandler({
  schema: async (req, executionArgsWithoutSchema) => {
    // will be called on every subscribe request
    // allowing you to dynamically supply the schema
    // using the depending on the provided arguments
    const isAdmin = await checkIsAdmin(req);
    if (isAdmin) return getDebugSchema(req, executionArgsWithoutSchema);
    return schema;
  },
});

// use `handler` with your favourite http library
```

</details>

<details id="context">
<summary><a href="#context">🔗</a> Server handler usage with custom context value</summary>

```typescript
import { createHandler } from 'graphql-sse';
import { schema, getDynamicContext } from './my-graphql';

const handler = createHandler({
  schema,
  // or static context by supplying the value direcly
  context: async (req, args) => {
    return getDynamicContext(req, args);
  },
});

// use `handler` with your favourite http library
```

</details>

<details id="custom-exec">
<summary><a href="#custom-exec">🔗</a> Server handler usage with custom execution arguments</summary>

```typescript
import { parse } from 'graphql';
import { createHandler } from 'graphql-sse';
import { getSchema, myValidationRules } from './my-graphql';

const handler = createHandler({
  onSubscribe: async (req, _res, params) => {
    const schema = await getSchema(req);

    const args = {
      schema,
      operationName: params.operationName,
      document: parse(params.query),
      variableValues: params.variables,
    };

    return args;
  },
});

// use `handler` with your favourite http library
```

</details>

<details id="persisted">
<summary><a href="#persisted">🔗</a> Server handler and client usage with persisted queries</summary>

```typescript
// 🛸 server

import { parse, ExecutionArgs } from 'graphql';
import { createHandler } from 'graphql-sse';
import { schema } from './my-graphql-schema';

// a unique GraphQL execution ID used for representing
// a query in the persisted queries store. when subscribing
// you should use the `SubscriptionPayload.query` to transmit the id
type QueryID = string;

const queriesStore: Record<QueryID, ExecutionArgs> = {
  iWantTheGreetings: {
    schema, // you may even provide different schemas in the queries store
    document: parse('subscription Greetings { greetings }'),
  },
};

const handler = createHandler(
  {
    onSubscribe: (req, res, params) => {
      const persistedQuery = queriesStore[params.extensions?.persistedQuery];
      if (persistedQuery) {
        return {
          ...persistedQuery,
          variableValues: params.variables, // use the variables from the client
        };
      }

      // for extra security only allow the queries from the store
      return res.writeHead(404, 'Query Not Found').end();
    },
  },
  wsServer,
);

// use `handler` with your favourite http library
```

```typescript
// 📺 client

import { createClient } from 'graphql-sse';

const client = createClient({
  url: 'http://persisted.graphql:4000/queries',
});

(async () => {
  const onNext = () => {
    /**/
  };

  await new Promise((resolve, reject) => {
    client.subscribe(
      {
        query: '', // query field is required, but you can leave it empty for persisted queries
        extensions: {
          persistedQuery: 'iWantTheGreetings',
        },
      },
      {
        next: onNext,
        error: reject,
        complete: resolve,
      },
    );
  });

  expect(onNext).toBeCalledTimes(5); // greetings in 5 languages
})();
```

</details>

## [Documentation](docs/)

Check the [docs folder](docs/) out for [TypeDoc](https://typedoc.org) generated documentation.

## [How does it work?](PROTOCOL.md)

Read about the exact transport intricacies used by the library in the [GraphQL over Server-Sent Events Protocol document](PROTOCOL.md).

## [Want to help?](CONTRIBUTING.md)

File a bug, contribute with code, or improve documentation? Read up on our guidelines for [contributing](CONTRIBUTING.md) and drive development with `yarn test --watch` away!
