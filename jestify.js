const { promises: { readdir, writeFile } } = require('fs');

const config = `/** @typedef {import('ts-jest')} */
/** @type {import('@jest/types').Config.InitialOptions} */

module.exports = {
  preset: 'ts-jest/presets/default',
  testMatch: ['**/*.test.ts'],
  testEnvironment: 'node'
};
`;

readdir('packages').then(async p => {
  for (const dir of p) {
    await writeFile(`packages/${dir}/jest.config.js`, config);
  }
})