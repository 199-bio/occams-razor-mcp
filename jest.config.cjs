/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest/presets/default-esm', // Use ESM preset for NodeNext compatibility
  testEnvironment: 'node',
  moduleNameMapper: {
    // Handle module aliases (if you have them in tsconfig.json)
    // '^@/(.*)$': '<rootDir>/src/$1',

    // Needed for ESM support in Jest with ts-jest
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    // '^.+\\.[tj]sx?$' to process js/ts with `ts-jest`
    // '^.+\\.m?[tj]sx?$' to process js/ts/mjs/mts with `ts-jest`
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true, // Enable ESM support
      },
    ],
  },
  extensionsToTreatAsEsm: ['.ts'], // Treat .ts files as ESM
  // Optional: Specify test file patterns
  // testMatch: ['**/tests/**/*.test.ts'],
  // Optional: Collect coverage
  // collectCoverage: true,
  // coverageDirectory: "coverage",
  // coverageProvider: "v8",
};