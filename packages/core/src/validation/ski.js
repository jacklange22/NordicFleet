const {SKI_TECHNIQUES, SKI_TYPES} = require('../types/ski');

/**
 * Validate a Ski input payload before writing to Firestore.
 *
 * Throws on the first hard failure (the mobile / web layer maps the error
 * back into an inline form message). Returns the normalized input so the
 * caller can use it directly.
 *
 * Required: name, technique, type.
 * Numeric (length, flex): may be string or number; empty string → null.
 *
 * @param {import('../types/ski').SkiInput} input
 * @returns {Object} normalized payload (no Firestore-specific fields)
 */
function validateSkiInput(input) {
  if (!input || typeof input !== 'object') {
    throw new Error('Ski input is required');
  }
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  if (!name) {
    throw new Error('Ski name is required');
  }
  const technique = (input.technique || '').toLowerCase();
  if (!SKI_TECHNIQUES.includes(technique)) {
    throw new Error(
      `Technique must be one of: ${SKI_TECHNIQUES.join(', ')}`,
    );
  }
  const type = (input.type || '').toLowerCase();
  if (!SKI_TYPES.includes(type)) {
    throw new Error(`Type must be one of: ${SKI_TYPES.join(', ')}`);
  }

  const length = parseNullableNumber(input.length, 'Length');
  const flex = parseNullableNumber(input.flex, 'Flex');
  const year =
    input.year === undefined || input.year === null || input.year === ''
      ? null
      : Number(input.year);
  if (year !== null && (!Number.isFinite(year) || year < 1900 || year > 2100)) {
    throw new Error('Year is out of range');
  }

  return {
    name,
    brand: typeof input.brand === 'string' ? input.brand.trim() : '',
    model: typeof input.model === 'string' ? input.model.trim() : '',
    technique,
    type,
    build: typeof input.build === 'string' ? input.build.trim() : '',
    base: typeof input.base === 'string' ? input.base.trim() : '',
    grind: typeof input.grind === 'string' ? input.grind.trim() : '',
    length,
    flex,
    year,
    notes: typeof input.notes === 'string' ? input.notes : '',
    retired: !!input.retired,
    seedId: input.seedId || null,
  };
}

function parseNullableNumber(raw, label) {
  if (raw === undefined || raw === null || raw === '') {
    return null;
  }
  const n = Number(raw);
  if (!Number.isFinite(n)) {
    throw new Error(`${label} must be a number`);
  }
  return n;
}

module.exports = {validateSkiInput};
