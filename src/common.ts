/**
 *
 * common
 *
 */

import type { DocumentNode, GraphQLError } from 'graphql';
import { isObject } from './utils';

/**
 * Header key through which the event stream token is transmitted
 * when using the client in "single connection mode".
 *
 * Read more: https://github.com/enisdenjo/graphql-sse/blob/master/PROTOCOL.md#single-connection-mode
 *
 * @category Common
 */
export const TOKEN_HEADER_KEY = 'x-graphql-event-stream-token' as const;

/**
 * URL query parameter key through which the event stream token is transmitted
 * when using the client in "single connection mode".
 *
 * Read more: https://github.com/enisdenjo/graphql-sse/blob/master/PROTOCOL.md#single-connection-mode
 *
 * @category Common
 */
export const TOKEN_QUERY_KEY = 'token' as const;

/**
 * Parameters for GraphQL's request for execution.
 *
 * Reference: https://github.com/graphql/graphql-over-http/blob/main/spec/GraphQLOverHTTP.md#request
 *
 * @category Common
 */
export interface RequestParams {
  operationName?: string | undefined;
  query: DocumentNode | string;
  variables?: Record<string, unknown> | undefined;
  extensions?: Record<string, unknown> | undefined;
}

/**
 * Represents a message in an event stream.
 *
 * Read more: https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#Event_stream_format
 *
 * @category Common
 */
export interface StreamMessage<ForID extends boolean, E extends StreamEvent> {
  // id?: string; might be used in future releases for connection recovery
  event: E;
  data: ForID extends true ? StreamDataForID<E> : StreamData<E>;
  // retry?: number; ignored since graphql-sse implements custom retry strategies
}

/** @category Common */
export type StreamEvent = 'next' | 'complete';

/** @category Common */
export function validateStreamEvent(e: unknown): StreamEvent {
  e = e as StreamEvent;
  if (e !== 'next' && e !== 'complete')
    throw new Error(`Invalid stream event "${e}"`);
  return e;
}

/** @category Common */
export function print<ForID extends boolean, E extends StreamEvent>(
  msg: StreamMessage<ForID, E>,
): string {
  let str = `event: ${msg.event}`;
  if (msg.data) str += `\ndata: ${JSON.stringify(msg.data)}`;
  str += '\n\n';
  return str;
}

/** @category Common */
export interface ExecutionResult<
  Data = Record<string, unknown>,
  Extensions = Record<string, unknown>,
> {
  errors?: ReadonlyArray<GraphQLError>;
  data?: Data | null;
  hasNext?: boolean;
  extensions?: Extensions;
}

/** @category Common */
export interface ExecutionPatchResult<
  Data = unknown,
  Extensions = Record<string, unknown>,
> {
  errors?: ReadonlyArray<GraphQLError>;
  data?: Data | null;
  path?: ReadonlyArray<string | number>;
  label?: string;
  hasNext: boolean;
  extensions?: Extensions;
}

/** @category Common */
export type StreamData<E extends StreamEvent> = E extends 'next'
  ? ExecutionResult | ExecutionPatchResult
  : E extends 'complete'
  ? null
  : never;

/** @category Common */
export type StreamDataForID<E extends StreamEvent> = E extends 'next'
  ? { id: string; payload: ExecutionResult | ExecutionPatchResult }
  : E extends 'complete'
  ? { id: string }
  : never;

/** @category Common */
export function parseStreamData<ForID extends boolean, E extends StreamEvent>(
  e: E,
  data: string,
) {
  if (data) {
    try {
      data = JSON.parse(data);
    } catch {
      throw new Error('Invalid stream data');
    }
  }

  if (e === 'next' && !data)
    throw new Error('Stream data must be an object for "next" events');

  return (data || null) as ForID extends true
    ? StreamDataForID<E>
    : StreamData<E>;
}

/**
 * A representation of any set of values over any amount of time.
 *
 * @category Common
 */
export interface Sink<T = unknown> {
  /** Next value arriving. */
  next(value: T): void;
  /** An error that has occured. This function "closes" the sink. */
  error(error: unknown): void;
  /** The sink has completed. This function "closes" the sink. */
  complete(): void;
}

/**
 * Checkes whether the provided value is an async iterable.
 *
 * @category Common
 */
export function isAsyncIterable<T>(val: unknown): val is AsyncIterable<T> {
  return typeof Object(val)[Symbol.asyncIterator] === 'function';
}

/**
 * Checkes whether the provided value is an async generator.
 *
 * @category Common
 */
export function isAsyncGenerator<T>(val: unknown): val is AsyncGenerator<T> {
  return (
    isObject(val) &&
    typeof Object(val)[Symbol.asyncIterator] === 'function' &&
    typeof val.return === 'function' &&
    typeof val.throw === 'function' &&
    typeof val.next === 'function'
  );
}
