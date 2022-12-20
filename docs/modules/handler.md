[graphql-sse](../README.md) / handler

# Module: handler

## Table of contents

### Interfaces

- [HandlerOptions](../interfaces/handler.HandlerOptions.md)
- [Request](../interfaces/handler.Request.md)
- [RequestHeaders](../interfaces/handler.RequestHeaders.md)
- [ResponseInit](../interfaces/handler.ResponseInit.md)

### Type Aliases

- [Handler](handler.md#handler)
- [OperationArgs](handler.md#operationargs)
- [OperationContext](handler.md#operationcontext)
- [OperationResult](handler.md#operationresult)
- [Response](handler.md#response)
- [ResponseBody](handler.md#responsebody)
- [ResponseHeaders](handler.md#responseheaders)

### Functions

- [createHandler](handler.md#createhandler)

## Server

### Handler

Ƭ **Handler**<`RequestRaw`, `RequestContext`\>: (`req`: [`Request`](../interfaces/handler.Request.md)<`RequestRaw`, `RequestContext`\>) => `Promise`<[`Response`](handler.md#response)\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `RequestRaw` | `unknown` |
| `RequestContext` | `unknown` |

#### Type declaration

▸ (`req`): `Promise`<[`Response`](handler.md#response)\>

The ready-to-use handler. Simply plug it in your favourite fetch-enabled HTTP
framework and enjoy.

Errors thrown from **any** of the provided options or callbacks (or even due to
library misuse or potential bugs) will reject the handler's promise. They are
considered internal errors and you should take care of them accordingly.

##### Parameters

| Name | Type |
| :------ | :------ |
| `req` | [`Request`](../interfaces/handler.Request.md)<`RequestRaw`, `RequestContext`\> |

##### Returns

`Promise`<[`Response`](handler.md#response)\>

___

### OperationArgs

Ƭ **OperationArgs**<`Context`\>: `ExecutionArgs` & { `contextValue`: `Context`  }

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Context` | extends [`OperationContext`](handler.md#operationcontext) = `undefined` |

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

Ƭ **OperationResult**: `Promise`<`AsyncGenerator`<[`ExecutionResult`](../interfaces/common.ExecutionResult.md) \| [`ExecutionPatchResult`](../interfaces/common.ExecutionPatchResult.md)\> \| `AsyncIterable`<[`ExecutionResult`](../interfaces/common.ExecutionResult.md) \| [`ExecutionPatchResult`](../interfaces/common.ExecutionPatchResult.md)\> \| [`ExecutionResult`](../interfaces/common.ExecutionResult.md)\> \| `AsyncGenerator`<[`ExecutionResult`](../interfaces/common.ExecutionResult.md) \| [`ExecutionPatchResult`](../interfaces/common.ExecutionPatchResult.md)\> \| `AsyncIterable`<[`ExecutionResult`](../interfaces/common.ExecutionResult.md) \| [`ExecutionPatchResult`](../interfaces/common.ExecutionPatchResult.md)\> \| [`ExecutionResult`](../interfaces/common.ExecutionResult.md)

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

▸ **createHandler**<`RequestRaw`, `RequestContext`, `Context`\>(`options`): [`Handler`](handler.md#handler)<`RequestRaw`, `RequestContext`\>

Makes a Protocol complient HTTP GraphQL server handler. The handler can
be used with your favourite server library.

Read more about the Protocol in the PROTOCOL.md documentation file.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `RequestRaw` | `unknown` |
| `RequestContext` | `unknown` |
| `Context` | extends [`OperationContext`](handler.md#operationcontext) = `undefined` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`HandlerOptions`](../interfaces/handler.HandlerOptions.md)<`RequestRaw`, `RequestContext`, `Context`\> |

#### Returns

[`Handler`](handler.md#handler)<`RequestRaw`, `RequestContext`\>
