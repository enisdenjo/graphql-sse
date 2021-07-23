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
  id: string;
  event: E;
  data: StreamData<E>;
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
  ? ExecutionResult | { id: string; payload: ExecutionResult }
  : E extends 'done'
  ? null | { id: string }
  : never;

/**
 * @category Common
 */
export function validateStreamData(e: unknown): StreamData {
  if (isObject(e)) throw new Error('Invalid stream data');
  // TODO-db-210723
  return e as StreamData;
}

/** @private */
export function isObject(val: unknown): val is Record<PropertyKey, unknown> {
  return typeof val === 'object' && val !== null;
}
