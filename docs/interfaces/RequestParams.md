[graphql-sse](../README.md) / RequestParams

# Interface: RequestParams

Parameters for GraphQL's request for execution.

Reference: https://github.com/graphql/graphql-over-http/blob/main/spec/GraphQLOverHTTP.md#request

## Table of contents

### Properties

- [extensions](RequestParams.md#extensions)
- [operationName](RequestParams.md#operationname)
- [query](RequestParams.md#query)
- [variables](RequestParams.md#variables)

## Properties

### extensions

• `Optional` **extensions**: `Record`<`string`, `unknown`\>

___

### operationName

• `Optional` **operationName**: `string`

___

### query

• **query**: `string` \| `DocumentNode`

___

### variables

• `Optional` **variables**: `Record`<`string`, `unknown`\>
