import { EventEmitter } from 'events';
import { HandlerOptions, OperationContext } from '../../handler';

export function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export type OnOpeartionArgs<
  RequestRaw = unknown,
  RequestContext = unknown,
  Context extends OperationContext = undefined,
> = Parameters<
  NonNullable<
    HandlerOptions<RequestRaw, RequestContext, Context>['onOperation']
  >
>;

export interface TestKit<
  RequestRaw = unknown,
  RequestContext = unknown,
  Context extends OperationContext = undefined,
> {
  waitForOperation(): Promise<
    OnOpeartionArgs<RequestRaw, RequestContext, Context>
  >;
}

export function injectTestKit<
  RequestRaw = unknown,
  RequestContext = unknown,
  Context extends OperationContext = undefined,
>(
  opts: Partial<HandlerOptions<RequestRaw, RequestContext, Context>> = {},
): TestKit<RequestRaw, RequestContext, Context> {
  const onOperation =
    queue<OnOpeartionArgs<RequestRaw, RequestContext, Context>>();
  const origOnOperation = opts.onOperation;
  opts.onOperation = async (...args) => {
    onOperation.add(args);
    return origOnOperation?.(...args);
  };

  return {
    waitForOperation() {
      return onOperation.next();
    },
  };
}

export function queue<T>(): {
  next(): Promise<T>;
  add(val: T): void;
} {
  const sy = Symbol();
  const emitter = new EventEmitter();
  const queue: T[] = [];
  return {
    async next() {
      while (queue.length) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- There will be something.
        return queue.shift()!;
      }
      return new Promise((resolve) => {
        emitter.once(sy, () => {
          resolve(
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- There will be something.
            queue.shift()!,
          );
        });
      });
    },
    add(val) {
      queue.push(val);
      emitter.emit(sy);
    },
  };
}
