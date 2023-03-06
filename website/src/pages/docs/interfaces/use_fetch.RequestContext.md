# Interface: RequestContext

[use/fetch](/docs/modules/use_fetch).RequestContext

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
