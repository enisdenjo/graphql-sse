---
title: "Interface: ExecutionResult (common)"
sidebarTitle: "common.ExecutionResult"
description: "ExecutionResult, exported by graphql-sse/common."
---
## Type parameters

| Name | Type |
| :------ | :------ |
| `Data` | `Record`\<`string`, `unknown`\> |
| `Extensions` | `Record`\<`string`, `unknown`\> |

## Properties

### data

• `Optional` **data**: ``null`` \| `Data`

#### Defined in

[src/common.ts:88](https://github.com/enisdenjo/graphql-sse/blob/master/src/common.ts#L88)

___

### errors

• `Optional` **errors**: readonly `GraphQLError`[]

#### Defined in

[src/common.ts:87](https://github.com/enisdenjo/graphql-sse/blob/master/src/common.ts#L87)

___

### extensions

• `Optional` **extensions**: `Extensions`

#### Defined in

[src/common.ts:90](https://github.com/enisdenjo/graphql-sse/blob/master/src/common.ts#L90)

___

### hasNext

• `Optional` **hasNext**: `boolean`

#### Defined in

[src/common.ts:89](https://github.com/enisdenjo/graphql-sse/blob/master/src/common.ts#L89)
