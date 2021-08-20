/**
 *
 * common
 *
 */

import type { DocumentNode, ExecutionResult } from 'graphql';

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
export interface StreamMessage<
  ForID extends boolean = false,
  E extends StreamEvent = StreamEvent,
> {
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
export type StreamData<E extends StreamEvent = StreamEvent> = E extends 'next'
  ? ExecutionResult
  : E extends 'complete'
  ? null
  : never;

/** @category Common */
export type StreamDataForID<E extends StreamEvent = StreamEvent> =
  E extends 'next'
    ? { id: string; payload: ExecutionResult }
    : E extends 'complete'
    ? { id: string }
    : never;

/** @category Common */
export function parseStreamData(e: StreamEvent, data: string): StreamData {
  if (data) {
    try {
      data = JSON.parse(data);
    } catch {
      throw new Error('Invalid stream data');
    }
  }

  if (e === 'next' && !data)
    throw new Error('Stream data must be an object for "next" events');

  return (data || null) as StreamData;
}

/**
 * A representation of any set of values over any amount of time.
 *
 * @category Common
 */
export interface Sink<T = unknown> {
  /** Next value arriving. */
  next(value: T): void;
  /**
   * An error that has occured. Calling this function "closes" the sink.
   * Besides the errors being `Error` and `readonly GraphQLError[]`, it
   * can also be a `CloseEvent`, but to avoid bundling DOM typings because
   * the client can run in Node env too, you should assert the close event
   * type during implementation.
   */
  error(error: unknown): void;
  /** The sink has completed. This function "closes" the sink. */
  complete(): void;
}
