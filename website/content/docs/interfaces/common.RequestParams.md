---
title: "Interface: RequestParams (common)"
sidebarTitle: "common.RequestParams"
description: "RequestParams (graphql-sse/common): Parameters for GraphQL's request for execution."
---
Parameters for GraphQL's request for execution.

Reference: https://github.com/graphql/graphql-over-http/blob/main/spec/GraphQLOverHTTP.md#request

## Properties

### extensions

• `Optional` **extensions**: `Record`\<`string`, `unknown`\>

#### Defined in

[src/common.ts:41](https://github.com/enisdenjo/graphql-sse/blob/master/src/common.ts#L41)

___

### operationName

• `Optional` **operationName**: `string`

#### Defined in

[src/common.ts:38](https://github.com/enisdenjo/graphql-sse/blob/master/src/common.ts#L38)

___

### query

• **query**: `string`

#### Defined in

[src/common.ts:39](https://github.com/enisdenjo/graphql-sse/blob/master/src/common.ts#L39)

___

### variables

• `Optional` **variables**: `Record`\<`string`, `unknown`\>

#### Defined in

[src/common.ts:40](https://github.com/enisdenjo/graphql-sse/blob/master/src/common.ts#L40)
