module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '\\.svg$': '<rootDir>/__mocks__/svgMock.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|immer|@reduxjs/toolkit|@react-native-async-storage|react-redux|@react-navigation|react-native-worklets|react-native-reanimated|react-native-modal|react-native-webview)/)',
  ],
};
