# Interface: Client

[client](/docs/modules/client).Client

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
| `request` | [`RequestParams`](/docs/interfaces/common.RequestParams) |
| `sink` | [`Sink`](/docs/interfaces/common.Sink)<[`ExecutionResult`](/docs/interfaces/common.ExecutionResult)<`Data`, `Extensions`\>\> |

#### Returns

`fn`

▸ (): `void`

Subscribes to receive through a SSE connection.

It uses the `sink` to emit received data or errors. Returns a _dispose_
function used for dropping the subscription and cleaning up.

##### Returns

`void`
