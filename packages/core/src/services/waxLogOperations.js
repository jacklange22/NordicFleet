const {validateWaxLogInput} = require('../validation/waxLog');

/**
 * Build the doc payload for a new wax log. Platform layer attaches the
 * date / createdAt server timestamps.
 *
 * For skate skis, the platform layer is expected to null out kick fields
 * after calling this (we don't know the ski's technique inside core).
 *
 * @param {import('../types/waxLog').WaxLogInput} input
 */
function buildWaxLogCreatePayload(input) {
  return validateWaxLogInput(input);
}

module.exports = {buildWaxLogCreatePayload};
