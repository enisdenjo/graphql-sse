[graphql-sse](../README.md) / use/http2

# Module: use/http2

## Table of contents

### Interfaces

- [RequestContext](../interfaces/use_http2.RequestContext.md)

### Functions

- [createHandler](use_http2.md#createhandler)

## Server/http2

### createHandler

▸ **createHandler**<`Context`\>(`options`): (`req`: `Http2ServerRequest`, `res`: `Http2ServerResponse`) => `Promise`<`void`\>

The ready-to-use handler for Node's [http](https://nodejs.org/api/http2.html).

Errors thrown from **any** of the provided options or callbacks (or even due to
library misuse or potential bugs) will reject the handler's promise. They are
considered internal errors and you should take care of them accordingly.

For production environments, its recommended not to transmit the exact internal
error details to the client, but instead report to an error logging tool or simply
the console.

```ts
import http from 'http2';
import { createHandler } from 'graphql-sse/lib/use/http2';
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
