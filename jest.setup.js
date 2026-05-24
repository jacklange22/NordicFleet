/* eslint-env jest */
// Mocks loaded before every test.
//
// Modules with a file in `__mocks__/` adjacent to the project root are
// picked up automatically when we call jest.mock() with no factory.

jest.mock('@react-native-firebase/app', () => ({}));
jest.mock('@react-native-firebase/analytics', () => () => ({
  logEvent: jest.fn(),
}));
jest.mock('@react-native-firebase/auth', () =>
  jest.requireActual('./__mocks__/@react-native-firebase/auth'),
);
jest.mock('@react-native-firebase/firestore', () =>
  jest.requireActual('./__mocks__/@react-native-firebase/firestore'),
);
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('./__mocks__/@react-native-async-storage/async-storage'),
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
