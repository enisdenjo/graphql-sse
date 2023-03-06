[graphql-sse](../README.md) / [handler](../modules/handler.md) / ResponseInit

# Interface: ResponseInit

[handler](../modules/handler.md).ResponseInit

Server agnostic response options (ex. status and headers) returned from
`graphql-sse` needing to be coerced to the server implementation in use.

## Table of contents

### Properties

- [headers](handler.ResponseInit.md#headers)
- [status](handler.ResponseInit.md#status)
- [statusText](handler.ResponseInit.md#statustext)

## Properties

### headers

• `Optional` `Readonly` **headers**: [`ResponseHeaders`](../modules/handler.md#responseheaders)

___

### status

• `Readonly` **status**: `number`

___

### statusText

• `Readonly` **statusText**: `string`
