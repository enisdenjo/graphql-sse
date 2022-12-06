[graphql-sse](../README.md) / Request

# Interface: Request<Raw, Context\>

Server agnostic request interface containing the raw request
which is server dependant.

## Type parameters

| Name | Type |
| :------ | :------ |
| `Raw` | `unknown` |
| `Context` | `unknown` |

## Table of contents

### Properties

- [body](Request.md#body)
- [context](Request.md#context)
- [headers](Request.md#headers)
- [method](Request.md#method)
- [raw](Request.md#raw)
- [url](Request.md#url)

## Properties

### body

• `Readonly` **body**: ``null`` \| `string` \| `Record`<`PropertyKey`, `unknown`\> \| () => ``null`` \| `string` \| `Record`<`PropertyKey`, `unknown`\> \| `Promise`<``null`` \| `string` \| `Record`<`PropertyKey`, `unknown`\>\>

Parsed request body or a parser function.

If the provided function throws, the error message "Unparsable JSON body" will
be in the erroneous response.

___

### context

• **context**: `Context`

Context value about the incoming request, you're free to pass any information here.

Intentionally not readonly because you're free to mutate it whenever you want.

___

### headers

• `Readonly` **headers**: [`RequestHeaders`](../README.md#requestheaders)

___

### method

• `Readonly` **method**: `string`

___

### raw

• `Readonly` **raw**: `Raw`

The raw request itself from the implementing server.

___

### url

• `Readonly` **url**: `string`
