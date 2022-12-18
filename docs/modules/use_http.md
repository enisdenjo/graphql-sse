[graphql-sse](../README.md) / use/http

# Module: use/http

## Table of contents

### Interfaces

- [RequestContext](../interfaces/use_http.RequestContext.md)

### Functions

- [createHandler](use_http.md#createhandler)

## Functions

### createHandler

▸ **createHandler**<`Context`\>(`options`): (`req`: `IncomingMessage`, `res`: `ServerResponse`) => `Promise`<`void`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Context` | extends [`OperationContext`](handler.md#operationcontext) = `undefined` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`HandlerOptions`](../interfaces/handler.HandlerOptions.md)<`IncomingMessage`, [`RequestContext`](../interfaces/use_http.RequestContext.md), `Context`\> |

#### Returns

`fn`

▸ (`req`, `res`): `Promise`<`void`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `req` | `IncomingMessage` |
| `res` | `ServerResponse` |

##### Returns

`Promise`<`void`\>
