// jest.config.cjs
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',

  // tests.tsx kökte + backend test files
  testMatch: ['**/tests.tsx', '**/*.test.ts'],

  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // setup dosyamız artık kökte olacak
  setupFilesAfterEnv: ['<rootDir>/setupTests.ts'],

  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
};
