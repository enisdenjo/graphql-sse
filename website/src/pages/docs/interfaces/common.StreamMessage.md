[graphql-sse](../README.md) / [common](../modules/common.md) / StreamMessage

# Interface: StreamMessage<ForID, E\>

[common](../modules/common.md).StreamMessage

Represents a message in an event stream.

Read more: https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#Event_stream_format

## Type parameters

| Name | Type |
| :------ | :------ |
| `ForID` | extends `boolean` |
| `E` | extends [`StreamEvent`](../modules/common.md#streamevent) |

## Table of contents

### Properties

- [data](common.StreamMessage.md#data)
- [event](common.StreamMessage.md#event)

## Properties

### data

• **data**: `ForID` extends ``true`` ? [`StreamDataForID`](../modules/common.md#streamdataforid)<`E`\> : [`StreamData`](../modules/common.md#streamdata)<`E`\>

___

### event

• **event**: `E`
