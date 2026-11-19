---
title: "Module: use/fetch"
sidebarTitle: "use/fetch"
description: "Everything exported by graphql-sse/use/fetch: functions, classes, interfaces and types."
---
## Interfaces

- [RequestContext](/docs/interfaces/use_fetch.RequestContext)

## Server/fetch

### HandlerOptions

Ƭ **HandlerOptions**\<`Context`\>: [`HandlerOptions`](/docs/interfaces/handler.HandlerOptions)\<`Request`, [`RequestContext`](/docs/interfaces/use_fetch.RequestContext), `Context`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Context` | extends [`OperationContext`](/docs/modules/handler#operationcontext) = `undefined` |

#### Defined in

[src/use/fetch.ts:19](https://github.com/enisdenjo/graphql-sse/blob/master/src/use/fetch.ts#L19)

___

### createHandler

▸ **createHandler**\<`Context`\>(`options`, `reqCtx?`): (`req`: `Request`) => `Promise`\<`Response`\>

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
| `Context` | extends [`OperationContext`](/docs/modules/handler#operationcontext) = `undefined` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`HandlerOptions`](/docs/modules/use_fetch#handleroptions)\<`Context`\> |
| `reqCtx` | `Partial`\<[`RequestContext`](/docs/interfaces/use_fetch.RequestContext)\> |

#### Returns

`fn`

▸ (`req`): `Promise`\<`Response`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `req` | `Request` |

##### Returns

`Promise`\<`Response`\>

#### Defined in

[src/use/fetch.ts:53](https://github.com/enisdenjo/graphql-sse/blob/master/src/use/fetch.ts#L53)
