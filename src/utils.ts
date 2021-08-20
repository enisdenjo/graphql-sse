/**
 *
 * utils
 *
 */

/** @private */
export function isObject(val: unknown): val is Record<PropertyKey, unknown> {
  return typeof val === 'object' && val !== null;
}
