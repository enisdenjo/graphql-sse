---
title: "Interface: ResponseInit (handler)"
sidebarTitle: "handler.ResponseInit"
description: "ResponseInit (graphql-sse/handler): Server agnostic response options (ex. status and headers) returned from"
---
Server agnostic response options (ex. status and headers) returned from
`graphql-sse` needing to be coerced to the server implementation in use.

## Properties

### headers

• `Optional` `Readonly` **headers**: [`ResponseHeaders`](/docs/modules/handler#responseheaders)

#### Defined in

[src/handler.ts:106](https://github.com/enisdenjo/graphql-sse/blob/master/src/handler.ts#L106)

___

### status

• `Readonly` **status**: `number`

#### Defined in

[src/handler.ts:104](https://github.com/enisdenjo/graphql-sse/blob/master/src/handler.ts#L104)

___

### statusText

• `Readonly` **statusText**: `string`

#### Defined in

[src/handler.ts:105](https://github.com/enisdenjo/graphql-sse/blob/master/src/handler.ts#L105)
