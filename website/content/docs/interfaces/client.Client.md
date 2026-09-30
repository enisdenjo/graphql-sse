---
title: "Interface: Client (client)"
sidebarTitle: "client.Client"
description: "Client (graphql-sse/client): Dispose of the client, destroy connections and clean up resources."
---
## Type parameters

| Name | Type |
| :------ | :------ |
| `SingleConnection` | extends `boolean` = ``false`` |

## Properties

### dispose

• **dispose**: () => `void`

Dispose of the client, destroy connections and clean up resources.

#### Type declaration

▸ (): `void`

Dispose of the client, destroy connections and clean up resources.

##### Returns

`void`

#### Defined in

[src/client.ts:265](https://github.com/enisdenjo/graphql-sse/blob/master/src/client.ts#L265)

## Methods

### iterate

▸ **iterate**\<`Data`, `Extensions`\>(`request`, `on?`): `AsyncIterableIterator`\<[`ExecutionResult`](/docs/interfaces/common.ExecutionResult)\<`Data`, `Extensions`\>\>

Subscribes and iterates over emitted results from an SSE connection
through the returned async iterator.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Data` | `Record`\<`string`, `unknown`\> |
| `Extensions` | `unknown` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `request` | [`RequestParams`](/docs/interfaces/common.RequestParams) | - |
| `on?` | `SingleConnection` extends ``true`` ? `never` : [`EventListeners`](/docs/interfaces/client.EventListeners)\<``false``\> | The event listener for "distinct connections mode". Note that **no events will be emitted** in "single connection mode"; for that, consider using the event listener in [ClientOptions](/docs/interfaces/client.ClientOptions). |

#### Returns

`AsyncIterableIterator`\<[`ExecutionResult`](/docs/interfaces/common.ExecutionResult)\<`Data`, `Extensions`\>\>

#### Defined in

[src/client.ts:258](https://github.com/enisdenjo/graphql-sse/blob/master/src/client.ts#L258)

___

### subscribe

▸ **subscribe**\<`Data`, `Extensions`\>(`request`, `sink`, `on?`): () => `void`

Subscribes to receive through a SSE connection.

It uses the `sink` to emit received data or errors. Returns a _dispose_
function used for dropping the subscription and cleaning up.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Data` | `Record`\<`string`, `unknown`\> |
| `Extensions` | `unknown` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `request` | [`RequestParams`](/docs/interfaces/common.RequestParams) | - |
| `sink` | [`Sink`](/docs/interfaces/common.Sink)\<[`ExecutionResult`](/docs/interfaces/common.ExecutionResult)\<`Data`, `Extensions`\>\> | - |
| `on?` | `SingleConnection` extends ``true`` ? `never` : [`EventListeners`](/docs/interfaces/client.EventListeners)\<``false``\> | The event listener for "distinct connections mode". Note that **no events will be emitted** in "single connection mode"; for that, consider using the event listener in [ClientOptions](/docs/interfaces/client.ClientOptions). |

#### Returns

`fn`

▸ (): `void`

##### Returns

`void`

#### Defined in

[src/client.ts:247](https://github.com/enisdenjo/graphql-sse/blob/master/src/client.ts#L247)
