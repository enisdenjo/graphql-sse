[graphql-sse](../README.md) / StreamMessage

# Interface: StreamMessage<ForID, E\>

Represents a message in an event stream.

Read more: https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#Event_stream_format

## Type parameters

| Name | Type |
| :------ | :------ |
| `ForID` | extends `boolean```false`` |
| `E` | extends [`StreamEvent`](../README.md#streamevent)[`StreamEvent`](../README.md#streamevent) |

## Table of contents

### Properties

- [data](StreamMessage.md#data)
- [event](StreamMessage.md#event)

## Properties

### data

• **data**: `ForID` extends ``true`` ? [`StreamDataForID`](../README.md#streamdataforid)<`E`\> : [`StreamData`](../README.md#streamdata)<`E`\>

___

### event

• **event**: `E`
