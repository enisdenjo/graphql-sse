[graphql-sse](../README.md) / use/fastify

# Module: use/fastify

## Table of contents

### Interfaces

- [RequestContext](../interfaces/use_fastify.RequestContext.md)

### Type Aliases

- [HandlerOptions](use_fastify.md#handleroptions)

### Functions

- [createHandler](use_fastify.md#createhandler)

## Server/fastify

### createHandler

▸ **createHandler**<`Context`\>(`options`): (`req`: `FastifyRequest`, `reply`: `FastifyReply`) => `Promise`<`void`\>

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
| `Context` | extends [`OperationContext`](handler.md#operationcontext) = `undefined` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`HandlerOptions`](use_fastify.md#handleroptions)<`Context`\> |

#### Returns

`fn`

▸ (`req`, `reply`): `Promise`<`void`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `req` | `FastifyRequest` |
| `reply` | `FastifyReply` |

##### Returns

`Promise`<`void`\>

## Server/fetch

### HandlerOptions

Ƭ **HandlerOptions**<`Context`\>: [`HandlerOptions`](../interfaces/handler.HandlerOptions.md)<`FastifyRequest`, [`RequestContext`](../interfaces/use_fastify.RequestContext.md), `Context`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Context` | extends [`OperationContext`](handler.md#operationcontext) = `undefined` |
