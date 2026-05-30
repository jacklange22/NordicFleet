// Standalone jest config for the Firestore rules tests. Run via the emulator
// with: npm run test:rules  (which wraps this in `firebase emulators:exec`).
module.exports = {
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['**/*.test.js'],
  testTimeout: 20000,
};
