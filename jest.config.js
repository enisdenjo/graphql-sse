/**
 * @type {import('jest').Config}
 */
const opts = {
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js'],
  extensionsToTreatAsEsm: ['.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/fixtures/', '/utils/'],
};
module.exports = opts;
