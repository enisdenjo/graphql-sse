[graphql-sse](../README.md) / [client](../modules/client.md) / NetworkError

# Class: NetworkError

[client](../modules/client.md).NetworkError

A network error caused by the client or an unexpected response from the server.

Network errors are considered retryable, all others error types will be reported
immediately.

## Hierarchy

- `Error`

  ↳ **`NetworkError`**

## Table of contents

### Constructors

- [constructor](client.NetworkError.md#constructor)

### Properties

- [response](client.NetworkError.md#response)

### Methods

- [isResponse](client.NetworkError.md#isresponse)

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
