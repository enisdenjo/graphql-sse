[graphql-sse](../README.md) / [client](../modules/client.md) / Client

# Interface: Client

[client](../modules/client.md).Client

## Table of contents

### Properties

- [dispose](client.Client.md#dispose)

### Methods

- [subscribe](client.Client.md#subscribe)

## Properties

### dispose

• **dispose**: () => `void`

#### Type declaration

▸ (): `void`

Dispose of the client, destroy connections and clean up resources.

##### Returns

`void`

## Methods

### subscribe

▸ **subscribe**<`Data`, `Extensions`\>(`request`, `sink`): () => `void`

Subscribes to receive through a SSE connection.

It uses the `sink` to emit received data or errors. Returns a _dispose_
function used for dropping the subscription and cleaning up.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Data` | `Record`<`string`, `unknown`\> |
| `Extensions` | `unknown` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`RequestParams`](common.RequestParams.md) |
| `sink` | [`Sink`](common.Sink.md)<[`ExecutionResult`](common.ExecutionResult.md)<`Data`, `Extensions`\>\> |

#### Returns

`fn`

▸ (): `void`

Subscribes to receive through a SSE connection.

It uses the `sink` to emit received data or errors. Returns a _dispose_
function used for dropping the subscription and cleaning up.

##### Returns

`void`
