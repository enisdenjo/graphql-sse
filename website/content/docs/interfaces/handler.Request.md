---
title: "Interface: Request (handler)"
sidebarTitle: "handler.Request"
description: "Request (graphql-sse/handler): Server agnostic request interface containing the raw request"
---
Server agnostic request interface containing the raw request
which is server dependant.

## Type parameters

| Name | Type |
| :------ | :------ |
| `Raw` | `unknown` |
| `Context` | `unknown` |

## Properties

### body

• `Readonly` **body**: ``null`` \| `string` \| `Record`\<`PropertyKey`, `unknown`\> \| () => ``null`` \| `string` \| `Record`\<`PropertyKey`, `unknown`\> \| `Promise`\<``null`` \| `string` \| `Record`\<`PropertyKey`, `unknown`\>\>

Parsed request body or a parser function.

If the provided function throws, the error message "Unparsable JSON body" will
be in the erroneous response.

#### Defined in

[src/handler.ts:55](https://github.com/enisdenjo/graphql-sse/blob/master/src/handler.ts#L55)

___

### context

• **context**: `Context`

Context value about the incoming request, you're free to pass any information here.

Intentionally not readonly because you're free to mutate it whenever you want.

#### Defined in

[src/handler.ts:73](https://github.com/enisdenjo/graphql-sse/blob/master/src/handler.ts#L73)

___

### headers

• `Readonly` **headers**: [`RequestHeaders`](/docs/interfaces/handler.RequestHeaders)

#### Defined in

[src/handler.ts:48](https://github.com/enisdenjo/graphql-sse/blob/master/src/handler.ts#L48)

___

### method

• `Readonly` **method**: `string`

#### Defined in

[src/handler.ts:46](https://github.com/enisdenjo/graphql-sse/blob/master/src/handler.ts#L46)

___

### raw

• `Readonly` **raw**: `Raw`

The raw request itself from the implementing server.

#### Defined in

[src/handler.ts:67](https://github.com/enisdenjo/graphql-sse/blob/master/src/handler.ts#L67)

___

### url

• `Readonly` **url**: `string`

#### Defined in

[src/handler.ts:47](https://github.com/enisdenjo/graphql-sse/blob/master/src/handler.ts#L47)
