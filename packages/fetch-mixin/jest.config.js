/** @typedef {import('ts-jest')} */
/** @type {import('@jest/types').Config.InitialOptions} */

module.exports = {
  preset: 'ts-jest/presets/default',
  testMatch: ['**/*.test.ts'],
  testEnvironment: 'node'
};
