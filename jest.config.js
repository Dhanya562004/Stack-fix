module.exports = {
  testEnvironment: 'node',
  verbose: true,
  coverageDirectory: './coverage',
  collectCoverageFrom: [
    'backend/src/**/*.js',
    '!backend/src/server.js'
  ],
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  testTimeout: 10000
};
