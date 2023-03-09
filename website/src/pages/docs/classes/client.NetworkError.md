# Class: NetworkError<Response\>

[client](/docs/modules/client).NetworkError

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

• **new NetworkError**<`Response`\>(`msgOrErrOrResponse`)

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Response` | extends `ResponseLike` = `ResponseLike` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `msgOrErrOrResponse` | `string` \| `Error` \| `Response` |

#### Overrides

Error.constructor

## Properties

### response

• **response**: `undefined` \| `Response`

The underlyig response thats considered an error.

Will be undefined when no response is received,
instead an unexpected network error.
