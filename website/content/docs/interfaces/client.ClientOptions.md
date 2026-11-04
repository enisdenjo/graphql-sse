---
title: "Interface: ClientOptions (client)"
sidebarTitle: "client.ClientOptions"
description: "ClientOptions (graphql-sse/client): The AbortController implementation to use."
---
## Type parameters

| Name | Type |
| :------ | :------ |
| `SingleConnection` | extends `boolean` = ``false`` |

## Properties

### abortControllerImpl

• `Optional` **abortControllerImpl**: `unknown`

The AbortController implementation to use.

For NodeJS environments before v15 consider using [`node-abort-controller`](https://github.com/southpolesteve/node-abort-controller).

**`Default`**

```ts
global.AbortController
```

#### Defined in

[src/client.ts:191](https://github.com/enisdenjo/graphql-sse/blob/master/src/client.ts#L191)

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

```ts
same-origin
```

#### Defined in

[src/client.ts:127](https://github.com/enisdenjo/graphql-sse/blob/master/src/client.ts#L127)

___

### fetchFn

• `Optional` **fetchFn**: `unknown`

The Fetch function to use.

For NodeJS environments consider using [`node-fetch`](https://github.com/node-fetch/node-fetch).

**`Default`**

```ts
global.fetch
```

#### Defined in

[src/client.ts:183](https://github.com/enisdenjo/graphql-sse/blob/master/src/client.ts#L183)

___

### generateID

• `Optional` **generateID**: () => `string`

A custom ID generator for identifying subscriptions.

The default generates a v4 UUID to be used as the ID using `Math`
as the random number generator. Supply your own generator
in case you need more uniqueness.

Reference: https://gist.github.com/jed/982883

#### Type declaration

▸ (): `string`

A custom ID generator for identifying subscriptions.

The default generates a v4 UUID to be used as the ID using `Math`
as the random number generator. Supply your own generator
in case you need more uniqueness.

Reference: https://gist.github.com/jed/982883

##### Returns

`string`

#### Defined in

[src/client.ts:201](https://github.com/enisdenjo/graphql-sse/blob/master/src/client.ts#L201)

___

### headers

• `Optional` **headers**: `Record`\<`string`, `string`\> \| (`request`: `SingleConnection` extends ``true`` ? `undefined` : [`RequestParams`](/docs/interfaces/common.RequestParams)) => `Record`\<`string`, `string`\> \| `Promise`\<`Record`\<`string`, `string`\>\>

HTTP headers to pass along the request.

If the option is a function, it will be called on each connection attempt.
Returning a Promise is supported too and the connection phase will stall until it
resolves with the headers.

A good use-case for having a function is when using the headers for authentication,
where subsequent reconnects (due to auth) may have a refreshed identity token in
the header.

The request is passed for distinct connections mode only.

#### Defined in

[src/client.ts:171](https://github.com/enisdenjo/graphql-sse/blob/master/src/client.ts#L171)

___

### lazy

• `Optional` **lazy**: `SingleConnection` extends ``true`` ? `boolean` : `never`

Controls when should the connection be established while using the
client in "single connection mode" (see `singleConnection ` option).

- `false`: Establish a connection immediately.
- `true`: Establish a connection on first subscribe and close on last unsubscribe.

Note that the `lazy` option has NO EFFECT when using the client
in "distinct connections mode" (`singleConnection = false`).

**`Default`**

```ts
true
```

#### Defined in

[src/client.ts:71](https://github.com/enisdenjo/graphql-sse/blob/master/src/client.ts#L71)

___

### lazyCloseTimeout

• `Optional` **lazyCloseTimeout**: `SingleConnection` extends ``true`` ? `number` : `never`

How long should the client wait before closing the connection after the last operation has
completed. You might want to have a calmdown time before actually closing the connection.

Meant to be used in combination with `lazy`.

Note that the `lazy` option has NO EFFECT when using the client
in "distinct connections mode" (`singleConnection = false`).

**`Default`**

```ts
0
```

#### Defined in

[src/client.ts:83](https://github.com/enisdenjo/graphql-sse/blob/master/src/client.ts#L83)

___

### on

• `Optional` **on**: [`EventListeners`](/docs/interfaces/client.EventListeners)\<`SingleConnection`\>

Event listeners for events happening in the SSE connection.

Will emit events for both the "single connection mode" and the default "distinct connections mode".

Beware that the `connecting` event will be called for **each** subscription when using with "distinct connections mode".

#### Defined in

[src/client.ts:234](https://github.com/enisdenjo/graphql-sse/blob/master/src/client.ts#L234)

___

### onMessage

• `Optional` **onMessage**: (`message`: [`StreamMessage`](/docs/interfaces/common.StreamMessage)\<`SingleConnection`, [`StreamEvent`](/docs/modules/common#streamevent)\>) => `void`

Browsers show stream messages in the DevTools **only** if they're received through the [native EventSource](https://developer.mozilla.org/en-US/docs/Web/API/EventSource),
and because `graphql-sse` implements a custom SSE parser - received messages will **not** appear in browser's DevTools.

Use this function if you want to inspect valid messages received through the active SSE connection.

**`Deprecated`**

Consider using [ClientOptions.on](/docs/interfaces/client.ClientOptions#on) instead.

#### Type declaration

▸ (`message`): `void`

Browsers show stream messages in the DevTools **only** if they're received through the [native EventSource](https://developer.mozilla.org/en-US/docs/Web/API/EventSource),
and because `graphql-sse` implements a custom SSE parser - received messages will **not** appear in browser's DevTools.

Use this function if you want to inspect valid messages received through the active SSE connection.

##### Parameters

| Name | Type |
| :------ | :------ |
| `message` | [`StreamMessage`](/docs/interfaces/common.StreamMessage)\<`SingleConnection`, [`StreamEvent`](/docs/modules/common#streamevent)\> |

##### Returns

`void`

**`Deprecated`**

Consider using [ClientOptions.on](/docs/interfaces/client.ClientOptions#on) instead.

#### Defined in

[src/client.ts:226](https://github.com/enisdenjo/graphql-sse/blob/master/src/client.ts#L226)

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

```ts
console.error
```

#### Defined in

[src/client.ts:95](https://github.com/enisdenjo/graphql-sse/blob/master/src/client.ts#L95)

___

### referrer

• `Optional` **referrer**: `string`

A string specifying the referrer of the request. This can be a same-origin URL, about:client, or an empty string.

**`Default`**

```ts
undefined
```

#### Defined in

[src/client.ts:133](https://github.com/enisdenjo/graphql-sse/blob/master/src/client.ts#L133)

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

```ts
undefined
```

#### Defined in

[src/client.ts:149](https://github.com/enisdenjo/graphql-sse/blob/master/src/client.ts#L149)

___

### retry

• `Optional` **retry**: (`retries`: `number`) => `Promise`\<`void`\>

Control the wait time between retries. You may implement your own strategy
by timing the resolution of the returned promise with the retries count.

`retries` argument counts actual reconnection attempts, so it will begin with
0 after the first retryable disconnect.

**`Default`**

```ts
'Randomised exponential backoff, 5 times'
```

#### Type declaration

▸ (`retries`): `Promise`\<`void`\>

Control the wait time between retries. You may implement your own strategy
by timing the resolution of the returned promise with the retries count.

`retries` argument counts actual reconnection attempts, so it will begin with
0 after the first retryable disconnect.

##### Parameters

| Name | Type |
| :------ | :------ |
| `retries` | `number` |

##### Returns

`Promise`\<`void`\>

**`Default`**

```ts
'Randomised exponential backoff, 5 times'
```

#### Defined in

[src/client.ts:217](https://github.com/enisdenjo/graphql-sse/blob/master/src/client.ts#L217)

___

### retryAttempts

• `Optional` **retryAttempts**: `number`

How many times should the client try to reconnect before it errors out?

**`Default`**

```ts
5
```

#### Defined in

[src/client.ts:207](https://github.com/enisdenjo/graphql-sse/blob/master/src/client.ts#L207)

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

```ts
false
```

#### Defined in

[src/client.ts:58](https://github.com/enisdenjo/graphql-sse/blob/master/src/client.ts#L58)

___

### url

• **url**: `string` \| (`request`: `SingleConnection` extends ``true`` ? `undefined` : [`RequestParams`](/docs/interfaces/common.RequestParams)) => `string` \| `Promise`\<`string`\>

URL of the GraphQL over SSE server to connect.

If the option is a function, it will be called on each connection attempt.
Returning a Promise is supported too and the connection phase will stall until it
resolves with the URL.

A good use-case for having a function is when using the URL for authentication,
where subsequent reconnects (due to auth) may have a refreshed identity token in
the URL.

The request is passed for distinct connections mode only.

#### Defined in

[src/client.ts:111](https://github.com/enisdenjo/graphql-sse/blob/master/src/client.ts#L111)
