// Minimal mock for react-native-view-shot. captureRef resolves to a
// file:// URI in tests so callers can pass it to a downstream share API.
const captureRef = jest.fn((ref, options) => {
  const ext = (options && options.format) || 'png';
  return Promise.resolve(`file:///tmp/test-snapshot.${ext}`);
});

module.exports = {
  captureRef,
  __reset() {
    captureRef.mockReset();
    captureRef.mockImplementation((ref, options) => {
      const ext = (options && options.format) || 'png';
      return Promise.resolve(`file:///tmp/test-snapshot.${ext}`);
    });
  },
};
