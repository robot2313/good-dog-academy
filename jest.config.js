module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/tests/**/*.test.ts'],
  collectCoverageFrom: ['src/domain/validation/**/*.ts', 'src/storage/AsyncStorageRepository.ts'],
};
