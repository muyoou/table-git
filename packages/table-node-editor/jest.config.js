/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  moduleNameMapper: {
    '^@table-git/memory-engine$': '<rootDir>/../table-memory-engine/src',
    '^@table-git/memory-engine/(.*)$': '<rootDir>/../table-memory-engine/src/$1'
  },
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.json'
    }
  }
};
