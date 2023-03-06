[graphql-sse](../README.md) / common

# Module: common

## Table of contents

### Interfaces

- [ExecutionPatchResult](../interfaces/common.ExecutionPatchResult.md)
- [ExecutionResult](../interfaces/common.ExecutionResult.md)
- [RequestParams](../interfaces/common.RequestParams.md)
- [Sink](../interfaces/common.Sink.md)
- [StreamMessage](../interfaces/common.StreamMessage.md)

### Type Aliases

- [StreamData](common.md#streamdata)
- [StreamDataForID](common.md#streamdataforid)
- [StreamEvent](common.md#streamevent)

### Variables

- [TOKEN\_HEADER\_KEY](common.md#token_header_key)
- [TOKEN\_QUERY\_KEY](common.md#token_query_key)

### Functions

- [isAsyncGenerator](common.md#isasyncgenerator)
- [isAsyncIterable](common.md#isasynciterable)
- [parseStreamData](common.md#parsestreamdata)
- [print](common.md#print)
- [validateStreamEvent](common.md#validatestreamevent)

## Common

### StreamData

Ƭ **StreamData**<`E`\>: `E` extends ``"next"`` ? [`ExecutionResult`](../interfaces/common.ExecutionResult.md) \| [`ExecutionPatchResult`](../interfaces/common.ExecutionPatchResult.md) : `E` extends ``"complete"`` ? ``null`` : `never`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `E` | extends [`StreamEvent`](common.md#streamevent) |

___

### StreamDataForID

Ƭ **StreamDataForID**<`E`\>: `E` extends ``"next"`` ? { `id`: `string` ; `payload`: [`ExecutionResult`](../interfaces/common.ExecutionResult.md) \| [`ExecutionPatchResult`](../interfaces/common.ExecutionPatchResult.md)  } : `E` extends ``"complete"`` ? { `id`: `string`  } : `never`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `E` | extends [`StreamEvent`](common.md#streamevent) |

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

▸ **parseStreamData**<`ForID`, `E`\>(`e`, `data`): `ForID` extends ``true`` ? [`StreamDataForID`](common.md#streamdataforid)<`E`\> : [`StreamData`](common.md#streamdata)<`E`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `ForID` | extends `boolean` |
| `E` | extends [`StreamEvent`](common.md#streamevent) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `e` | `E` |
| `data` | `string` |

#### Returns

`ForID` extends ``true`` ? [`StreamDataForID`](common.md#streamdataforid)<`E`\> : [`StreamData`](common.md#streamdata)<`E`\>

___

### print

▸ **print**<`ForID`, `E`\>(`msg`): `string`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `ForID` | extends `boolean` |
| `E` | extends [`StreamEvent`](common.md#streamevent) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `msg` | [`StreamMessage`](../interfaces/common.StreamMessage.md)<`ForID`, `E`\> |

#### Returns

`string`

___

### validateStreamEvent

▸ **validateStreamEvent**(`e`): [`StreamEvent`](common.md#streamevent)

#### Parameters

| Name | Type |
| :------ | :------ |
| `e` | `unknown` |

#### Returns

[`StreamEvent`](common.md#streamevent)
