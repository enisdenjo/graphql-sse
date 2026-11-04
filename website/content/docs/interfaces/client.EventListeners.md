---
title: "Interface: EventListeners (client)"
sidebarTitle: "client.EventListeners"
description: "EventListeners (graphql-sse/client): Emitted when the client has successfully connected to the server."
---
## Type parameters

| Name | Type |
| :------ | :------ |
| `SingleConnection` | extends `boolean` = ``false`` |

## Properties

### connected

• `Optional` **connected**: (`reconnected`: `boolean`) => `void`

Emitted when the client has successfully connected to the server.

**`Param`**

Whether the client has reconnected after the connection was broken.

#### Type declaration

▸ (`reconnected`): `void`

Emitted when the client has successfully connected to the server.

##### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `reconnected` | `boolean` | Whether the client has reconnected after the connection was broken. |

##### Returns

`void`

#### Defined in

[src/client.ts:39](https://github.com/enisdenjo/graphql-sse/blob/master/src/client.ts#L39)

___

### connecting

• `Optional` **connecting**: (`reconnecting`: `boolean`) => `void`

Emitted when the client starts connecting to the server.

**`Param`**

Whether the client is reconnecting after the connection was broken.

#### Type declaration

▸ (`reconnecting`): `void`

Emitted when the client starts connecting to the server.

##### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `reconnecting` | `boolean` | Whether the client is reconnecting after the connection was broken. |

##### Returns

`void`

#### Defined in

[src/client.ts:29](https://github.com/enisdenjo/graphql-sse/blob/master/src/client.ts#L29)

___

### message

• `Optional` **message**: (`message`: [`StreamMessage`](/docs/interfaces/common.StreamMessage)\<`SingleConnection`, [`StreamEvent`](/docs/modules/common#streamevent)\>) => `void`

Emitted when the client receives a message from the server.

#### Type declaration

▸ (`message`): `void`

Emitted when the client receives a message from the server.

##### Parameters

| Name | Type |
| :------ | :------ |
| `message` | [`StreamMessage`](/docs/interfaces/common.StreamMessage)\<`SingleConnection`, [`StreamEvent`](/docs/modules/common#streamevent)\> |

##### Returns

`void`

#### Defined in

[src/client.ts:33](https://github.com/enisdenjo/graphql-sse/blob/master/src/client.ts#L33)
