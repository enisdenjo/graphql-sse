# Interface: StreamMessage<ForID, E\>

[common](/docs/modules/common).StreamMessage

Represents a message in an event stream.

Read more: https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#Event_stream_format

## Type parameters

| Name | Type |
| :------ | :------ |
| `ForID` | extends `boolean` |
| `E` | extends [`StreamEvent`](/docs/modules/common.md#streamevent) |

## Properties

### data

• **data**: `ForID` extends ``true`` ? [`StreamDataForID`](/docs/modules/common.md#streamdataforid)<`E`\> : [`StreamData`](/docs/modules/common.md#streamdata)<`E`\>

___

### event

• **event**: `E`
