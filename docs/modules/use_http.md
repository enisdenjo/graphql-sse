[graphql-sse](../README.md) / use/http

# Module: use/http

## Table of contents

### Interfaces

- [RequestContext](../interfaces/use_http.RequestContext.md)

### Functions

- [createHandler](use_http.md#createhandler)

## Server/http

### createHandler

▸ **createHandler**<`Context`\>(`options`): (`req`: `IncomingMessage`, `res`: `ServerResponse`) => `Promise`<`void`\>

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
the console.

```ts
import http from 'http';
import { createHandler } from 'graphql-sse/lib/use/http';
import { schema } from './my-graphql';

const handler = createHandler({ schema });

const server = http.createServer(async (req, res) => {
  try {
    await handler(req, res);
  } catch (err) {
    console.error(err);
    // or
    Sentry.captureException(err);

    if (!res.headersSent) {
      // could happen that some hook throws
      // after the headers have been flushed
      res.writeHead(500, 'Internal Server Error').end();
    }
  }
});

server.listen(4000);
console.log('Listening to port 4000');
```

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
