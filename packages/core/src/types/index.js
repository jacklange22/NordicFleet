// Re-export every type module's runtime exports (the @typedef JSDoc lives
// in the source files themselves and is consumed by the JSDoc-aware
// editors / lint pipeline).

const ski = require('./ski');
const wax = require('./wax');
const coachRequest = require('./coachRequest');
// profile, waxLog, testLog, message export no runtime values — they exist
// purely for the @typedef JSDoc.
require('./profile');
require('./waxLog');
require('./testLog');
require('./message');

module.exports = {
  ...ski,
  ...wax,
  ...coachRequest,
};
