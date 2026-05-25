// Jest mock for @react-native-community/geolocation. Default behavior is
// "denied / unavailable" so the tested code paths fall through to the
// null-location branch.
//
// Tests that need a real position can override the mock via
// jest.doMock or by re-assigning getCurrentPosition before invoking
// the code under test.

const getCurrentPosition = jest.fn((success, error) => {
  // Default: invoke the error callback with a fake "denied" payload.
  if (typeof error === 'function') {
    error({code: 1, message: 'Permission denied'});
  }
});

module.exports = {
  getCurrentPosition,
  watchPosition: jest.fn(() => 0),
  clearWatch: jest.fn(),
  stopObserving: jest.fn(),
  requestAuthorization: jest.fn(),
  setRNConfiguration: jest.fn(),
  default: {getCurrentPosition},
};
