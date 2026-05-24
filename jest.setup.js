// Mocks loaded before every test.

jest.mock('@react-native-firebase/app', () => ({}));
jest.mock('@react-native-firebase/analytics', () => () => ({
  logEvent: jest.fn(),
}));
jest.mock('@react-native-firebase/auth', () =>
  require('./__mocks__/@react-native-firebase/auth'),
);
jest.mock('@react-native-firebase/firestore', () =>
  require('./__mocks__/@react-native-firebase/firestore'),
);
jest.mock('@react-native-async-storage/async-storage', () =>
  require('./__mocks__/@react-native-async-storage/async-storage'),
);

// react-native-gesture-handler — needed for stack navigator on iOS.
jest.mock('react-native-gesture-handler', () => {
  return {
    GestureHandlerRootView: ({children}) => children,
    PanGestureHandler: ({children}) => children,
    TapGestureHandler: ({children}) => children,
    State: {},
    Directions: {},
  };
});

// Silence noisy reanimated warning.
jest.mock('react-native-reanimated', () => {
  try {
    return require('react-native-reanimated/mock');
  } catch (e) {
    return {};
  }
});
