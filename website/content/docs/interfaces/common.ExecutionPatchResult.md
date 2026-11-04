---
title: "Interface: ExecutionPatchResult (common)"
sidebarTitle: "common.ExecutionPatchResult"
description: "ExecutionPatchResult, exported by graphql-sse/common."
---
## Type parameters

| Name | Type |
| :------ | :------ |
| `Data` | `unknown` |
| `Extensions` | `Record`\<`string`, `unknown`\> |

## Properties

### data

• `Optional` **data**: ``null`` \| `Data`

#### Defined in

[src/common.ts:99](https://github.com/enisdenjo/graphql-sse/blob/master/src/common.ts#L99)

___

### errors

• `Optional` **errors**: readonly `GraphQLError`[]

#### Defined in

[src/common.ts:98](https://github.com/enisdenjo/graphql-sse/blob/master/src/common.ts#L98)

___

### extensions

• `Optional` **extensions**: `Extensions`

#### Defined in

[src/common.ts:103](https://github.com/enisdenjo/graphql-sse/blob/master/src/common.ts#L103)

___

### hasNext

• **hasNext**: `boolean`

#### Defined in

[src/common.ts:102](https://github.com/enisdenjo/graphql-sse/blob/master/src/common.ts#L102)

___

### label

• `Optional` **label**: `string`

#### Defined in

[src/common.ts:101](https://github.com/enisdenjo/graphql-sse/blob/master/src/common.ts#L101)

___

### path

• `Optional` **path**: readonly (`string` \| `number`)[]

#### Defined in

[src/common.ts:100](https://github.com/enisdenjo/graphql-sse/blob/master/src/common.ts#L100)
