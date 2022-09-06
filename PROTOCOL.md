# GraphQL over Server-Sent Events Protocol

## Introduction

We live in a connected world where real-time needs are ever-growing. Especially in the world's most connected "world", the internet. When talking about real-time, there are two main players in the game: [WebSockets](https://datatracker.ietf.org/doc/html/rfc6455) and [Server-Sent Events](https://html.spec.whatwg.org/multipage/server-sent-events.html).

Using Server-Sent Events (abbr. SSE) for your next real-time driven endeavour sounds appealing because of many reasons spanning from simplicity to acceptance. However, you're soon to find out that SSE suffers from a limitation to the maximum number of open connections when dealing with HTTP/1 powered servers (more details below).

This documents aims to elevate HTTP/1 limitations through a "single connection mode" and back up HTTP/2+ powered servers using the "distinct connections mode" with a unified GraphQL over SSE transport protocol.

## Distinct connections mode

Operation requests need to conform to the [GraphQL over HTTP spec](https://github.com/graphql/graphql-over-http/blob/main/spec/GraphQLOverHTTP.md), with two key observations:

1. The `Content-Type` MUST always be `text/event-stream` as per the [Server-Sent Events spec](https://www.w3.org/TR/eventsource/#text-event-stream).
1. Validation steps that run before execution of the GraphQL operation MUST report errors through an accepted SSE connection by emitting `next` events that contain the errors in the data field.
   <br>One reason being, the server should agree with the client's `Accept` header when deciding about the response's `Content-Type`.
   <br>Additionally, responding with a `400` (Bad Request) will cause the user agent to fail the connection. In some cases, like with the browser's native `EventSource`, the error event will hold no meaningful information helping to understand the validation issue(s).

Streaming operations, such as `subscriptions` or directives like `@stream` and `@defer`, are terminated/completed by having the client simply close the SSE connection.

The execution result is streamed through the established SSE connection.

### Event stream

To be interpreted as the event stream following the [Server-Sent Events spec](https://www.w3.org/TR/eventsource/#event-stream-interpretation).

#### `next` event

Operation execution result(s) from the source stream. After all results have been emitted, the `complete` event will follow indicating stream completion.

```typescript
import { ExecutionResult } from 'graphql';

interface NextMessage {
  event: 'next';
  data: ExecutionResult;
}
```

#### `complete` event

Indicates that the requested operation execution has completed.

```typescript
interface CompleteMessage {
  event: 'complete';
}
```

## Single connection mode

> When **not used over HTTP/2**, SSE suffers from a limitation to the maximum number of open connections, which can be specially painful when opening various tabs as the limit is per browser and set to a very low number (6). The issue has been marked as "Won't fix" in [Chrome](https://bugs.chromium.org/p/chromium/issues/detail?id=275955) and [Firefox](https://bugzilla.mozilla.org/show_bug.cgi?id=906896). This limit is per browser + domain, so that means that you can open 6 SSE connections across all of the tabs to `www.example1.com` and another 6 SSE connections to `www.example2.com`. (from [Stackoverflow](https://stackoverflow.com/a/5326159/1905229)). When using HTTP/2, the maximum number of simultaneous HTTP streams is negotiated between the server and the client (defaults to 100).

[Reference: WebAPIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)

Having aforementioned limitations in mind, a "single connection mode" is proposed. In this mode, a single established SSE connection transmits **all** results from the server while separate HTTP requests dictate the behaviour.

Additionally, due to various limitations with the browser's native [`EventSource` interface](https://developer.mozilla.org/en-US/docs/Web/API/EventSource), like the lack of supplying custom headers or vague connection error information, a "reservation" tactic is RECOMMENDED. This means that the client requests an SSE connection reservation from the server through a regular HTTP request which is later fulfiled with the actual SSE connection matching the reservation requirements.

### Making reservations

The client requests a reservation for an incoming SSE connection through a `PUT` HTTP request. Since this is a regular HTTP request, it may transmit authentication details however the implementor sees fit.

The server accepts the reservation request by responding with `201` (Created) and a reservation token in the body of the response. This token is then presented alongside the incoming SSE connection as an entrance ticket. If using the [`EventSource` interface](https://developer.mozilla.org/en-US/docs/Web/API/EventSource), the token may be encoded in the URL's search parameters.

The reservation token MUST accompany future HTTP requests to aid the server with the stream matching process. Token SHOULD be transmitted by the client through either:

- A header value `X-GraphQL-Event-Stream-Token`
- A search parameter `token`

For security reasons, **only one** SSE connection can fulfil a reservation at a time, there MUST never be multiple SSE connections behind a single reservation.

### Executing operations

While having a single SSE connection (or reservation), separate HTTP requests solicit GraphQL operations conforming to the [GraphQL over HTTP spec](https://github.com/graphql/graphql-over-http/blob/main/spec/GraphQLOverHTTP.md) with **only one difference**: successful responses (execution results) get accepted with a `202` (Accepted) and are then streamed through the single SSE connection. Validation issues and other request problems are handled as documented in the [GraphQL over HTTP spec](https://github.com/graphql/graphql-over-http/blob/main/spec/GraphQLOverHTTP.md).

Since the client holds the task of publishing the SSE messages to the relevant listeners through a single connection, an operation ID identifying the messages destinations is necessary. The unique operation ID SHOULD be sent through the `extensions` parameter of the GraphQL reqeust inside the `operationId` field. This operation ID accompanies the SSE messages for destination discovery (more details below).

The HTTP request MUST contain the matching reservation token.

### Stopping streaming operations

Streaming operations, such as `subscriptions` or directives like `@stream` and `@defer`, must have a termination/completion mechanism. This is done by sending a `DELETE` HTTP request encoding the unique operation ID inside the URL's search parameters behind the `operationId` key (ex. `DELETE: www.example.com/?operationId=<unique-operation-id>`).

The HTTP request MUST contain the matching reservation token.

### Event stream

To be interpreted as the event stream following the [Server-Sent Events spec](https://www.w3.org/TR/eventsource/#event-stream-interpretation).

#### `next` event

Operation execution result(s) from the source stream created by the binding GraphQL over HTTP request. After all results have been emitted, the `complete` event will follow indicating stream completion.

```typescript
import { ExecutionResult } from 'graphql';

interface NextMessage {
  event: 'next';
  data: {
    id: '<unique-operation-id>';
    payload: ExecutionResult;
  };
}
```

#### `complete` event

Indicates that the requested operation execution has completed.

```typescript
interface CompleteMessage {
  event: 'complete';
  data: {
    id: '<unique-operation-id>';
  };
}
```
