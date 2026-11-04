---
title: "Module: use/http"
sidebarTitle: "use/http"
description: "Everything exported by graphql-sse/use/http: functions, classes, interfaces and types."
---
## Interfaces

- [RequestContext](/docs/interfaces/use_http.RequestContext)

## Server/http

### HandlerOptions

Ƭ **HandlerOptions**\<`Context`\>: [`HandlerOptions`](/docs/interfaces/handler.HandlerOptions)\<`IncomingMessage`, [`RequestContext`](/docs/interfaces/use_http.RequestContext), `Context`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Context` | extends [`OperationContext`](/docs/modules/handler#operationcontext) = `undefined` |

#### Defined in

[src/use/http.ts:18](https://github.com/enisdenjo/graphql-sse/blob/master/src/use/http.ts#L18)

___

### createHandler

▸ **createHandler**\<`Context`\>(`options`): (`req`: `IncomingMessage`, `res`: `ServerResponse`) => `Promise`\<`void`\>

The ready-to-use handler for Node's [http](https://nodejs.org/api/http.html).

Errors thrown from the provided options or callbacks (or even due to
library misuse or potential bugs) will reject the handler or bubble to the
returned iterator. They are considered internal errors and you should take care
of them accordingly.

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
    res.writeHead(500).end();
  }
});

server.listen(4000);
console.log('Listening to port 4000');
```

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Context` | extends [`OperationContext`](/docs/modules/handler#operationcontext) = `undefined` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`HandlerOptions`](/docs/modules/use_http#handleroptions)\<`Context`\> |

#### Returns

`fn`

▸ (`req`, `res`): `Promise`\<`void`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `req` | `IncomingMessage` |
| `res` | `ServerResponse` |

##### Returns

`Promise`\<`void`\>

#### Defined in

[src/use/http.ts:55](https://github.com/enisdenjo/graphql-sse/blob/master/src/use/http.ts#L55)
