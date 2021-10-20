[graphql-sse](../README.md) / NetworkError

# Class: NetworkError

A network error caused by the client or an unexpected response from the server.

Network errors are considered retryable, all others error types will be reported
immediately.

## Hierarchy

- `Error`

  ↳ **`NetworkError`**

## Table of contents

### Constructors

- [constructor](NetworkError.md#constructor)

### Properties

- [response](NetworkError.md#response)

### Methods

- [isResponse](NetworkError.md#isresponse)

## Constructors

### constructor

• **new NetworkError**(`msgOrErrOrResponse`)

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

## Methods

### isResponse

▸ `Static` **isResponse**(`msgOrErrOrResponse`): msgOrErrOrResponse is Response

#### Parameters

| Name | Type |
| :------ | :------ |
| `msgOrErrOrResponse` | `string` \| `Error` \| `Response` |

#### Returns

msgOrErrOrResponse is Response
