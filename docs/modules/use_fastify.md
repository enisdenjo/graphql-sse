[graphql-sse](../README.md) / use/fastify

# Module: use/fastify

## Table of contents

### Interfaces

- [RequestContext](../interfaces/use_fastify.RequestContext.md)

### Functions

- [createHandler](use_fastify.md#createhandler)

## Server/fastify

### createHandler

▸ **createHandler**<`Context`\>(`options`): (`req`: `FastifyRequest`, `reply`: `FastifyReply`) => `Promise`<`void`\>

The ready-to-use handler for [fastify](https://www.fastify.io).

Errors thrown from **any** of the provided options or callbacks (or even due to
library misuse or potential bugs) will reject the handler's promise. They are
considered internal errors and you should take care of them accordingly.

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
    // or
    Sentry.captureException(err);

    if (!reply.raw.headersSent) {
      // could happen that some hook throws
      // after the headers have been flushed
      reply.code(500).send();
    }
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
| `options` | [`HandlerOptions`](../interfaces/handler.HandlerOptions.md)<`FastifyRequest`<`RouteGenericInterface`, `RawServerDefault`, `IncomingMessage`, `FastifySchema`, `FastifyTypeProviderDefault`, `unknown`, `FastifyBaseLogger`, `ResolveFastifyRequestType`<`FastifyTypeProviderDefault`, `FastifySchema`, `RouteGenericInterface`\>\>, [`RequestContext`](../interfaces/use_fastify.RequestContext.md), `Context`\> |

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
