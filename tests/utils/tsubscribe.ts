import { ExecutionResult } from 'graphql';
import { EventEmitter } from 'events';
import { Client } from '../../src/client';
import { RequestParams } from '../../src/common';

interface TSubscribe<T> {
  waitForNext: () => Promise<ExecutionResult<T, unknown>>;
  waitForError: () => Promise<unknown>;
  throwOnError: () => Promise<void>;
  waitForComplete: () => Promise<void>;
  dispose: () => void;
}

export function tsubscribe<T = unknown>(
  client: Client,
  payload: RequestParams,
): TSubscribe<T> {
  const emitter = new EventEmitter();
  const results: ExecutionResult<T, unknown>[] = [];
  let error: unknown,
    completed = false;
  const dispose = client.subscribe<T>(payload, {
    next: (value) => {
      results.push(value);
      emitter.emit('next');
    },
    error: (err) => {
      error = err;
      emitter.emit('err');
      emitter.removeAllListeners();
    },
    complete: () => {
      completed = true;
      emitter.emit('complete');
      emitter.removeAllListeners();
    },
  });
  function waitForError() {
    return new Promise((resolve) => {
      function done() {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        resolve(error);
      }
      if (error) {
        done();
      } else {
        emitter.once('err', done);
      }
    });
  }
  return {
    waitForNext() {
      return new Promise((resolve) => {
        function done() {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          resolve(results.shift()!);
        }
        if (results.length) {
          done();
        } else {
          emitter.once('next', done);
        }
      });
    },
    waitForError,
    throwOnError: () =>
      waitForError().then((err) => {
        throw err;
      }),
    waitForComplete() {
      return new Promise((resolve) => {
        function done() {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          resolve();
        }
        if (completed) {
          done();
        } else {
          emitter.once('complete', done);
        }
      });
    },
    dispose,
  };
}
