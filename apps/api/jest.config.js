module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.spec.ts'],
  moduleNameMapper: {
    '^@learnix/validation$': '<rootDir>/../../packages/validation/src/index.ts',
    '^@learnix/db$': '<rootDir>/../../packages/db/src/index.ts',
  },
};
