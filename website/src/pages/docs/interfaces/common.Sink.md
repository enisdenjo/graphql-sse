[graphql-sse](../README.md) / [common](../modules/common.md) / Sink

# Interface: Sink<T\>

[common](../modules/common.md).Sink

A representation of any set of values over any amount of time.

## Type parameters

| Name | Type |
| :------ | :------ |
| `T` | `unknown` |

## Table of contents

### Methods

- [complete](common.Sink.md#complete)
- [error](common.Sink.md#error)
- [next](common.Sink.md#next)

## Methods

### complete

▸ **complete**(): `void`

The sink has completed. This function "closes" the sink.

#### Returns

`void`

___

### error

▸ **error**(`error`): `void`

An error that has occured. This function "closes" the sink.

#### Parameters

| Name | Type |
| :------ | :------ |
| `error` | `unknown` |

#### Returns

`void`

___

### next

▸ **next**(`value`): `void`

Next value arriving.

#### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `T` |

#### Returns

`void`
