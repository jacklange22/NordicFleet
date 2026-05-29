// Service-layer payload builders. Phase A3 fills these in by extracting
// the validation + shaping out of the mobile services (skiOperations,
// waxLogOperations, testLogOperations, coachOperations, etc.).
//
// Each module exports pure functions that:
//   - validate input via validation/*
//   - return a normalized payload (or a list of operations)
//   - never call Firestore or any platform API
//
// The mobile + web service implementations are thin wrappers that take
// these payloads and hand them to their respective Firebase SDK.

module.exports = {
  ...require('./skiOperations'),
  ...require('./waxLogOperations'),
  ...require('./testLogOperations'),
  ...require('./coachOperations'),
  ...require('./messageOperations'),
  ...require('./advisoryOperations'),
  ...require('./profileOperations'),
  ...require('./waxTestOperations'),
  ...require('./dataExport'),
  ...require('./errorReport'),
  ...require('./analytics'),
};
