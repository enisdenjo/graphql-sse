---
title: "Module: handler"
sidebarTitle: "handler"
description: "Everything exported by graphql-sse/handler: functions, classes, interfaces and types."
---
## Interfaces

- [HandlerOptions](/docs/interfaces/handler.HandlerOptions)
- [Request](/docs/interfaces/handler.Request)
- [RequestHeaders](/docs/interfaces/handler.RequestHeaders)
- [ResponseInit](/docs/interfaces/handler.ResponseInit)

## Other

### isExecutionResult

▸ **isExecutionResult**(`val`): val is ExecutionResult\<Record\<string, unknown\>, Record\<string, unknown\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `val` | `unknown` |

#### Returns

val is ExecutionResult\<Record\<string, unknown\>, Record\<string, unknown\>\>

#### Defined in

[src/handler.ts:1106](https://github.com/enisdenjo/graphql-sse/blob/master/src/handler.ts#L1106)

## Server

### Handler

Ƭ **Handler**\<`RequestRaw`, `RequestContext`\>: (`req`: [`Request`](/docs/interfaces/handler.Request)\<`RequestRaw`, `RequestContext`\>) => `Promise`\<[`Response`](/docs/modules/handler#response)\>

The ready-to-use handler. Simply plug it in your favourite fetch-enabled HTTP
framework and enjoy.

Errors thrown from **any** of the provided options or callbacks (or even due to
library misuse or potential bugs) will reject the handler's promise. They are
considered internal errors and you should take care of them accordingly.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `RequestRaw` | `unknown` |
| `RequestContext` | `unknown` |

#### Type declaration

▸ (`req`): `Promise`\<[`Response`](/docs/modules/handler#response)\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `req` | [`Request`](/docs/interfaces/handler.Request)\<`RequestRaw`, `RequestContext`\> |

##### Returns

`Promise`\<[`Response`](/docs/modules/handler#response)\>

#### Defined in

[src/handler.ts:341](https://github.com/enisdenjo/graphql-sse/blob/master/src/handler.ts#L341)

___

### OperationArgs

Ƭ **OperationArgs**\<`Context`\>: `ExecutionArgs` & \{ `contextValue`: `Context`  }

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Context` | extends [`OperationContext`](/docs/modules/handler#operationcontext) = `undefined` |

#### Defined in

[src/handler.ts:137](https://github.com/enisdenjo/graphql-sse/blob/master/src/handler.ts#L137)

___

### OperationContext

Ƭ **OperationContext**: `Record`\<`PropertyKey`, `unknown`\> \| `symbol` \| `number` \| `string` \| `boolean` \| `undefined` \| ``null``

A concrete GraphQL execution context value type.

Mainly used because TypeScript collapses unions
with `any` or `unknown` to `any` or `unknown`. So,
we use a custom type to allow definitions such as
the `context` server option.

#### Defined in

[src/handler.ts:127](https://github.com/enisdenjo/graphql-sse/blob/master/src/handler.ts#L127)

___

### OperationResult

Ƭ **OperationResult**: `Promise`\<`AsyncGenerator`\<[`ExecutionResult`](/docs/interfaces/common.ExecutionResult) \| [`ExecutionPatchResult`](/docs/interfaces/common.ExecutionPatchResult)\> \| `AsyncIterable`\<[`ExecutionResult`](/docs/interfaces/common.ExecutionResult) \| [`ExecutionPatchResult`](/docs/interfaces/common.ExecutionPatchResult)\> \| [`ExecutionResult`](/docs/interfaces/common.ExecutionResult)\> \| `AsyncGenerator`\<[`ExecutionResult`](/docs/interfaces/common.ExecutionResult) \| [`ExecutionPatchResult`](/docs/interfaces/common.ExecutionPatchResult)\> \| `AsyncIterable`\<[`ExecutionResult`](/docs/interfaces/common.ExecutionResult) \| [`ExecutionPatchResult`](/docs/interfaces/common.ExecutionPatchResult)\> \| [`ExecutionResult`](/docs/interfaces/common.ExecutionResult)

#### Defined in

[src/handler.ts:141](https://github.com/enisdenjo/graphql-sse/blob/master/src/handler.ts#L141)

___

### Response

Ƭ **Response**: readonly [body: ResponseBody \| null, init: ResponseInit]

Server agnostic response returned from `graphql-sse` containing the
body and init options needing to be coerced to the server implementation in use.

#### Defined in

[src/handler.ts:115](https://github.com/enisdenjo/graphql-sse/blob/master/src/handler.ts#L115)

___

### ResponseBody

Ƭ **ResponseBody**: `string` \| `AsyncGenerator`\<`string`, `void`, `undefined`\>

Server agnostic response body returned from `graphql-sse` needing
to be coerced to the server implementation in use.

When the body is a string, it is NOT a GraphQL response.

#### Defined in

[src/handler.ts:95](https://github.com/enisdenjo/graphql-sse/blob/master/src/handler.ts#L95)

___

### ResponseHeaders

Ƭ **ResponseHeaders**: \{ `accept?`: `string` ; `allow?`: `string` ; `content-type?`: `string`  } & `Record`\<`string`, `string`\>

The response headers that get returned from graphql-sse.

#### Defined in

[src/handler.ts:81](https://github.com/enisdenjo/graphql-sse/blob/master/src/handler.ts#L81)

___

### createHandler

▸ **createHandler**\<`RequestRaw`, `RequestContext`, `Context`\>(`options`): [`Handler`](/docs/modules/handler#handler)\<`RequestRaw`, `RequestContext`\>

Makes a Protocol compliant HTTP GraphQL server handler. The handler can
be used with your favourite server library.

Read more about the Protocol in the PROTOCOL.md documentation file.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `RequestRaw` | `unknown` |
| `RequestContext` | `unknown` |
| `Context` | extends [`OperationContext`](/docs/modules/handler#operationcontext) = `undefined` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`HandlerOptions`](/docs/interfaces/handler.HandlerOptions)\<`RequestRaw`, `RequestContext`, `Context`\> |

#### Returns

[`Handler`](/docs/modules/handler#handler)\<`RequestRaw`, `RequestContext`\>

#### Defined in

[src/handler.ts:353](https://github.com/enisdenjo/graphql-sse/blob/master/src/handler.ts#L353)
