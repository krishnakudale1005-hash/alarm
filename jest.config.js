module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.(js|jsx)$': ['babel-jest', { configFile: './babel.config.jest.js' }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|react-navigation|@react-navigation/.*|@unimodules/.*|native-base|react-native-svg)',
  ],
  moduleNameMapper: {
    '^expo-sqlite$': '<rootDir>/__mocks__/expo-sqlite.js',
    '^expo-file-system$': '<rootDir>/__mocks__/expo-file-system.js',
    '^expo-task-manager$': '<rootDir>/__mocks__/expo-task-manager.js',
    '^expo-background-fetch$': '<rootDir>/__mocks__/expo-background-fetch.js',
    '^expo-notifications$': '<rootDir>/__mocks__/expo-notifications.js',
    '^@react-native-async-storage/async-storage$': '<rootDir>/__mocks__/async-storage.js',
    '^react-native$': '<rootDir>/__mocks__/react-native.js',
    '^@testing-library/react-native$': '<rootDir>/__mocks__/testing-library.js',
    '\\.(mp3|wav|png|jpg|jpeg|gif|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
  setupFiles: ['<rootDir>/__mocks__/setup.js'],
  testMatch: [
    '**/__tests__/**/*.test.js',
  ],
  collectCoverageFrom: [
    'src/services/*.js',
    'src/utils/*.js',
  ],
  coverageThreshold: {
    global: {
      functions: 70,
      lines: 70,
    },
  },
  forceExit: true,
};
