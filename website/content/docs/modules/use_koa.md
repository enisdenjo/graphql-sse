---
title: "Module: use/koa"
sidebarTitle: "use/koa"
description: "Everything exported by graphql-sse/use/koa: functions, classes, interfaces and types."
---
## Server/koa

### HandlerOptions

Ƭ **HandlerOptions**\<`Context`, `KoaState`, `KoaContext`\>: [`HandlerOptions`](/docs/interfaces/handler.HandlerOptions)\<`IncomingMessage`, `ParameterizedContext`\<`KoaState`, `KoaContext`\>, `Context`\>

Handler options when using the koa adapter.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Context` | extends [`OperationContext`](/docs/modules/handler#operationcontext) = `undefined` |
| `KoaState` | `DefaultState` |
| `KoaContext` | `DefaultContext` |

#### Defined in

[src/use/koa.ts:19](https://github.com/enisdenjo/graphql-sse/blob/master/src/use/koa.ts#L19)

___

### createHandler

▸ **createHandler**\<`Context`, `KoaState`, `KoaContext`\>(`options`): `Middleware`\<`KoaState`, `KoaContext`\>

The ready-to-use handler for [Koa](https://expressjs.com).

Errors thrown from the provided options or callbacks (or even due to
library misuse or potential bugs) will reject the handler or bubble to the
returned iterator. They are considered internal errors and you should take care
of them accordingly.

For production environments, its recommended not to transmit the exact internal
error details to the client, but instead report to an error logging tool or simply
the console.

```js
import Koa from 'koa'; // yarn add koa
import mount from 'koa-mount'; // yarn add koa-mount
import { createHandler } from 'graphql-sse/lib/use/koa';
import { schema } from './my-graphql';

const app = new Koa();
app.use(
  mount('/graphql/stream', async (ctx, next) => {
    try {
      await handler(ctx, next);
    } catch (err) {
      console.error(err);
      ctx.response.status = 500;
      ctx.response.message = 'Internal Server Error';
    }
  }),
);

app.listen({ port: 4000 });
console.log('Listening to port 4000');
```

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Context` | extends [`OperationContext`](/docs/modules/handler#operationcontext) = `undefined` |
| `KoaState` | `DefaultState` |
| `KoaContext` | `DefaultContext` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`HandlerOptions`](/docs/modules/use_koa#handleroptions)\<`Context`, `KoaState`, `KoaContext`\> |

#### Returns

`Middleware`\<`KoaState`, `KoaContext`\>

#### Defined in

[src/use/koa.ts:68](https://github.com/enisdenjo/graphql-sse/blob/master/src/use/koa.ts#L68)
