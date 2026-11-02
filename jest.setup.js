jest.mock('@react-native-clipboard/clipboard', () => ({
  getString: jest.fn().mockResolvedValue(''),
  setString: jest.fn(),
  hasString: jest.fn().mockResolvedValue(false),
}));
