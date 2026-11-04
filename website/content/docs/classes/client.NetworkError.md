---
title: "Class: NetworkError (client)"
sidebarTitle: "client.NetworkError"
description: "NetworkError (graphql-sse/client): A network error caused by the client or an unexpected response from the server."
---
A network error caused by the client or an unexpected response from the server.

Network errors are considered retryable, all others error types will be reported
immediately.

To avoid bundling DOM typings (because the client can run in Node env too),
you should supply the `Response` generic depending on your Fetch implementation.

## Type parameters

| Name | Type |
| :------ | :------ |
| `Response` | extends `ResponseLike` = `ResponseLike` |

## Hierarchy

- `Error`

  ↳ **`NetworkError`**

## Constructors

### constructor

• **new NetworkError**\<`Response`\>(`msgOrErrOrResponse`): [`NetworkError`](/docs/classes/client.NetworkError)\<`Response`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Response` | extends `ResponseLike` = `ResponseLike` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `msgOrErrOrResponse` | `string` \| `Error` \| `Response` |

#### Returns

[`NetworkError`](/docs/classes/client.NetworkError)\<`Response`\>

#### Overrides

Error.constructor

#### Defined in

[src/client.ts:818](https://github.com/enisdenjo/graphql-sse/blob/master/src/client.ts#L818)

## Properties

### response

• **response**: `undefined` \| `Response`

The underlying response that's considered an error.

Will be undefined when no response is received,
instead an unexpected network error.

#### Defined in

[src/client.ts:816](https://github.com/enisdenjo/graphql-sse/blob/master/src/client.ts#L816)
