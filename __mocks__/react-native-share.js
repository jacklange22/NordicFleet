// Minimal mock for react-native-share. Tests just assert RNShare.open is
// called with the right URL/filename/type — we don't actually invoke a
// share sheet.
const open = jest.fn(() => Promise.resolve({success: true}));

const RNShare = {
  open,
  // Convenience for tests that need to override the resolved value.
  __reset() {
    open.mockReset();
    open.mockResolvedValue({success: true});
  },
};

module.exports = RNShare;
module.exports.default = RNShare;
