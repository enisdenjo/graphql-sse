/**
 * @type {import('jest').Config}
 */
const opts = {
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js'],
  extensionsToTreatAsEsm: ['.ts'],
  testPathIgnorePatterns: [
    '/__tests__/jest.d.ts', // augments some jest types
    '/node_modules/',
    '/fixtures/',
    '/utils/',
  ],
};
module.exports = opts;
