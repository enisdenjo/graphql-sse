[graphql-sse](../README.md) / use/http2

# Module: use/http2

## Table of contents

### Interfaces

- [RequestContext](../interfaces/use_http2.RequestContext.md)

### Functions

- [createHandler](use_http2.md#createhandler)

## Functions

### createHandler

▸ **createHandler**<`Context`\>(`options`): (`req`: `Http2ServerRequest`, `res`: `Http2ServerResponse`) => `Promise`<`void`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Context` | extends [`OperationContext`](handler.md#operationcontext) = `undefined` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`HandlerOptions`](../interfaces/handler.HandlerOptions.md)<`Http2ServerRequest`, [`RequestContext`](../interfaces/use_http2.RequestContext.md), `Context`\> |

#### Returns

`fn`

▸ (`req`, `res`): `Promise`<`void`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `req` | `Http2ServerRequest` |
| `res` | `Http2ServerResponse` |

##### Returns

`Promise`<`void`\>
