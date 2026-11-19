---
title: "Interface: StreamMessage (common)"
sidebarTitle: "common.StreamMessage"
description: "StreamMessage (graphql-sse/common): Represents a message in an event stream."
---
Represents a message in an event stream.

Read more: https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#Event_stream_format

## Type parameters

| Name | Type |
| :------ | :------ |
| `ForID` | extends `boolean` |
| `E` | extends [`StreamEvent`](/docs/modules/common#streamevent) |

## Properties

### data

• **data**: `ForID` extends ``true`` ? [`StreamDataForID`](/docs/modules/common#streamdataforid)\<`E`\> : [`StreamData`](/docs/modules/common#streamdata)\<`E`\>

#### Defined in

[src/common.ts:54](https://github.com/enisdenjo/graphql-sse/blob/master/src/common.ts#L54)

___

### event

• **event**: `E`

#### Defined in

[src/common.ts:53](https://github.com/enisdenjo/graphql-sse/blob/master/src/common.ts#L53)
