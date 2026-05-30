// Per-brand "what does this sticker encode" descriptors.
//
// The brand-agnostic OCR parsing lives in stickerParser.js. THIS module
// is the brand-knowledge layer on top: for each brand we know about, it
// records which fields the sticker prints, the units used for flex and
// length, and any brand-specific flex/hardness CODES (e.g. Madshus
// F1..F4) that map to an approximate skier-weight bracket. The
// brand-specific refiners in stickerRegistry.js consume this, and the
// scan UI can use it to label fields.

const {slugifySkiModel} = require('../constants/skiModels');

// flexCodes map a brand's printed hardness CODE (lowercased, spaces
// stripped) to an approximate skier-weight midpoint in kg. These are
// estimates, so any flex decoded from a code is always 'low' confidence.
const STICKER_METRICS = {
  fischer: {
    brand: 'Fischer',
    fields: ['model', 'technique', 'type', 'length', 'flex', 'build', 'year'],
    flexUnit: 'kg',
    lengthUnit: 'cm',
    notes: 'Flex printed as a 2-3 digit kg value; build words like Plus / Med / Stiff.',
  },
  madshus: {
    brand: 'Madshus',
    fields: ['model', 'technique', 'type', 'length', 'flex', 'build', 'year'],
    flexUnit: 'code',
    flexCodes: {f1: 55, f2: 68, f3: 80, f4: 95},
    lengthUnit: 'cm',
    notes: 'Hardness printed as F1..F4 codes mapping to a skier-weight bracket.',
  },
  rossignol: {
    brand: 'Rossignol',
    fields: ['model', 'technique', 'type', 'length', 'flex', 'build', 'year'],
    flexUnit: 'kg',
    flexCodes: {c1: 55, c2: 68, c3: 80, s1: 60, s2: 75, s3: 90},
    lengthUnit: 'cm',
    notes: 'C/S codes for classic/skate hardness; sometimes a bare kg number too.',
  },
  salomon: {
    brand: 'Salomon',
    fields: ['model', 'technique', 'type', 'length', 'flex', 'build', 'year'],
    flexUnit: 'kg',
    lengthUnit: 'cm',
    notes: 'Length-dash-flex pairs like "186 - 80" are common.',
  },
  atomic: {
    brand: 'Atomic',
    fields: ['model', 'technique', 'type', 'length', 'flex', 'build', 'year'],
    flexUnit: 'kg',
    lengthUnit: 'cm',
    notes: 'Shares printing conventions with Salomon (same group).',
  },
};

const DEFAULT_STICKER_METRICS = {
  brand: null,
  fields: [
    'brand',
    'model',
    'technique',
    'type',
    'length',
    'flex',
    'build',
    'year',
  ],
  flexUnit: 'kg',
  lengthUnit: 'cm',
  notes: 'Generic sticker layout; no brand-specific flex coding known.',
};

/** Lowercase alnum key for a brand name ("One Way" -> "oneway"). */
function normalizeBrandKey(brand) {
  return slugifySkiModel(brand || '');
}

/** Descriptor for a brand, or the generic default when unknown. */
function getStickerMetrics(brand) {
  return STICKER_METRICS[normalizeBrandKey(brand)] || DEFAULT_STICKER_METRICS;
}

module.exports = {
  STICKER_METRICS,
  DEFAULT_STICKER_METRICS,
  normalizeBrandKey,
  getStickerMetrics,
};
