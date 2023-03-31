[graphql-sse](../README.md) / use/fetch

# Module: use/fetch

## Table of contents

### Interfaces

- [RequestContext](../interfaces/use_fetch.RequestContext.md)

### Type Aliases

- [HandlerOptions](use_fetch.md#handleroptions)

### Functions

- [createHandler](use_fetch.md#createhandler)

## Server/fetch

### HandlerOptions

Ƭ **HandlerOptions**<`Context`\>: [`HandlerOptions`](../interfaces/handler.HandlerOptions.md)<`Request`, [`RequestContext`](../interfaces/use_fetch.RequestContext.md), `Context`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Context` | extends [`OperationContext`](handler.md#operationcontext) = `undefined` |

___

### createHandler

▸ **createHandler**<`Context`\>(`options`, `reqCtx?`): (`req`: `Request`) => `Promise`<`Response`\>

The ready-to-use fetch handler. To be used with your favourite fetch
framework, in a lambda function, or have deploy to the edge.

Errors thrown from the provided options or callbacks (or even due to
library misuse or potential bugs) will reject the handler or bubble to the
returned iterator. They are considered internal errors and you should take care
of them accordingly.

For production environments, its recommended not to transmit the exact internal
error details to the client, but instead report to an error logging tool or simply
the console.

```ts
import { createHandler } from 'graphql-sse/lib/use/fetch';
import { schema } from './my-graphql';

const handler = createHandler({ schema });

export async function fetch(req: Request): Promise<Response> {
  try {
    return await handler(req);
  } catch (err) {
    console.error(err);
    return new Response(null, { status: 500 });
  }
}
```

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Context` | extends [`OperationContext`](handler.md#operationcontext) = `undefined` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`HandlerOptions`](use_fetch.md#handleroptions)<`Context`\> |
| `reqCtx` | `Partial`<[`RequestContext`](../interfaces/use_fetch.RequestContext.md)\> |

#### Returns

`fn`

▸ (`req`): `Promise`<`Response`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `req` | `Request` |

##### Returns

`Promise`<`Response`\>
