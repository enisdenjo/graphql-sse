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

Errors thrown from the provided options or callbacks (or even due to
library misuse or potential bugs) will reject the handler or bubble to the
returned iterator. They are considered internal errors and you should take care
of them accordingly.

For production environments, its recommended not to transmit the exact internal
error details to the client, but instead report to an error logging tool or simply
the console.

```ts
import express from 'express'; // yarn add express
import { createHandler } from 'graphql-sse/lib/use/express';
import { schema } from './my-graphql';

const handler = createHandler({ schema });

const app = express();

app.use('/graphql/stream', async (req, res) => {
  try {
    await handler(req, res);
  } catch (err) {
    console.error(err);
    res.writeHead(500).end();
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
