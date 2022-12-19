[graphql-sse](../README.md) / use/express

# Module: use/express

## Table of contents

### Interfaces

- [RequestContext](../interfaces/use_express.RequestContext.md)

### Functions

- [createHandler](use_express.md#createhandler)

## Server/express

### createHandler

▸ **createHandler**<`Context`\>(`options`): (`req`: `Request`, `res`: `Response`) => `Promise`<`void`\>

The ready-to-use handler for [express](https://expressjs.com).

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
import express from 'express';
import { createHandler } from 'graphql-sse/lib/use/express';
import { schema } from './my-graphql';

const handler = createHandler({ schema });

const app = express();

app.use('/graphql/stream', async (req, res) => {
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
| `options` | [`HandlerOptions`](../interfaces/handler.HandlerOptions.md)<`Request`<`ParamsDictionary`, `any`, `any`, `ParsedQs`, `Record`<`string`, `any`\>\>, [`RequestContext`](../interfaces/use_express.RequestContext.md), `Context`\> |

#### Returns

`fn`

▸ (`req`, `res`): `Promise`<`void`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `req` | `Request` |
| `res` | `Response` |

##### Returns

`Promise`<`void`\>
