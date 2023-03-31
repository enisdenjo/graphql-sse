[graphql-sse](../README.md) / [client](../modules/client.md) / ClientOptions

# Interface: ClientOptions<SingleConnection\>

[client](../modules/client.md).ClientOptions

## Type parameters

| Name | Type |
| :------ | :------ |
| `SingleConnection` | extends `boolean` = ``false`` |

## Table of contents

### Properties

- [abortControllerImpl](client.ClientOptions.md#abortcontrollerimpl)
- [credentials](client.ClientOptions.md#credentials)
- [fetchFn](client.ClientOptions.md#fetchfn)
- [generateID](client.ClientOptions.md#generateid)
- [headers](client.ClientOptions.md#headers)
- [lazy](client.ClientOptions.md#lazy)
- [lazyCloseTimeout](client.ClientOptions.md#lazyclosetimeout)
- [onMessage](client.ClientOptions.md#onmessage)
- [onNonLazyError](client.ClientOptions.md#onnonlazyerror)
- [referrer](client.ClientOptions.md#referrer)
- [referrerPolicy](client.ClientOptions.md#referrerpolicy)
- [retry](client.ClientOptions.md#retry)
- [retryAttempts](client.ClientOptions.md#retryattempts)
- [singleConnection](client.ClientOptions.md#singleconnection)
- [url](client.ClientOptions.md#url)

## Properties

### abortControllerImpl

• `Optional` **abortControllerImpl**: `unknown`

The AbortController implementation to use.

For NodeJS environments before v15 consider using [`node-abort-controller`](https://github.com/southpolesteve/node-abort-controller).

**`Default`**

global.AbortController

___

### credentials

• `Optional` **credentials**: ``"omit"`` \| ``"same-origin"`` \| ``"include"``

Indicates whether the user agent should send cookies from the other domain in the case
of cross-origin requests.

Possible options are:
  - `omit`: Never send or receive cookies.
  - `same-origin`: Send user credentials (cookies, basic http auth, etc..) if the URL is on the same origin as the calling script.
  - `include`: Always send user credentials (cookies, basic http auth, etc..), even for cross-origin calls.

**`Default`**

same-origin

___

### fetchFn

• `Optional` **fetchFn**: `unknown`

The Fetch function to use.

For NodeJS environments consider using [`node-fetch`](https://github.com/node-fetch/node-fetch).

**`Default`**

global.fetch

___

### generateID

• `Optional` **generateID**: () => `string`

#### Type declaration

▸ (): `string`

A custom ID generator for identifying subscriptions.

The default generates a v4 UUID to be used as the ID using `Math`
as the random number generator. Supply your own generator
in case you need more uniqueness.

Reference: https://gist.github.com/jed/982883

##### Returns

`string`

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

• `Optional` **lazy**: `SingleConnection` extends ``true`` ? `boolean` : `never`

Controls when should the connection be established while using the
client in "single connection mode" (see `singleConnection ` option).

- `false`: Establish a connection immediately.
- `true`: Establish a connection on first subscribe and close on last unsubscribe.

Note that the `lazy` option has NO EFFECT when using the client
in "distinct connection mode" (`singleConnection = false`).

**`Default`**

true

___

### lazyCloseTimeout

• `Optional` **lazyCloseTimeout**: `SingleConnection` extends ``true`` ? `number` : `never`

How long should the client wait before closing the connection after the last oparation has
completed. You might want to have a calmdown time before actually closing the connection.

Meant to be used in combination with `lazy`.

Note that the `lazy` option has NO EFFECT when using the client
in "distinct connection mode" (`singleConnection = false`).

**`Default`**

0

___

### onMessage

• `Optional` **onMessage**: (`message`: [`StreamMessage`](common.StreamMessage.md)<`SingleConnection`, [`StreamEvent`](../modules/common.md#streamevent)\>) => `void`

#### Type declaration

▸ (`message`): `void`

Browsers show stream messages in the DevTools **only** if they're received through the [native EventSource](https://developer.mozilla.org/en-US/docs/Web/API/EventSource),
and because `graphql-sse` implements a custom SSE parser - received messages will **not** appear in browser's DevTools.

Use this function if you want to inspect valid messages received through the active SSE connection.

##### Parameters

| Name | Type |
| :------ | :------ |
| `message` | [`StreamMessage`](common.StreamMessage.md)<`SingleConnection`, [`StreamEvent`](../modules/common.md#streamevent)\> |

##### Returns

`void`

___

### onNonLazyError

• `Optional` **onNonLazyError**: `SingleConnection` extends ``true`` ? (`error`: `unknown`) => `void` : `never`

Used ONLY when the client is in non-lazy mode (`lazy = false`). When
using this mode, errors might have no sinks to report to; however,
to avoid swallowing errors, `onNonLazyError` will be called when either:
- An unrecoverable error/close event occurs
- Silent retry attempts have been exceeded

After a client has errored out, it will NOT perform any automatic actions.

**`Default`**

console.error

___

### referrer

• `Optional` **referrer**: `string`

A string specifying the referrer of the request. This can be a same-origin URL, about:client, or an empty string.

**`Default`**

undefined

___

### referrerPolicy

• `Optional` **referrerPolicy**: ``"same-origin"`` \| ``"no-referrer"`` \| ``"no-referrer-when-downgrade"`` \| ``"origin"`` \| ``"strict-origin"`` \| ``"origin-when-cross-origin"`` \| ``"strict-origin-when-cross-origin"`` \| ``"unsafe-url"``

Specifies the referrer policy to use for the request.

Possible options are:
  - `no-referrer`: Does not send referrer information along with requests to any origin.
  - `no-referrer-when-downgrade`: Sends full referrerURL for requests: whose referrerURL and current URL are both potentially trustworthy URLs, or whose referrerURL is a non-potentially trustworthy URL.
  - `same-origin`: Sends full referrerURL as referrer information when making same-origin-referrer requests.
  - `origin`: Sends only the ASCII serialization of the request’s referrerURL when making both same-origin-referrer requests and cross-origin-referrer requests.
  - `strict-origin`: Sends the ASCII serialization of the origin of the referrerURL for requests: whose referrerURL and current URL are both potentially trustworthy URLs, or whose referrerURL is a non-potentially trustworthy URL
  - `origin-when-cross-origin`: Sends full referrerURL when making same-origin-referrer requests, and only the ASCII serialization of the origin of the request’s referrerURL is sent when making cross-origin-referrer requests
  - `strict-origin-when-cross-origin`: Sends full referrerURL when making same-origin-referrer requests, and only the ASCII serialization of the origin of the request’s referrerURL when making cross-origin-referrer requests: whose referrerURL and current URL are both potentially trustworthy URLs, or whose referrerURL is a non-potentially trustworthy URL.
  - `unsafe-url`: Sends full referrerURL along for both same-origin-referrer requests and cross-origin-referrer requests.

**`Default`**

undefined

___

### retry

• `Optional` **retry**: (`retries`: `number`) => `Promise`<`void`\>

#### Type declaration

▸ (`retries`): `Promise`<`void`\>

Control the wait time between retries. You may implement your own strategy
by timing the resolution of the returned promise with the retries count.

`retries` argument counts actual reconnection attempts, so it will begin with
0 after the first retryable disconnect.

**`Default`**

'Randomised exponential backoff, 5 times'

##### Parameters

| Name | Type |
| :------ | :------ |
| `retries` | `number` |

##### Returns

`Promise`<`void`\>

___

### retryAttempts

• `Optional` **retryAttempts**: `number`

How many times should the client try to reconnect before it errors out?

**`Default`**

5

___

### singleConnection

• `Optional` **singleConnection**: `SingleConnection`

Reuses a single SSE connection for all GraphQL operations.

When instantiating with `false` (default), the client will run
in a "distinct connections mode" mode. Meaning, a new SSE
connection will be established on each subscribe.

On the other hand, when instantiating with `true`, the client
will run in a "single connection mode" mode. Meaning, a single SSE
connection will be used to transmit all operation results while
separate HTTP requests will be issued to dictate the behaviour.

**`Default`**

false

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
