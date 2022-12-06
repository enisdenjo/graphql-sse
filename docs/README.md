graphql-sse

# graphql-sse

## Table of contents

### Classes

- [NetworkError](classes/NetworkError.md)

### Interfaces

- [Client](interfaces/Client.md)
- [ClientOptions](interfaces/ClientOptions.md)
- [ExecutionPatchResult](interfaces/ExecutionPatchResult.md)
- [ExecutionResult](interfaces/ExecutionResult.md)
- [HandlerOptions](interfaces/HandlerOptions.md)
- [Request](interfaces/Request.md)
- [RequestParams](interfaces/RequestParams.md)
- [ResponseInit](interfaces/ResponseInit.md)
- [Sink](interfaces/Sink.md)
- [StreamMessage](interfaces/StreamMessage.md)

### Type Aliases

- [Handler](README.md#handler)
- [OperationArgs](README.md#operationargs)
- [OperationContext](README.md#operationcontext)
- [OperationResult](README.md#operationresult)
- [RequestHeaders](README.md#requestheaders)
- [Response](README.md#response)
- [ResponseBody](README.md#responsebody)
- [ResponseHeaders](README.md#responseheaders)
- [StreamData](README.md#streamdata)
- [StreamDataForID](README.md#streamdataforid)
- [StreamEvent](README.md#streamevent)

### Variables

- [TOKEN\_HEADER\_KEY](README.md#token_header_key)
- [TOKEN\_QUERY\_KEY](README.md#token_query_key)

### Functions

- [createClient](README.md#createclient)
- [createHandler](README.md#createhandler)
- [isAsyncGenerator](README.md#isasyncgenerator)
- [isAsyncIterable](README.md#isasynciterable)
- [parseStreamData](README.md#parsestreamdata)
- [print](README.md#print)
- [validateStreamEvent](README.md#validatestreamevent)

## Client

### createClient

▸ **createClient**<`SingleConnection`\>(`options`): [`Client`](interfaces/Client.md)

Creates a disposable GraphQL over SSE client to transmit
GraphQL operation results.

If you have an HTTP/2 server, it is recommended to use the client
in "distinct connections mode" (`singleConnection = false`) which will
create a new SSE connection for each subscribe. This is the default.

However, when dealing with HTTP/1 servers from a browser, consider using
the "single connection mode" (`singleConnection = true`) which will
use only one SSE connection.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `SingleConnection` | extends `boolean` = ``false`` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`ClientOptions`](interfaces/ClientOptions.md)<`SingleConnection`\> |

#### Returns

[`Client`](interfaces/Client.md)

## Common

### StreamData

Ƭ **StreamData**<`E`\>: `E` extends ``"next"`` ? [`ExecutionResult`](interfaces/ExecutionResult.md) \| [`ExecutionPatchResult`](interfaces/ExecutionPatchResult.md) : `E` extends ``"complete"`` ? ``null`` : `never`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `E` | extends [`StreamEvent`](README.md#streamevent) |

___

### StreamDataForID

Ƭ **StreamDataForID**<`E`\>: `E` extends ``"next"`` ? { `id`: `string` ; `payload`: [`ExecutionResult`](interfaces/ExecutionResult.md) \| [`ExecutionPatchResult`](interfaces/ExecutionPatchResult.md)  } : `E` extends ``"complete"`` ? { `id`: `string`  } : `never`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `E` | extends [`StreamEvent`](README.md#streamevent) |

___

### StreamEvent

Ƭ **StreamEvent**: ``"next"`` \| ``"complete"``

___

### TOKEN\_HEADER\_KEY

• `Const` **TOKEN\_HEADER\_KEY**: ``"x-graphql-event-stream-token"``

Header key through which the event stream token is transmitted
when using the client in "single connection mode".

Read more: https://github.com/enisdenjo/graphql-sse/blob/master/PROTOCOL.md#single-connection-mode

___

### TOKEN\_QUERY\_KEY

• `Const` **TOKEN\_QUERY\_KEY**: ``"token"``

URL query parameter key through which the event stream token is transmitted
when using the client in "single connection mode".

Read more: https://github.com/enisdenjo/graphql-sse/blob/master/PROTOCOL.md#single-connection-mode

___

### isAsyncGenerator

▸ **isAsyncGenerator**<`T`\>(`val`): val is AsyncGenerator<T, any, unknown\>

Checkes whether the provided value is an async generator.

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `val` | `unknown` |

#### Returns

val is AsyncGenerator<T, any, unknown\>

___

### isAsyncIterable

▸ **isAsyncIterable**<`T`\>(`val`): val is AsyncIterable<T\>

Checkes whether the provided value is an async iterable.

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `val` | `unknown` |

#### Returns

val is AsyncIterable<T\>

___

### parseStreamData

▸ **parseStreamData**<`ForID`, `E`\>(`e`, `data`): `ForID` extends ``true`` ? [`StreamDataForID`](README.md#streamdataforid)<`E`\> : [`StreamData`](README.md#streamdata)<`E`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `ForID` | extends `boolean` |
| `E` | extends [`StreamEvent`](README.md#streamevent) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `e` | `E` |
| `data` | `string` |

#### Returns

`ForID` extends ``true`` ? [`StreamDataForID`](README.md#streamdataforid)<`E`\> : [`StreamData`](README.md#streamdata)<`E`\>

___

### print

▸ **print**<`ForID`, `E`\>(`msg`): `string`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `ForID` | extends `boolean` |
| `E` | extends [`StreamEvent`](README.md#streamevent) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `msg` | [`StreamMessage`](interfaces/StreamMessage.md)<`ForID`, `E`\> |

#### Returns

`string`

___

### validateStreamEvent

▸ **validateStreamEvent**(`e`): [`StreamEvent`](README.md#streamevent)

#### Parameters

| Name | Type |
| :------ | :------ |
| `e` | `unknown` |

#### Returns

[`StreamEvent`](README.md#streamevent)

## Server

### Handler

Ƭ **Handler**<`RequestRaw`, `RequestContext`\>: (`req`: [`Request`](interfaces/Request.md)<`RequestRaw`, `RequestContext`\>) => `Promise`<[`Response`](README.md#response)\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `RequestRaw` | `unknown` |
| `RequestContext` | `unknown` |

#### Type declaration

▸ (`req`): `Promise`<[`Response`](README.md#response)\>

The ready-to-use handler. Simply plug it in your favourite fetch-enabled HTTP
framework and enjoy.

Errors thrown from **any** of the provided options or callbacks (or even due to
library misuse or potential bugs) will reject the handler's promise. They are
considered internal errors and you should take care of them accordingly.

##### Parameters

| Name | Type |
| :------ | :------ |
| `req` | [`Request`](interfaces/Request.md)<`RequestRaw`, `RequestContext`\> |

##### Returns

`Promise`<[`Response`](README.md#response)\>

___

### OperationArgs

Ƭ **OperationArgs**<`Context`\>: `ExecutionArgs` & { `contextValue`: `Context`  }

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Context` | extends [`OperationContext`](README.md#operationcontext) = `undefined` |

___

### OperationContext

Ƭ **OperationContext**: `Record`<`PropertyKey`, `unknown`\> \| `symbol` \| `number` \| `string` \| `boolean` \| `undefined` \| ``null``

A concrete GraphQL execution context value type.

Mainly used because TypeScript collapes unions
with `any` or `unknown` to `any` or `unknown`. So,
we use a custom type to allow definitions such as
the `context` server option.

___

### OperationResult

Ƭ **OperationResult**: `Promise`<`AsyncGenerator`<[`ExecutionResult`](interfaces/ExecutionResult.md) \| [`ExecutionPatchResult`](interfaces/ExecutionPatchResult.md)\> \| `AsyncIterable`<[`ExecutionResult`](interfaces/ExecutionResult.md) \| [`ExecutionPatchResult`](interfaces/ExecutionPatchResult.md)\> \| [`ExecutionResult`](interfaces/ExecutionResult.md)\> \| `AsyncGenerator`<[`ExecutionResult`](interfaces/ExecutionResult.md) \| [`ExecutionPatchResult`](interfaces/ExecutionPatchResult.md)\> \| `AsyncIterable`<[`ExecutionResult`](interfaces/ExecutionResult.md) \| [`ExecutionPatchResult`](interfaces/ExecutionPatchResult.md)\> \| [`ExecutionResult`](interfaces/ExecutionResult.md)

___

### RequestHeaders

Ƭ **RequestHeaders**: { `[key: string]`: `string` \| `string`[] \| `undefined`; `set-cookie?`: `string` \| `string`[]  } \| { `get`: (`key`: `string`) => `string` \| ``null``  }

The incoming request headers the implementing server should provide.

___

### Response

Ƭ **Response**: readonly [body: ResponseBody \| null, init: ResponseInit]

Server agnostic response returned from `graphql-sse` containing the
body and init options needing to be coerced to the server implementation in use.

___

### ResponseBody

Ƭ **ResponseBody**: `string` \| `AsyncGenerator`<`string`, `void`, `undefined`\>

Server agnostic response body returned from `graphql-sse` needing
to be coerced to the server implementation in use.

When the body is a string, it is NOT a GraphQL response.

___

### ResponseHeaders

Ƭ **ResponseHeaders**: { `accept?`: `string` ; `allow?`: `string` ; `content-type?`: `string`  } & `Record`<`string`, `string`\>

The response headers that get returned from graphql-sse.

___

### createHandler

▸ **createHandler**<`RequestRaw`, `RequestContext`, `Context`\>(`options`): [`Handler`](README.md#handler)<`RequestRaw`, `RequestContext`\>

Makes a Protocol complient HTTP GraphQL server handler. The handler can
be used with your favourite server library.

Read more about the Protocol in the PROTOCOL.md documentation file.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `RequestRaw` | `unknown` |
| `RequestContext` | `unknown` |
| `Context` | extends [`OperationContext`](README.md#operationcontext) = `undefined` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`HandlerOptions`](interfaces/HandlerOptions.md)<`RequestRaw`, `RequestContext`, `Context`\> |

#### Returns

[`Handler`](README.md#handler)<`RequestRaw`, `RequestContext`\>
