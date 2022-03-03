declare namespace jest {
  // jest-jasmine2 runner (see jest.config.js) allows done callback with promises
  type ProvidesCallback = (
    cb: DoneCallback,
  ) => void | undefined | Promise<unknown>;
}
