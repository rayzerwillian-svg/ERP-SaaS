module.exports = {
  roots: ['<rootDir>/src'],
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.json',
      diagnostics: false
    }
  },
  moduleNameMapper: {
    '^@erp-saas/db$': '<rootDir>/../../packages/db/src/index.ts',
    '^@erp-saas/db/(.*)$': '<rootDir>/../../packages/db/src/$1',
    '^@erp-saas/ai$': '<rootDir>/../../packages/ai/src/index.ts',
    '^@erp-saas/ai/(.*)$': '<rootDir>/../../packages/ai/src/$1'
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverage: false
};
