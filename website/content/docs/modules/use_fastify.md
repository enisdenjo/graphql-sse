---
title: "Module: use/fastify"
sidebarTitle: "use/fastify"
description: "Everything exported by graphql-sse/use/fastify: functions, classes, interfaces and types."
---
## Interfaces

- [RequestContext](/docs/interfaces/use_fastify.RequestContext)

## Server/fastify

### HandlerOptions

Ƭ **HandlerOptions**\<`Context`\>: [`HandlerOptions`](/docs/interfaces/handler.HandlerOptions)\<`FastifyRequest`, [`RequestContext`](/docs/interfaces/use_fastify.RequestContext), `Context`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Context` | extends [`OperationContext`](/docs/modules/handler#operationcontext) = `undefined` |

#### Defined in

[src/use/fastify.ts:18](https://github.com/enisdenjo/graphql-sse/blob/master/src/use/fastify.ts#L18)

___

### createHandler

▸ **createHandler**\<`Context`\>(`options`): (`req`: `FastifyRequest`, `reply`: `FastifyReply`) => `Promise`\<`void`\>

The ready-to-use handler for [fastify](https://www.fastify.io).

Errors thrown from the provided options or callbacks (or even due to
library misuse or potential bugs) will reject the handler or bubble to the
returned iterator. They are considered internal errors and you should take care
of them accordingly.

For production environments, its recommended not to transmit the exact internal
error details to the client, but instead report to an error logging tool or simply
the console.

```ts
import Fastify from 'fastify'; // yarn add fastify
import { createHandler } from 'graphql-sse/lib/use/fastify';

const handler = createHandler({ schema });

const fastify = Fastify();

fastify.all('/graphql/stream', async (req, reply) => {
  try {
    await handler(req, reply);
  } catch (err) {
    console.error(err);
    reply.code(500).send();
  }
});

fastify.listen({ port: 4000 });
console.log('Listening to port 4000');
```

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Context` | extends [`OperationContext`](/docs/modules/handler#operationcontext) = `undefined` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`HandlerOptions`](/docs/modules/use_fastify#handleroptions)\<`Context`\> |

#### Returns

`fn`

▸ (`req`, `reply`): `Promise`\<`void`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `req` | `FastifyRequest` |
| `reply` | `FastifyReply` |

##### Returns

`Promise`\<`void`\>

#### Defined in

[src/use/fastify.ts:56](https://github.com/enisdenjo/graphql-sse/blob/master/src/use/fastify.ts#L56)
