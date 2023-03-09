# Interface: Sink<T\>

[common](/docs/modules/common).Sink

A representation of any set of values over any amount of time.

## Type parameters

| Name | Type |
| :------ | :------ |
| `T` | `unknown` |

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
