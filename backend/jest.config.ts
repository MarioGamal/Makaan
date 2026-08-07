import type { Config } from 'jest';

const config: Config = {
  clearMocks: true,
  collectCoverageFrom: ['src/**/*.ts', '!src/main.ts'],
  coverageDirectory: '<rootDir>/../coverage/backend',
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.spec.ts'],
  watchman: false,
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
};

export default config;
