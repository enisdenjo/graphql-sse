/**
 *
 * common
 *
 */

import type { DocumentNode, ExecutionResult } from 'graphql';

/**
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
export interface StreamMessage<E extends StreamEvent = StreamEvent> {
  // id: string; TODO-db-210816 use in future releases when connection recovery is implemented
  event: E;
  data: StreamData<E> | StreamDataForID<E>;
  // retry?: number; TODO-db-210726 decide if necessary for graphql-sse
}

/**
 * @category Common
 */
export type StreamEvent = 'value' | 'done'; // TODO-db-210726 decide if `err` event is necessary

/**
 * @category Common
 */
export function validateStreamEvent(e: unknown): StreamEvent {
  if (e !== 'value' && e !== 'done')
    throw new Error(`Invalid stream event "${e}"`);
  return e as StreamEvent;
}

/**
 * @category Common
 */
export type StreamData<E extends StreamEvent = StreamEvent> = E extends 'value'
  ? ExecutionResult
  : E extends 'done'
  ? null
  : never;

/**
 * @category Common
 */
export type StreamDataForID<E extends StreamEvent = StreamEvent> =
  E extends 'value'
    ? { id: string; payload: ExecutionResult }
    : E extends 'done'
    ? { id: string }
    : never;

/**
 * @category Common
 */
export function parseStreamData(e: StreamEvent, data: string): StreamData {
  if (data) {
    try {
      data = JSON.parse(data);
    } catch {
      throw new Error('Invalid stream data');
    }
  }

  if (e === 'value' && !data)
    throw new Error('Stream data must be an object for "value" events');

  return (data || null) as StreamData;
}

/** @private */
export function isObject(val: unknown): val is Record<PropertyKey, unknown> {
  return typeof val === 'object' && val !== null;
}
