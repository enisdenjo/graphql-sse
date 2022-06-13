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
