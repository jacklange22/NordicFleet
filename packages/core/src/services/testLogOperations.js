const {validateTestLogInput} = require('../validation/testLog');

/**
 * Build the doc payload for a new test log. Platform layer attaches the
 * date / createdAt server timestamps.
 *
 * For skate skis, the platform layer is expected to null out kickRating
 * + kickWax after calling this. For classic skis, it nulls
 * stabilityRating + climbingRating. (Core stays platform-agnostic; it
 * can't read the ski's technique here.)
 *
 * @param {import('../types/testLog').TestLogInput} input
 */
function buildTestLogCreatePayload(input) {
  return validateTestLogInput(input);
}

module.exports = {buildTestLogCreatePayload};
