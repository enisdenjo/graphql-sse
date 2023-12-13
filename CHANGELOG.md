# [2.5.0](https://github.com/enisdenjo/graphql-sse/compare/v2.4.1...v2.5.0) (2023-12-13)


### Features

* **use/koa:** expose full Koa context to options ([#86](https://github.com/enisdenjo/graphql-sse/issues/86)) ([b37a6f9](https://github.com/enisdenjo/graphql-sse/commit/b37a6f92f32ac15bb40df2753545c48b054141de))

## [2.4.1](https://github.com/enisdenjo/graphql-sse/compare/v2.4.0...v2.4.1) (2023-12-13)


### Bug Fixes

* Add koa exports to package.json ([#85](https://github.com/enisdenjo/graphql-sse/issues/85)) ([e99cf99](https://github.com/enisdenjo/graphql-sse/commit/e99cf99d6c011e931353fdf876f91989e6cd3d70))

# [2.4.0](https://github.com/enisdenjo/graphql-sse/compare/v2.3.0...v2.4.0) (2023-11-29)


### Bug Fixes

* **client:** Use closures instead of bindings (with `this`) ([8ecdf3c](https://github.com/enisdenjo/graphql-sse/commit/8ecdf3cffb5e013466defbbb131b7faeb39ec27a))


### Features

* **client:** Event listeners for both operation modes ([#84](https://github.com/enisdenjo/graphql-sse/issues/84)) ([6274f44](https://github.com/enisdenjo/graphql-sse/commit/6274f44983e3c5ca7e343c880d10faf928597848))

# [2.3.0](https://github.com/enisdenjo/graphql-sse/compare/v2.2.3...v2.3.0) (2023-09-07)


### Features

* **handler:** Use Koa ([#80](https://github.com/enisdenjo/graphql-sse/issues/80)) ([283b453](https://github.com/enisdenjo/graphql-sse/commit/283b453bd41abbd14c88f5076bf9149b3104ffd9)), closes [#78](https://github.com/enisdenjo/graphql-sse/issues/78)

## [2.2.3](https://github.com/enisdenjo/graphql-sse/compare/v2.2.2...v2.2.3) (2023-08-23)


### Bug Fixes

* **use/http,use/http2,use/express,use/fastify:** Check `writable` instead of `closed` before writing to response ([3c71f69](https://github.com/enisdenjo/graphql-sse/commit/3c71f69262a5b30f74e5d743c8b9415bbb4b1ce9)), closes [#69](https://github.com/enisdenjo/graphql-sse/issues/69)

## [2.2.2](https://github.com/enisdenjo/graphql-sse/compare/v2.2.1...v2.2.2) (2023-08-22)


### Bug Fixes

* **use/http,use/http2,use/express,use/fastify:** Handle cases where response's `close` event is late ([#75](https://github.com/enisdenjo/graphql-sse/issues/75)) ([4457cba](https://github.com/enisdenjo/graphql-sse/commit/4457cba74ab0f4474b648b2b3d75f88edcb1fe9b)), closes [#69](https://github.com/enisdenjo/graphql-sse/issues/69)

## [2.2.1](https://github.com/enisdenjo/graphql-sse/compare/v2.2.0...v2.2.1) (2023-07-31)


### Bug Fixes

* **handler:** Always include the `data` field in stream messages ([#71](https://github.com/enisdenjo/graphql-sse/issues/71)) ([4643c9a](https://github.com/enisdenjo/graphql-sse/commit/4643c9a093345db5ddc4fcf082e1d8ff5bfc3ec0))

# [2.2.0](https://github.com/enisdenjo/graphql-sse/compare/v2.1.4...v2.2.0) (2023-06-22)


### Features

* **client:** Async iterator for subscriptions ([#66](https://github.com/enisdenjo/graphql-sse/issues/66)) ([fb8bf11](https://github.com/enisdenjo/graphql-sse/commit/fb8bf1145943feb8ef808f52a022e2f67e49e577))

## [2.1.4](https://github.com/enisdenjo/graphql-sse/compare/v2.1.3...v2.1.4) (2023-06-12)


### Bug Fixes

* Request parameters `query` field can only be a string ([16c9600](https://github.com/enisdenjo/graphql-sse/commit/16c9600b37ca21d6cfa3fa745bd41887b98589fd)), closes [#65](https://github.com/enisdenjo/graphql-sse/issues/65)

## [2.1.3](https://github.com/enisdenjo/graphql-sse/compare/v2.1.2...v2.1.3) (2023-05-15)


### Bug Fixes

* **client:** Respect retry attempts when server goes away after connecting in single connection mode ([#59](https://github.com/enisdenjo/graphql-sse/issues/59)) ([e895c5b](https://github.com/enisdenjo/graphql-sse/commit/e895c5bedc868fcae344acd60b25d89ba5a7eda4)), closes [#55](https://github.com/enisdenjo/graphql-sse/issues/55)
* **handler:** Detect `ExecutionArgs` in `onSubscribe` return value ([a16b921](https://github.com/enisdenjo/graphql-sse/commit/a16b921682523c6f102471ab29f347c14483de5c)), closes [#58](https://github.com/enisdenjo/graphql-sse/issues/58)

## [2.1.2](https://github.com/enisdenjo/graphql-sse/compare/v2.1.1...v2.1.2) (2023-05-10)


### Bug Fixes

* **client:** Respect retry attempts when server goes away after connecting ([#57](https://github.com/enisdenjo/graphql-sse/issues/57)) ([75c9f17](https://github.com/enisdenjo/graphql-sse/commit/75c9f17040c0f0242247ac722cde2e9032a878e3)), closes [#55](https://github.com/enisdenjo/graphql-sse/issues/55)


### Reverts

* Revert "Revert "docs: website (#50)"" ([0e4f4b5](https://github.com/enisdenjo/graphql-sse/commit/0e4f4b5655e1c8bf518b9a400734ec7ee5d5578b)), closes [#50](https://github.com/enisdenjo/graphql-sse/issues/50)

## [2.1.1](https://github.com/enisdenjo/graphql-sse/compare/v2.1.0...v2.1.1) (2023-03-31)


### Bug Fixes

* Add file extensions to imports/exports in ESM type definitions ([bbf23b1](https://github.com/enisdenjo/graphql-sse/commit/bbf23b175412d7bf91c7dd9ad0fb290e53916f1d))

# [2.1.0](https://github.com/enisdenjo/graphql-sse/compare/v2.0.0...v2.1.0) (2023-02-17)


### Bug Fixes

* **use/express,use/fastify:** Resolve body if previously parsed ([6573e94](https://github.com/enisdenjo/graphql-sse/commit/6573e94cd20283e05bb7b3e890c0930bf1b72a16))


### Features

* **handler:** Export handler options type for each integration ([2a2e517](https://github.com/enisdenjo/graphql-sse/commit/2a2e51739db88d20ca9dc55236d6ae5c9a155b0f))

# [2.0.0](https://github.com/enisdenjo/graphql-sse/compare/v1.3.2...v2.0.0) (2022-12-20)


### Features

* **handler:** Server and environment agnostic handler ([#37](https://github.com/enisdenjo/graphql-sse/issues/37)) ([22cf03d](https://github.com/enisdenjo/graphql-sse/commit/22cf03d3c214019a3bf538742bbceac766c17353))


### BREAKING CHANGES

* **handler:** The handler is now server agnostic and can run _anywhere_

- Core of `graphql-sse` is now server agnostic and as such offers a handler that implements a generic request/response model
- Handler does not await for whole operation to complete anymore. Only the processing part (parsing, validating and executing)
- GraphQL context is now typed
- Hook arguments have been changed, they're not providing the Node native req/res anymore - they instead provide the generic request/response
- `onSubscribe` hook can now return an execution result too (useful for caching for example)
- Throwing in `onNext` and `onComplete` hooks will bubble the error to the returned iterator

### Migration

Even though the core of graphql-sse is now completely server agnostic, there are adapters to ease the integration with existing solutions. Migrating is actually not a headache!

Beware that the adapters **don't** handle internal errors, it's your responsibility to take care of that and behave accordingly.

#### [`http`](https://nodejs.org/api/http.html)

```diff
import http from 'http';
- import { createHandler } from 'graphql-sse';
+ import { createHandler } from 'graphql-sse/lib/use/http';

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

#### [`http2`](https://nodejs.org/api/http2.html)

```diff
import fs from 'fs';
import http2 from 'http2';
- import { createHandler } from 'graphql-sse';
+ import { createHandler } from 'graphql-sse/lib/use/http2';

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

#### [`express`](https://expressjs.com/)

```diff
import express from 'express'; // yarn add express
- import { createHandler } from 'graphql-sse';
+ import { createHandler } from 'graphql-sse/lib/use/express';

// Create the GraphQL over SSE handler
const handler = createHandler({ schema });

// Create an express app
const app = express();

// Serve all methods on `/graphql/stream`
app.use('/graphql/stream', handler);

server.listen(4000);
console.log('Listening to port 4000');
```

#### [`fastify`](https://www.fastify.io/)

```diff
import Fastify from 'fastify'; // yarn add fastify
- import { createHandler } from 'graphql-sse';
+ import { createHandler } from 'graphql-sse/lib/use/fastify';

// Create the GraphQL over SSE handler
const handler = createHandler({ schema });

// Create a fastify app
const fastify = Fastify();

// Serve all methods on `/graphql/stream`
fastify.all('/graphql/stream', handler);

fastify.listen({ port: 4000 });
console.log('Listening to port 4000');
```

## [1.3.2](https://github.com/enisdenjo/graphql-sse/compare/v1.3.1...v1.3.2) (2022-12-06)


### Bug Fixes

* **handler:** Correct typings and support for http2 ([08d6ca3](https://github.com/enisdenjo/graphql-sse/commit/08d6ca39d4cd178b9262af342266bb8fbd9268d1)), closes [#38](https://github.com/enisdenjo/graphql-sse/issues/38)

## [1.3.1](https://github.com/enisdenjo/graphql-sse/compare/v1.3.0...v1.3.1) (2022-12-05)


### Bug Fixes

* **client:** Abort request when reporting error ([91057bd](https://github.com/enisdenjo/graphql-sse/commit/91057bd58a9edd7c83b2af4bb368511bdcf312b4))
* **client:** Operation requests are of application/json content-type ([0084de7](https://github.com/enisdenjo/graphql-sse/commit/0084de7c7f55c77c9b9156b98c264b90f49bf2b2))

# [1.3.0](https://github.com/enisdenjo/graphql-sse/compare/v1.2.5...v1.3.0) (2022-07-20)


### Features

* **client:** Accept `referrer` and `referrerPolicy` fetch options ([#32](https://github.com/enisdenjo/graphql-sse/issues/32)) ([dbaa90a](https://github.com/enisdenjo/graphql-sse/commit/dbaa90af1ab5cad06f03deef422c2216397498f1))

## [1.2.5](https://github.com/enisdenjo/graphql-sse/compare/v1.2.4...v1.2.5) (2022-07-17)


### Bug Fixes

* **client:** Leverage active streams for reliable network error retries ([607b468](https://github.com/enisdenjo/graphql-sse/commit/607b4684b99284108ba4cd4d9c79f0a56bd16fbd))

## [1.2.4](https://github.com/enisdenjo/graphql-sse/compare/v1.2.3...v1.2.4) (2022-07-01)


### Bug Fixes

* Add types path to package.json `exports` ([44f95b6](https://github.com/enisdenjo/graphql-sse/commit/44f95b63c47f1faf06dfa671c6a4507b4ce7768b))

## [1.2.3](https://github.com/enisdenjo/graphql-sse/compare/v1.2.2...v1.2.3) (2022-06-13)


### Bug Fixes

* **client:** Retry if connection is closed while having active streams ([83a0178](https://github.com/enisdenjo/graphql-sse/commit/83a0178d6964fa0ff889de1db9be062212f4474e)), closes [#28](https://github.com/enisdenjo/graphql-sse/issues/28)

## [1.2.2](https://github.com/enisdenjo/graphql-sse/compare/v1.2.1...v1.2.2) (2022-06-09)


### Bug Fixes

* **client:** Network errors during event emission contain the keyword "stream" in Firefox ([054f16b](https://github.com/enisdenjo/graphql-sse/commit/054f16b7bfb7cc6928dd538de3029719591c9ebe))

## [1.2.1](https://github.com/enisdenjo/graphql-sse/compare/v1.2.0...v1.2.1) (2022-06-09)


### Bug Fixes

* **client:** Retry network errors even if they occur during event emission ([489b1b0](https://github.com/enisdenjo/graphql-sse/commit/489b1b01d89881724ab8bf4dee3d1e395089101d)), closes [#27](https://github.com/enisdenjo/graphql-sse/issues/27)


### Performance Improvements

* **client:** Avoid recreating result variables when reading the response stream ([16f6a6c](https://github.com/enisdenjo/graphql-sse/commit/16f6a6c5ec77f63d19afda1c847e965a12513fc7))

# [1.2.0](https://github.com/enisdenjo/graphql-sse/compare/v1.1.0...v1.2.0) (2022-04-14)


### Bug Fixes

* **client:** TypeScript generic for ensuring proper arguments when using "single connection mode" ([be2ae7d](https://github.com/enisdenjo/graphql-sse/commit/be2ae7daa789e7c430b147b15c67551311de11b9))


### Features

* **client:** Inspect incoming messages through `ClientOptions.onMessage` ([496e74b](https://github.com/enisdenjo/graphql-sse/commit/496e74b0a0b5b3382253f7ffb7edd2b5a2da05d1)), closes [#20](https://github.com/enisdenjo/graphql-sse/issues/20)

# [1.1.0](https://github.com/enisdenjo/graphql-sse/compare/v1.0.6...v1.1.0) (2022-03-09)


### Features

* **client:** Add `credentials` property for requests ([79d0266](https://github.com/enisdenjo/graphql-sse/commit/79d0266d81e2ec78df917c1e068d04db768b9315))
* **client:** Add `lazyCloseTimeout` as a close timeout after last operation completes ([16e5e31](https://github.com/enisdenjo/graphql-sse/commit/16e5e3151439a64abe1134c3367c629a66daf989)), closes [#17](https://github.com/enisdenjo/graphql-sse/issues/17)

## [1.0.6](https://github.com/enisdenjo/graphql-sse/compare/v1.0.5...v1.0.6) (2021-11-18)


### Bug Fixes

* **client:** Avoid bundling DOM types, have the implementor supply his own `Response` type ([98780c0](https://github.com/enisdenjo/graphql-sse/commit/98780c08843e4fdd119726ebab2a8eb3edbdee68))
* **handler:** Support generics for requests and responses ([9ab10c0](https://github.com/enisdenjo/graphql-sse/commit/9ab10c0ca1db5e58b8b5da514852f917e0c9366b))

## [1.0.5](https://github.com/enisdenjo/graphql-sse/compare/v1.0.4...v1.0.5) (2021-11-02)


### Bug Fixes

* **client:** Should not call complete after subscription error ([d8b7634](https://github.com/enisdenjo/graphql-sse/commit/d8b76346832101fa293e55b621ce753f7e1d59e1))
* **handler:** Use 3rd `body` argument only if is object or string ([2062579](https://github.com/enisdenjo/graphql-sse/commit/20625792644590b5e2c03af7e7615b5aca4a31d1))

## [1.0.4](https://github.com/enisdenjo/graphql-sse/compare/v1.0.3...v1.0.4) (2021-09-08)


### Bug Fixes

* Define graphql execution results ([89da803](https://github.com/enisdenjo/graphql-sse/commit/89da8038f983719b5cda3635652157e39ed0ee4d))
* **server:** Operation result can be async generator or iterable ([24b6078](https://github.com/enisdenjo/graphql-sse/commit/24b60780ed21c6d119677049a25189af32759a5a))

## [1.0.3](https://github.com/enisdenjo/graphql-sse/compare/v1.0.2...v1.0.3) (2021-08-26)


### Bug Fixes

* Bump `graphql` version to v16 in package.json ([af219f9](https://github.com/enisdenjo/graphql-sse/commit/af219f90ffcdb7019fe1e086d92a01bd98905869))

## [1.0.2](https://github.com/enisdenjo/graphql-sse/compare/v1.0.1...v1.0.2) (2021-08-26)


### Bug Fixes

* Add support for `graphql@v16` ([89367f2](https://github.com/enisdenjo/graphql-sse/commit/89367f23a3f41f0e802cfbf70aa3d24dfa21e302))

## [1.0.1](https://github.com/enisdenjo/graphql-sse/compare/v1.0.0...v1.0.1) (2021-08-23)


### Bug Fixes

* Prefer `X-GraphQL-Event-Stream-Token` header name for clarity ([9aaa0a9](https://github.com/enisdenjo/graphql-sse/commit/9aaa0a92fefd26df8e93fc3ec709113a03677350))

# 1.0.0 (2021-08-21)


### Features

* Client ([#3](https://github.com/enisdenjo/graphql-sse/issues/3)) ([754487d](https://github.com/enisdenjo/graphql-sse/commit/754487dbc83b352ab1d86fdc1a5953df0a9c3f22))
* Server request handler ([#2](https://github.com/enisdenjo/graphql-sse/issues/2)) ([8381796](https://github.com/enisdenjo/graphql-sse/commit/838179673ad38e077e59b7738524652e4602633e))
