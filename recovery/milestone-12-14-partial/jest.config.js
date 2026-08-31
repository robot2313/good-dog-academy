module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/tests/**/*.test.ts', '**/tests/**/*.test.tsx'],
  setupFiles: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: ['src/domain/validation/**/*.ts', 'src/storage/AsyncStorageRepository.ts'],
  // React Native Testing Library's automatic cleanup awaits `flushMicroTasks()`,
  // which resolves through `setImmediate`. If Jest's fake timers own
  // `setImmediate`, nothing advances that clock while the cleanup hook runs, so
  // the hook hangs and Jest reports "Exceeded timeout of 5000 ms for a hook"
  // against whichever test happened to be mounted. Leaving `setImmediate` real
  // keeps every `jest.useFakeTimers()` call in the suite deterministic while
  // still faking `setTimeout`, `setInterval`, and `Date`.
  fakeTimers: { doNotFake: ['setImmediate'] },
};
