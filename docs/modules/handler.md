[graphql-sse](../README.md) / handler

# Module: handler

## Table of contents

### Interfaces

- [HandlerOptions](../interfaces/handler.HandlerOptions.md)

### Type aliases

- [ExecutionContext](handler.md#executioncontext)
- [Handler](handler.md#handler)
- [OperationResult](handler.md#operationresult)

### Functions

- [createHandler](handler.md#createhandler)

## Server

### ExecutionContext

Ƭ **ExecutionContext**: `object` \| `symbol` \| `number` \| `string` \| `boolean` \| `undefined` \| ``null``

A concrete GraphQL execution context value type.

Mainly used because TypeScript collapes unions
with `any` or `unknown` to `any` or `unknown`. So,
we use a custom type to allow definitions such as
the `context` server option.

___

### Handler

Ƭ **Handler**: (`req`: `IncomingMessage`, `res`: `ServerResponse`, `body?`: `unknown`) => `Promise`<`void`\>

#### Type declaration

▸ (`req`, `res`, `body?`): `Promise`<`void`\>

The ready-to-use handler. Simply plug it in your favourite HTTP framework
and enjoy.

Beware that the handler resolves only after the whole operation completes.
- If query/mutation, waits for result
- If subscription, waits for complete

Errors thrown from **any** of the provided options or callbacks (or even due to
library misuse or potential bugs) will reject the handler's promise. They are
considered internal errors and you should take care of them accordingly.

For production environments, its recommended not to transmit the exact internal
error details to the client, but instead report to an error logging tool or simply
the console. Roughly:

```ts
import http from 'http';
import { createHandler } from 'graphql-sse';

const handler = createHandler({ ... });

http.createServer(async (req, res) => {
  try {
    await handler(req, res);
  } catch (err) {
    console.error(err);
    // or
    Sentry.captureException(err);

    res.writeHead(500, 'Internal Server Error').end();
  }
});
```

Note that some libraries, like fastify, parse the body before reaching the handler.
In such cases all request 'data' events are already consumed. Use this `body` argument
too pass in the read body and avoid listening for the 'data' events internally.

##### Parameters

| Name | Type |
| :------ | :------ |
| `req` | `IncomingMessage` |
| `res` | `ServerResponse` |
| `body?` | `unknown` |

##### Returns

`Promise`<`void`\>

___

### OperationResult

Ƭ **OperationResult**: `Promise`<`AsyncIterableIterator`<`ExecutionResult`\> \| `ExecutionResult`\> \| `AsyncIterableIterator`<`ExecutionResult`\> \| `ExecutionResult`

___

### createHandler

▸ **createHandler**(`options`): [`Handler`](handler.md#handler)

Makes a Protocol complient HTTP GraphQL server  handler. The handler can
be used with your favourite server library.

Read more about the Protocol in the PROTOCOL.md documentation file.

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`HandlerOptions`](../interfaces/handler.HandlerOptions.md) |

#### Returns

[`Handler`](handler.md#handler)
