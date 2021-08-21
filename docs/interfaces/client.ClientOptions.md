[graphql-sse](../README.md) / [client](../modules/client.md) / ClientOptions

# Interface: ClientOptions

[client](../modules/client.md).ClientOptions

## Table of contents

### Properties

- [abortControllerImpl](client.ClientOptions.md#abortcontrollerimpl)
- [fetchFn](client.ClientOptions.md#fetchfn)
- [headers](client.ClientOptions.md#headers)
- [lazy](client.ClientOptions.md#lazy)
- [retryAttempts](client.ClientOptions.md#retryattempts)
- [singleConnection](client.ClientOptions.md#singleconnection)
- [url](client.ClientOptions.md#url)

### Methods

- [generateID](client.ClientOptions.md#generateid)
- [onNonLazyError](client.ClientOptions.md#onnonlazyerror)
- [retry](client.ClientOptions.md#retry)

## Properties

### abortControllerImpl

• `Optional` **abortControllerImpl**: `unknown`

The AbortController implementation to use.

For NodeJS environments before v15 consider using [`node-abort-controller`](https://github.com/southpolesteve/node-abort-controller).

**`default`** global.AbortController

___

### fetchFn

• `Optional` **fetchFn**: `unknown`

The Fetch function to use.

For NodeJS environments consider using [`node-fetch`](https://github.com/node-fetch/node-fetch).

**`default`** global.fetch

___

### headers

• `Optional` **headers**: `Record`<`string`, `string`\> \| () => `Record`<`string`, `string`\> \| `Promise`<`Record`<`string`, `string`\>\>

HTTP headers to pass along the request.

If the option is a function, it will be called on each connection attempt.
Returning a Promise is supported too and the connection phase will stall until it
resolves with the headers.

A good use-case for having a function is when using the headers for authentication,
where subsequent reconnects (due to auth) may have a refreshed identity token in
the header.

___

### lazy

• `Optional` **lazy**: `boolean`

Controls when should the connection be established while using the
client in "single connection mode" (see `singleConnection ` option).

- `false`: Establish a connection immediately.
- `true`: Establish a connection on first subscribe and close on last unsubscribe.

Note that the `lazy` option has NO EFFECT when using the client
in "distinct connection mode" (`singleConnection = false`).

**`default`** true

___

### retryAttempts

• `Optional` **retryAttempts**: `number`

How many times should the client try to reconnect before it errors out?

**`default`** 5

___

### singleConnection

• `Optional` **singleConnection**: `boolean`

Reuses a single SSE connection for all GraphQL operations.

When instantiating with `false` (default), the client will run
in a "distinct connections mode" mode. Meaning, a new SSE
connection will be established on each subscribe.

On the other hand, when instantiating with `true`, the client
will run in a "single connection mode" mode. Meaning, a single SSE
connection will be used to transmit all operation results while
separate HTTP requests will be issued to dictate the behaviour.

**`default`** false

___

### url

• **url**: `string` \| () => `string` \| `Promise`<`string`\>

URL of the GraphQL over SSE server to connect.

If the option is a function, it will be called on each connection attempt.
Returning a Promise is supported too and the connection phase will stall until it
resolves with the URL.

A good use-case for having a function is when using the URL for authentication,
where subsequent reconnects (due to auth) may have a refreshed identity token in
the URL.

## Methods

### generateID

▸ `Optional` **generateID**(): `string`

A custom ID generator for identifying subscriptions.

The default generates a v4 UUID to be used as the ID using `Math`
as the random number generator. Supply your own generator
in case you need more uniqueness.

Reference: https://gist.github.com/jed/982883

#### Returns

`string`

___

### onNonLazyError

▸ `Optional` **onNonLazyError**(`error`): `void`

Used ONLY when the client is in non-lazy mode (`lazy = false`). When
using this mode, errors might have no sinks to report to; however,
to avoid swallowing errors, `onNonLazyError` will be called when either:
- An unrecoverable error/close event occurs
- Silent retry attempts have been exceeded

After a client has errored out, it will NOT perform any automatic actions.

**`default`** console.error

#### Parameters

| Name | Type |
| :------ | :------ |
| `error` | `unknown` |

#### Returns

`void`

___

### retry

▸ `Optional` **retry**(`retries`): `Promise`<`void`\>

Control the wait time between retries. You may implement your own strategy
by timing the resolution of the returned promise with the retries count.

`retries` argument counts actual reconnection attempts, so it will begin with
0 after the first retryable disconnect.

**`default`** 'Randomised exponential backoff, 5 times'

#### Parameters

| Name | Type |
| :------ | :------ |
| `retries` | `number` |

#### Returns

`Promise`<`void`\>
