# Module: common

## Interfaces

- [ExecutionPatchResult](/docs/interfaces/common.ExecutionPatchResult)
- [ExecutionResult](/docs/interfaces/common.ExecutionResult)
- [RequestParams](/docs/interfaces/common.RequestParams)
- [Sink](/docs/interfaces/common.Sink)
- [StreamMessage](/docs/interfaces/common.StreamMessage)

## Common

### StreamData

Ƭ **StreamData**<`E`\>: `E` extends ``"next"`` ? [`ExecutionResult`](/docs/interfaces/common.ExecutionResult) \| [`ExecutionPatchResult`](/docs/interfaces/common.ExecutionPatchResult) : `E` extends ``"complete"`` ? ``null`` : `never`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `E` | extends [`StreamEvent`](/docs/modules/common.md#streamevent) |

___

### StreamDataForID

Ƭ **StreamDataForID**<`E`\>: `E` extends ``"next"`` ? { `id`: `string` ; `payload`: [`ExecutionResult`](/docs/interfaces/common.ExecutionResult) \| [`ExecutionPatchResult`](/docs/interfaces/common.ExecutionPatchResult)  } : `E` extends ``"complete"`` ? { `id`: `string`  } : `never`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `E` | extends [`StreamEvent`](/docs/modules/common.md#streamevent) |

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

### isAsyncGenerator

▸ **isAsyncGenerator**<`T`\>(`val`): val is AsyncGenerator<T, any, unknown\>

Checkes whether the provided value is an async generator.

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

___

### isAsyncIterable

▸ **isAsyncIterable**<`T`\>(`val`): val is AsyncIterable<T\>

Checkes whether the provided value is an async iterable.

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `val` | `unknown` |

#### Returns

val is AsyncIterable<T\>

___

### parseStreamData

▸ **parseStreamData**<`ForID`, `E`\>(`e`, `data`): `ForID` extends ``true`` ? [`StreamDataForID`](/docs/modules/common.md#streamdataforid)<`E`\> : [`StreamData`](/docs/modules/common.md#streamdata)<`E`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `ForID` | extends `boolean` |
| `E` | extends [`StreamEvent`](/docs/modules/common.md#streamevent) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `e` | `E` |
| `data` | `string` |

#### Returns

`ForID` extends ``true`` ? [`StreamDataForID`](/docs/modules/common.md#streamdataforid)<`E`\> : [`StreamData`](/docs/modules/common.md#streamdata)<`E`\>

___

### print

▸ **print**<`ForID`, `E`\>(`msg`): `string`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `ForID` | extends `boolean` |
| `E` | extends [`StreamEvent`](/docs/modules/common.md#streamevent) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `msg` | [`StreamMessage`](/docs/interfaces/common.StreamMessage)<`ForID`, `E`\> |

#### Returns

`string`

___

### validateStreamEvent

▸ **validateStreamEvent**(`e`): [`StreamEvent`](/docs/modules/common.md#streamevent)

#### Parameters

| Name | Type |
| :------ | :------ |
| `e` | `unknown` |

#### Returns

[`StreamEvent`](/docs/modules/common.md#streamevent)
