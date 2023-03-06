# Module: client

## Classes

- [NetworkError](/docs/classes/client.NetworkError)

## Interfaces

- [Client](/docs/interfaces/client.Client)
- [ClientOptions](/docs/interfaces/client.ClientOptions)

## Client

### createClient

▸ **createClient**<`SingleConnection`\>(`options`): [`Client`](/docs/interfaces/client.Client)

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
| `options` | [`ClientOptions`](/docs/interfaces/client.ClientOptions)<`SingleConnection`\> |

#### Returns

[`Client`](/docs/interfaces/client.Client)

## Other

### ExecutionPatchResult

Re-exports [ExecutionPatchResult](/docs/interfaces/common.ExecutionPatchResult)

___

### ExecutionResult

Re-exports [ExecutionResult](/docs/interfaces/common.ExecutionResult)

___

### RequestParams

Re-exports [RequestParams](/docs/interfaces/common.RequestParams)

___

### Sink

Re-exports [Sink](/docs/interfaces/common.Sink)

___

### StreamData

Re-exports [StreamData](/docs/modules/common.md#streamdata)

___

### StreamDataForID

Re-exports [StreamDataForID](/docs/modules/common.md#streamdataforid)

___

### StreamEvent

Re-exports [StreamEvent](/docs/modules/common.md#streamevent)

___

### StreamMessage

Re-exports [StreamMessage](/docs/interfaces/common.StreamMessage)

___

### TOKEN\_HEADER\_KEY

Re-exports [TOKEN_HEADER_KEY](/docs/modules/common.md#token_header_key)

___

### TOKEN\_QUERY\_KEY

Re-exports [TOKEN_QUERY_KEY](/docs/modules/common.md#token_query_key)

___

### isAsyncGenerator

Re-exports [isAsyncGenerator](/docs/modules/common.md#isasyncgenerator)

___

### isAsyncIterable

Re-exports [isAsyncIterable](/docs/modules/common.md#isasynciterable)

___

### parseStreamData

Re-exports [parseStreamData](/docs/modules/common.md#parsestreamdata)

___

### print

Re-exports [print](/docs/modules/common.md#print)

___

### validateStreamEvent

Re-exports [validateStreamEvent](/docs/modules/common.md#validatestreamevent)
