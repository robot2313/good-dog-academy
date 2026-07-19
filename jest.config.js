module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/tests/**/*.test.ts', '**/tests/**/*.test.tsx'],
  setupFiles: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: ['src/domain/validation/**/*.ts', 'src/storage/AsyncStorageRepository.ts'],
};
