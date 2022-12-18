[graphql-sse](../README.md) / use/fetch

# Module: use/fetch

## Table of contents

### Interfaces

- [RequestContext](../interfaces/use_fetch.RequestContext.md)

### Functions

- [createHandler](use_fetch.md#createhandler)

## Functions

### createHandler

▸ **createHandler**<`Context`\>(`options`, `fetchApi?`): (`req`: `Request`) => `Promise`<`Response`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Context` | extends [`OperationContext`](handler.md#operationcontext) = `undefined` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`HandlerOptions`](../interfaces/handler.HandlerOptions.md)<`Request`, [`RequestContext`](../interfaces/use_fetch.RequestContext.md), `Context`\> |
| `fetchApi` | `Partial`<[`RequestContext`](../interfaces/use_fetch.RequestContext.md)\> |

#### Returns

`fn`

▸ (`req`): `Promise`<`Response`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `req` | `Request` |

##### Returns

`Promise`<`Response`\>
