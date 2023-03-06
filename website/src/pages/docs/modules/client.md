[graphql-sse](../README.md) / client

# Module: client

## Table of contents

### References

- [ExecutionPatchResult](client.md#executionpatchresult)
- [ExecutionResult](client.md#executionresult)
- [RequestParams](client.md#requestparams)
- [Sink](client.md#sink)
- [StreamData](client.md#streamdata)
- [StreamDataForID](client.md#streamdataforid)
- [StreamEvent](client.md#streamevent)
- [StreamMessage](client.md#streammessage)
- [TOKEN\_HEADER\_KEY](client.md#token_header_key)
- [TOKEN\_QUERY\_KEY](client.md#token_query_key)
- [isAsyncGenerator](client.md#isasyncgenerator)
- [isAsyncIterable](client.md#isasynciterable)
- [parseStreamData](client.md#parsestreamdata)
- [print](client.md#print)
- [validateStreamEvent](client.md#validatestreamevent)

### Classes

- [NetworkError](../classes/client.NetworkError.md)

### Interfaces

- [Client](../interfaces/client.Client.md)
- [ClientOptions](../interfaces/client.ClientOptions.md)

### Functions

- [createClient](client.md#createclient)

## Client

### createClient

▸ **createClient**<`SingleConnection`\>(`options`): [`Client`](../interfaces/client.Client.md)

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
| `options` | [`ClientOptions`](../interfaces/client.ClientOptions.md)<`SingleConnection`\> |

#### Returns

[`Client`](../interfaces/client.Client.md)

## Other

### ExecutionPatchResult

Re-exports [ExecutionPatchResult](../interfaces/common.ExecutionPatchResult.md)

___

### ExecutionResult

Re-exports [ExecutionResult](../interfaces/common.ExecutionResult.md)

___

### RequestParams

Re-exports [RequestParams](../interfaces/common.RequestParams.md)

___

### Sink

Re-exports [Sink](../interfaces/common.Sink.md)

___

### StreamData

Re-exports [StreamData](common.md#streamdata)

___

### StreamDataForID

Re-exports [StreamDataForID](common.md#streamdataforid)

___

### StreamEvent

Re-exports [StreamEvent](common.md#streamevent)

___

### StreamMessage

Re-exports [StreamMessage](../interfaces/common.StreamMessage.md)

___

### TOKEN\_HEADER\_KEY

Re-exports [TOKEN_HEADER_KEY](common.md#token_header_key)

___

### TOKEN\_QUERY\_KEY

Re-exports [TOKEN_QUERY_KEY](common.md#token_query_key)

___

### isAsyncGenerator

Re-exports [isAsyncGenerator](common.md#isasyncgenerator)

___

### isAsyncIterable

Re-exports [isAsyncIterable](common.md#isasynciterable)

___

### parseStreamData

Re-exports [parseStreamData](common.md#parsestreamdata)

___

### print

Re-exports [print](common.md#print)

___

### validateStreamEvent

Re-exports [validateStreamEvent](common.md#validatestreamevent)
