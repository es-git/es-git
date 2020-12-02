/** @typedef {import('ts-jest')} */
/** @type {import('@jest/types').Config.InitialOptions} */

module.exports = {
  projects: ['packages/*'],
  preset: 'ts-jest/presets/default',
  testMatch: ['**/*.test.ts'],
  reporters: ["default"],
  testEnvironment: 'node'
};
