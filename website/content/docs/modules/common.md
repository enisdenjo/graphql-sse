---
title: "Module: common"
sidebarTitle: "common"
description: "Everything exported by graphql-sse/common: functions, classes, interfaces and types."
---
## Interfaces

- [ExecutionPatchResult](/docs/interfaces/common.ExecutionPatchResult)
- [ExecutionResult](/docs/interfaces/common.ExecutionResult)
- [RequestParams](/docs/interfaces/common.RequestParams)
- [Sink](/docs/interfaces/common.Sink)
- [StreamMessage](/docs/interfaces/common.StreamMessage)

## Common

### StreamData

Ƭ **StreamData**\<`E`\>: `E` extends ``"next"`` ? [`ExecutionResult`](/docs/interfaces/common.ExecutionResult) \| [`ExecutionPatchResult`](/docs/interfaces/common.ExecutionPatchResult) : `E` extends ``"complete"`` ? ``null`` : `never`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `E` | extends [`StreamEvent`](/docs/modules/common#streamevent) |

#### Defined in

[src/common.ts:107](https://github.com/enisdenjo/graphql-sse/blob/master/src/common.ts#L107)

___

### StreamDataForID

Ƭ **StreamDataForID**\<`E`\>: `E` extends ``"next"`` ? \{ `id`: `string` ; `payload`: [`ExecutionResult`](/docs/interfaces/common.ExecutionResult) \| [`ExecutionPatchResult`](/docs/interfaces/common.ExecutionPatchResult)  } : `E` extends ``"complete"`` ? \{ `id`: `string`  } : `never`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `E` | extends [`StreamEvent`](/docs/modules/common#streamevent) |

#### Defined in

[src/common.ts:114](https://github.com/enisdenjo/graphql-sse/blob/master/src/common.ts#L114)

___

### StreamEvent

Ƭ **StreamEvent**: ``"next"`` \| ``"complete"``

#### Defined in

[src/common.ts:59](https://github.com/enisdenjo/graphql-sse/blob/master/src/common.ts#L59)

___

### TOKEN\_HEADER\_KEY

• `Const` **TOKEN\_HEADER\_KEY**: ``"x-graphql-event-stream-token"``

Header key through which the event stream token is transmitted
when using the client in "single connection mode".

Read more: https://github.com/enisdenjo/graphql-sse/blob/master/PROTOCOL.md#single-connection-mode

#### Defined in

[src/common.ts:18](https://github.com/enisdenjo/graphql-sse/blob/master/src/common.ts#L18)

___

### TOKEN\_QUERY\_KEY

• `Const` **TOKEN\_QUERY\_KEY**: ``"token"``

URL query parameter key through which the event stream token is transmitted
when using the client in "single connection mode".

Read more: https://github.com/enisdenjo/graphql-sse/blob/master/PROTOCOL.md#single-connection-mode

#### Defined in

[src/common.ts:28](https://github.com/enisdenjo/graphql-sse/blob/master/src/common.ts#L28)

___

### isAsyncGenerator

▸ **isAsyncGenerator**\<`T`\>(`val`): val is AsyncGenerator\<T, any, unknown\>

Checks whether the provided value is an async generator.

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `val` | `unknown` |

#### Returns

val is AsyncGenerator\<T, any, unknown\>

#### Defined in

[src/common.ts:169](https://github.com/enisdenjo/graphql-sse/blob/master/src/common.ts#L169)

___

### isAsyncIterable

▸ **isAsyncIterable**\<`T`\>(`val`): val is AsyncIterable\<T\>

Checks whether the provided value is an async iterable.

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `val` | `unknown` |

#### Returns

val is AsyncIterable\<T\>

#### Defined in

[src/common.ts:160](https://github.com/enisdenjo/graphql-sse/blob/master/src/common.ts#L160)

___

### parseStreamData

▸ **parseStreamData**\<`ForID`, `E`\>(`e`, `data`): `ForID` extends ``true`` ? [`StreamDataForID`](/docs/modules/common#streamdataforid)\<`E`\> : [`StreamData`](/docs/modules/common#streamdata)\<`E`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `ForID` | extends `boolean` |
| `E` | extends [`StreamEvent`](/docs/modules/common#streamevent) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `e` | `E` |
| `data` | `string` |

#### Returns

`ForID` extends ``true`` ? [`StreamDataForID`](/docs/modules/common#streamdataforid)\<`E`\> : [`StreamData`](/docs/modules/common#streamdata)\<`E`\>

#### Defined in

[src/common.ts:121](https://github.com/enisdenjo/graphql-sse/blob/master/src/common.ts#L121)

___

### print

▸ **print**\<`ForID`, `E`\>(`msg`): `string`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `ForID` | extends `boolean` |
| `E` | extends [`StreamEvent`](/docs/modules/common#streamevent) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `msg` | [`StreamMessage`](/docs/interfaces/common.StreamMessage)\<`ForID`, `E`\> |

#### Returns

`string`

#### Defined in

[src/common.ts:70](https://github.com/enisdenjo/graphql-sse/blob/master/src/common.ts#L70)

___

### validateStreamEvent

▸ **validateStreamEvent**(`e`): [`StreamEvent`](/docs/modules/common#streamevent)

#### Parameters

| Name | Type |
| :------ | :------ |
| `e` | `unknown` |

#### Returns

[`StreamEvent`](/docs/modules/common#streamevent)

#### Defined in

[src/common.ts:62](https://github.com/enisdenjo/graphql-sse/blob/master/src/common.ts#L62)
