[graphql-sse](../README.md) / common

# Module: common

## Table of contents

### Interfaces

- [ExecutionPatchResult](../interfaces/common.ExecutionPatchResult.md)
- [ExecutionResult](../interfaces/common.ExecutionResult.md)
- [RequestParams](../interfaces/common.RequestParams.md)
- [Sink](../interfaces/common.Sink.md)
- [StreamMessage](../interfaces/common.StreamMessage.md)

### Type aliases

- [StreamData](common.md#streamdata)
- [StreamDataForID](common.md#streamdataforid)
- [StreamEvent](common.md#streamevent)

### Functions

- [parseStreamData](common.md#parsestreamdata)
- [validateStreamEvent](common.md#validatestreamevent)

## Common

### StreamData

Ƭ **StreamData**<`E`\>: `E` extends ``"next"`` ? [`ExecutionResult`](../interfaces/common.ExecutionResult.md) \| [`ExecutionPatchResult`](../interfaces/common.ExecutionPatchResult.md) : `E` extends ``"complete"`` ? ``null`` : `never`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `E` | extends [`StreamEvent`](common.md#streamevent)[`StreamEvent`](common.md#streamevent) |

___

### StreamDataForID

Ƭ **StreamDataForID**<`E`\>: `E` extends ``"next"`` ? { `id`: `string` ; `payload`: [`ExecutionResult`](../interfaces/common.ExecutionResult.md) \| [`ExecutionPatchResult`](../interfaces/common.ExecutionPatchResult.md)  } : `E` extends ``"complete"`` ? { `id`: `string`  } : `never`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `E` | extends [`StreamEvent`](common.md#streamevent)[`StreamEvent`](common.md#streamevent) |

___

### StreamEvent

Ƭ **StreamEvent**: ``"next"`` \| ``"complete"``

___

### parseStreamData

▸ **parseStreamData**(`e`, `data`): [`StreamData`](common.md#streamdata)

#### Parameters

| Name | Type |
| :------ | :------ |
| `e` | [`StreamEvent`](common.md#streamevent) |
| `data` | `string` |

#### Returns

[`StreamData`](common.md#streamdata)

___

### validateStreamEvent

▸ **validateStreamEvent**(`e`): [`StreamEvent`](common.md#streamevent)

#### Parameters

| Name | Type |
| :------ | :------ |
| `e` | `unknown` |

#### Returns

[`StreamEvent`](common.md#streamevent)
