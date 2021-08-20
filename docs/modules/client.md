[graphql-sse](../README.md) / client

# Module: client

## Table of contents

### References

- [RequestParams](client.md#requestparams)
- [Sink](client.md#sink)
- [StreamData](client.md#streamdata)
- [StreamDataForID](client.md#streamdataforid)
- [StreamEvent](client.md#streamevent)
- [StreamMessage](client.md#streammessage)
- [parseStreamData](client.md#parsestreamdata)
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

▸ **createClient**(`options`): [`Client`](../interfaces/client.Client.md)

Creates a disposable GraphQL over SSE client to transmit
GraphQL operation results.

If you have an HTTP/2 server, it is recommended to use the client
in "distinct connections mode" (`singleConnection = true`) which will
create a new SSE connection for each subscribe. This is the default.

However, when dealing with HTTP/1 servers from a browser, consider using
the "single connection mode" (`singleConnection = false`) which will
use only one SSE connection.

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`ClientOptions`](../interfaces/client.ClientOptions.md) |

#### Returns

[`Client`](../interfaces/client.Client.md)

## Other

### RequestParams

Re-exports: [RequestParams](../interfaces/common.RequestParams.md)

___

### Sink

Re-exports: [Sink](../interfaces/common.Sink.md)

___

### StreamData

Re-exports: [StreamData](common.md#streamdata)

___

### StreamDataForID

Re-exports: [StreamDataForID](common.md#streamdataforid)

___

### StreamEvent

Re-exports: [StreamEvent](common.md#streamevent)

___

### StreamMessage

Re-exports: [StreamMessage](../interfaces/common.StreamMessage.md)

___

### parseStreamData

Re-exports: [parseStreamData](common.md#parsestreamdata)

___

### validateStreamEvent

Re-exports: [validateStreamEvent](common.md#validatestreamevent)
