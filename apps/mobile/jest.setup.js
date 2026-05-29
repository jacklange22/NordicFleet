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

// Make Animated.timing synchronous under Jest.
//
// The shared Input's floating label animates on mount/focus via
// Animated.timing(...).start(). Its value updates fire asynchronously
// (rAF), landing OUTSIDE React's act() window, which produced dozens of
// "An update to Animated(Text) ... was not wrapped in act(...)" warnings
// across every screen test that renders an Input. Snapping the value
// straight to its target synchronously keeps the update inside the
// render/act window, so the warnings disappear without changing what the
// component renders. This affects ONLY the Jest environment — the real
// Animated.timing (production animation behavior) is untouched.
const RNAnimated = require('react-native').Animated;
RNAnimated.timing = (value, config) => ({
  start: callback => {
    if (
      config &&
      config.toValue !== undefined &&
      value &&
      typeof value.setValue === 'function'
    ) {
      value.setValue(config.toValue);
    }
    if (typeof callback === 'function') {
      callback({finished: true});
    }
  },
  stop: () => {},
  reset: () => {},
});
