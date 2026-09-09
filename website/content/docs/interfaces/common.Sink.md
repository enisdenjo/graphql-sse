---
title: "Interface: Sink (common)"
sidebarTitle: "common.Sink"
description: "Sink (graphql-sse/common): A representation of any set of values over any amount of time."
---
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

#### Defined in

[src/common.ts:152](https://github.com/enisdenjo/graphql-sse/blob/master/src/common.ts#L152)

___

### error

▸ **error**(`error`): `void`

An error that has occurred. This function "closes" the sink.

#### Parameters

| Name | Type |
| :------ | :------ |
| `error` | `unknown` |

#### Returns

`void`

#### Defined in

[src/common.ts:150](https://github.com/enisdenjo/graphql-sse/blob/master/src/common.ts#L150)

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

#### Defined in

[src/common.ts:148](https://github.com/enisdenjo/graphql-sse/blob/master/src/common.ts#L148)
