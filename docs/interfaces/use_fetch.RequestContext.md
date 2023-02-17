[graphql-sse](../README.md) / [use/fetch](../modules/use_fetch.md) / RequestContext

# Interface: RequestContext

[use/fetch](../modules/use_fetch.md).RequestContext

## Table of contents

### Properties

- [ReadableStream](use_fetch.RequestContext.md#readablestream)
- [Response](use_fetch.RequestContext.md#response)
- [TextEncoder](use_fetch.RequestContext.md#textencoder)

## Properties

### ReadableStream

• **ReadableStream**: (`underlyingSource`: `UnderlyingByteSource`, `strategy?`: {}) => `ReadableStream`<`Uint8Array`\><R\>(`underlyingSource`: `UnderlyingDefaultSource`<`R`\>, `strategy?`: `QueuingStrategy`<`R`\>) => `ReadableStream`<`R`\><R\>(`underlyingSource?`: `UnderlyingSource`<`R`\>, `strategy?`: `QueuingStrategy`<`R`\>) => `ReadableStream`<`R`\>

#### Type declaration

• **new ReadableStream**(`underlyingSource`, `strategy?`): `ReadableStream`<`Uint8Array`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `underlyingSource` | `UnderlyingByteSource` |
| `strategy?` | `Object` |

##### Returns

`ReadableStream`<`Uint8Array`\>

• **new ReadableStream**<`R`\>(`underlyingSource`, `strategy?`): `ReadableStream`<`R`\>

##### Type parameters

| Name | Type |
| :------ | :------ |
| `R` | `any` |

##### Parameters

| Name | Type |
| :------ | :------ |
| `underlyingSource` | `UnderlyingDefaultSource`<`R`\> |
| `strategy?` | `QueuingStrategy`<`R`\> |

##### Returns

`ReadableStream`<`R`\>

• **new ReadableStream**<`R`\>(`underlyingSource?`, `strategy?`): `ReadableStream`<`R`\>

##### Type parameters

| Name | Type |
| :------ | :------ |
| `R` | `any` |

##### Parameters

| Name | Type |
| :------ | :------ |
| `underlyingSource?` | `UnderlyingSource`<`R`\> |
| `strategy?` | `QueuingStrategy`<`R`\> |

##### Returns

`ReadableStream`<`R`\>

___

### Response

• **Response**: (`body?`: ``null`` \| `BodyInit`, `init?`: `ResponseInit`) => `Response`

#### Type declaration

• **new Response**(`body?`, `init?`): `Response`

##### Parameters

| Name | Type |
| :------ | :------ |
| `body?` | ``null`` \| `BodyInit` |
| `init?` | `ResponseInit` |

##### Returns

`Response`

___

### TextEncoder

• **TextEncoder**: () => `TextEncoder`

#### Type declaration

• **new TextEncoder**(): `TextEncoder`

##### Returns

`TextEncoder`
