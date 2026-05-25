const {validateSkiInput} = require('../validation/ski');

/**
 * Build the doc payload for a new ski. The platform layer adds
 * createdAt / updatedAt server timestamps.
 *
 * @param {import('../types/ski').SkiInput} input
 * @returns {Object} normalized payload
 */
function buildSkiCreatePayload(input) {
  return validateSkiInput(input);
}

/**
 * Build a partial-update payload (PATCH). Empty / missing fields are
 * skipped — only what the caller provided is normalized and returned.
 *
 * @param {Partial<import('../types/ski').SkiInput>} partial
 */
function buildSkiUpdatePayload(partial) {
  if (!partial || typeof partial !== 'object') {
    throw new Error('Ski update payload is required');
  }
  const out = {};
  if (partial.name !== undefined) {
    const trimmed =
      typeof partial.name === 'string' ? partial.name.trim() : '';
    if (!trimmed) {
      throw new Error('Ski name cannot be empty');
    }
    out.name = trimmed;
  }
  for (const key of ['brand', 'model', 'build', 'base', 'grind', 'notes']) {
    if (partial[key] !== undefined) {
      out[key] = typeof partial[key] === 'string' ? partial[key].trim() : '';
    }
  }
  if (partial.technique !== undefined) {
    out.technique = String(partial.technique).toLowerCase();
  }
  if (partial.type !== undefined) {
    out.type = String(partial.type).toLowerCase();
  }
  if (partial.length !== undefined) {
    out.length = parseNullable(partial.length, 'Length');
  }
  if (partial.flex !== undefined) {
    out.flex = parseNullable(partial.flex, 'Flex');
  }
  if (partial.year !== undefined) {
    const y = parseNullable(partial.year, 'Year');
    if (y !== null && (y < 1900 || y > 2100)) {
      throw new Error('Year is out of range');
    }
    out.year = y;
  }
  if (partial.retired !== undefined) {
    out.retired = !!partial.retired;
  }
  return out;
}

function parseNullable(raw, label) {
  if (raw === null || raw === '' || raw === undefined) {
    return null;
  }
  const n = Number(raw);
  if (!Number.isFinite(n)) {
    throw new Error(`${label} must be a number`);
  }
  return n;
}

module.exports = {buildSkiCreatePayload, buildSkiUpdatePayload};
