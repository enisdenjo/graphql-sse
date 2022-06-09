graphql-sse

# graphql-sse

## Table of contents

### Classes

- [NetworkError](classes/NetworkError.md)

### Interfaces

- [Client](interfaces/Client.md)
- [ClientOptions](interfaces/ClientOptions.md)
- [ExecutionPatchResult](interfaces/ExecutionPatchResult.md)
- [ExecutionResult](interfaces/ExecutionResult.md)
- [HandlerOptions](interfaces/HandlerOptions.md)
- [RequestParams](interfaces/RequestParams.md)
- [Sink](interfaces/Sink.md)
- [StreamMessage](interfaces/StreamMessage.md)

### Type Aliases

- [ExecutionContext](README.md#executioncontext)
- [Handler](README.md#handler)
- [OperationResult](README.md#operationresult)
- [StreamData](README.md#streamdata)
- [StreamDataForID](README.md#streamdataforid)
- [StreamEvent](README.md#streamevent)

### Variables

- [TOKEN\_HEADER\_KEY](README.md#token_header_key)
- [TOKEN\_QUERY\_KEY](README.md#token_query_key)

### Functions

- [createClient](README.md#createclient)
- [createHandler](README.md#createhandler)
- [isAsyncGenerator](README.md#isasyncgenerator)
- [parseStreamData](README.md#parsestreamdata)
- [validateStreamEvent](README.md#validatestreamevent)

## Client

### createClient

▸ **createClient**<`SingleConnection`\>(`options`): [`Client`](interfaces/Client.md)

Creates a disposable GraphQL over SSE client to transmit
GraphQL operation results.

If you have an HTTP/2 server, it is recommended to use the client
in "distinct connections mode" (`singleConnection = false`) which will
create a new SSE connection for each subscribe. This is the default.

However, when dealing with HTTP/1 servers from a browser, consider using
the "single connection mode" (`singleConnection = true`) which will
use only one SSE connection.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `SingleConnection` | extends `boolean` = ``false`` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`ClientOptions`](interfaces/ClientOptions.md)<`SingleConnection`\> |

#### Returns

[`Client`](interfaces/Client.md)

## Common

### StreamData

Ƭ **StreamData**<`E`\>: `E` extends ``"next"`` ? [`ExecutionResult`](interfaces/ExecutionResult.md) \| [`ExecutionPatchResult`](interfaces/ExecutionPatchResult.md) : `E` extends ``"complete"`` ? ``null`` : `never`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `E` | extends [`StreamEvent`](README.md#streamevent) |

___

### StreamDataForID

Ƭ **StreamDataForID**<`E`\>: `E` extends ``"next"`` ? { `id`: `string` ; `payload`: [`ExecutionResult`](interfaces/ExecutionResult.md) \| [`ExecutionPatchResult`](interfaces/ExecutionPatchResult.md)  } : `E` extends ``"complete"`` ? { `id`: `string`  } : `never`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `E` | extends [`StreamEvent`](README.md#streamevent) |

___

### StreamEvent

Ƭ **StreamEvent**: ``"next"`` \| ``"complete"``

___

### TOKEN\_HEADER\_KEY

• `Const` **TOKEN\_HEADER\_KEY**: ``"x-graphql-event-stream-token"``

Header key through which the event stream token is transmitted
when using the client in "single connection mode".

Read more: https://github.com/enisdenjo/graphql-sse/blob/master/PROTOCOL.md#single-connection-mode

___

### TOKEN\_QUERY\_KEY

• `Const` **TOKEN\_QUERY\_KEY**: ``"token"``

URL query parameter key through which the event stream token is transmitted
when using the client in "single connection mode".

Read more: https://github.com/enisdenjo/graphql-sse/blob/master/PROTOCOL.md#single-connection-mode

___

### parseStreamData

▸ **parseStreamData**<`ForID`, `E`\>(`e`, `data`): `ForID` extends ``true`` ? [`StreamDataForID`](README.md#streamdataforid)<`E`\> : [`StreamData`](README.md#streamdata)<`E`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `ForID` | extends `boolean` |
| `E` | extends [`StreamEvent`](README.md#streamevent) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `e` | `E` |
| `data` | `string` |

#### Returns

`ForID` extends ``true`` ? [`StreamDataForID`](README.md#streamdataforid)<`E`\> : [`StreamData`](README.md#streamdata)<`E`\>

___

### validateStreamEvent

▸ **validateStreamEvent**(`e`): [`StreamEvent`](README.md#streamevent)

#### Parameters

| Name | Type |
| :------ | :------ |
| `e` | `unknown` |

#### Returns

[`StreamEvent`](README.md#streamevent)

## Other

### isAsyncGenerator

▸ **isAsyncGenerator**<`T`\>(`val`): val is AsyncGenerator<T, any, unknown\>

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `val` | `unknown` |

#### Returns

val is AsyncGenerator<T, any, unknown\>

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

Ƭ **Handler**<`Request`, `Response`\>: (`req`: `Request`, `res`: `Response`, `body?`: `unknown`) => `Promise`<`void`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Request` | extends `IncomingMessage` = `IncomingMessage` |
| `Response` | extends `ServerResponse` = `ServerResponse` |

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

    if (!res.headersSent) {
      res.writeHead(500, 'Internal Server Error').end();
    }
  }
});
```

Note that some libraries, like fastify, parse the body before reaching the handler.
In such cases all request 'data' events are already consumed. Use this `body` argument
too pass in the read body and avoid listening for the 'data' events internally. Do
beware that the `body` argument will be consumed **only** if it's an object.

##### Parameters

| Name | Type |
| :------ | :------ |
| `req` | `Request` |
| `res` | `Response` |
| `body?` | `unknown` |

##### Returns

`Promise`<`void`\>

___

### OperationResult

Ƭ **OperationResult**: `Promise`<`AsyncGenerator`<[`ExecutionResult`](interfaces/ExecutionResult.md) \| [`ExecutionPatchResult`](interfaces/ExecutionPatchResult.md)\> \| `AsyncIterable`<[`ExecutionResult`](interfaces/ExecutionResult.md) \| [`ExecutionPatchResult`](interfaces/ExecutionPatchResult.md)\> \| [`ExecutionResult`](interfaces/ExecutionResult.md)\> \| `AsyncGenerator`<[`ExecutionResult`](interfaces/ExecutionResult.md) \| [`ExecutionPatchResult`](interfaces/ExecutionPatchResult.md)\> \| `AsyncIterable`<[`ExecutionResult`](interfaces/ExecutionResult.md) \| [`ExecutionPatchResult`](interfaces/ExecutionPatchResult.md)\> \| [`ExecutionResult`](interfaces/ExecutionResult.md)

___

### createHandler

▸ **createHandler**<`Request`, `Response`\>(`options`): [`Handler`](README.md#handler)<`Request`, `Response`\>

Makes a Protocol complient HTTP GraphQL server  handler. The handler can
be used with your favourite server library.

Read more about the Protocol in the PROTOCOL.md documentation file.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Request` | extends `IncomingMessage`<`Request`\> = `IncomingMessage` |
| `Response` | extends `ServerResponse`<`Response`\> = `ServerResponse` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`HandlerOptions`](interfaces/HandlerOptions.md)<`Request`, `Response`\> |

#### Returns

[`Handler`](README.md#handler)<`Request`, `Response`\>
