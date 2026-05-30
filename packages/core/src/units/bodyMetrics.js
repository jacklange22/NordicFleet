// Body-metric unit conversions for athlete weight and height.
//
// Storage rule: weight is ALWAYS persisted in kilograms and height in
// centimetres. These helpers convert to/from the athlete's chosen
// display unit so the stored value stays canonical (metric) no matter
// how the athlete prefers to read it. Keep all unit-aware UI going
// through here so the conversion lives in exactly one place.

const KG_PER_LB = 0.45359237; // exact, by international definition
const CM_PER_IN = 2.54; // exact, by international definition

const WEIGHT_UNITS = ['kg', 'lb'];
const HEIGHT_UNITS = ['cm', 'in'];
const DEFAULT_WEIGHT_UNIT = 'kg';
const DEFAULT_HEIGHT_UNIT = 'cm';

function round(value, dp) {
  const f = Math.pow(10, dp);
  return Math.round(value * f) / f;
}

function isBlank(v) {
  return v === null || v === undefined || v === '';
}

/** Coerce an arbitrary stored value to a valid weight unit (default kg). */
function normalizeWeightUnit(unit) {
  return WEIGHT_UNITS.includes(unit) ? unit : DEFAULT_WEIGHT_UNIT;
}

/** Coerce an arbitrary stored value to a valid height unit (default cm). */
function normalizeHeightUnit(unit) {
  return HEIGHT_UNITS.includes(unit) ? unit : DEFAULT_HEIGHT_UNIT;
}

/** Stored kilograms → number shown in `unit` (1 dp), or null. */
function weightFromMetric(kg, unit) {
  if (isBlank(kg)) {
    return null;
  }
  const n = Number(kg);
  if (!Number.isFinite(n)) {
    return null;
  }
  return round(normalizeWeightUnit(unit) === 'lb' ? n / KG_PER_LB : n, 1);
}

/** Value entered in `unit` → kilograms to store (2 dp), or null. */
function weightToMetric(value, unit) {
  if (isBlank(value)) {
    return null;
  }
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return null;
  }
  return round(normalizeWeightUnit(unit) === 'lb' ? n * KG_PER_LB : n, 2);
}

/** Stored centimetres → number shown in `unit` (1 dp), or null. */
function heightFromMetric(cm, unit) {
  if (isBlank(cm)) {
    return null;
  }
  const n = Number(cm);
  if (!Number.isFinite(n)) {
    return null;
  }
  return round(normalizeHeightUnit(unit) === 'in' ? n / CM_PER_IN : n, 1);
}

/** Value entered in `unit` → centimetres to store (1 dp), or null. */
function heightToMetric(value, unit) {
  if (isBlank(value)) {
    return null;
  }
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return null;
  }
  return round(normalizeHeightUnit(unit) === 'in' ? n * CM_PER_IN : n, 1);
}

function formatNumber(n) {
  if (n === null || n === undefined) {
    return '';
  }
  // round() already trimmed precision; String() drops a trailing ".0".
  return String(n);
}

/** "70 kg" / "154.3 lb" from a stored kg value; '' when blank. */
function formatWeight(kg, unit) {
  const u = normalizeWeightUnit(unit);
  const v = weightFromMetric(kg, u);
  if (v === null) {
    return '';
  }
  return `${formatNumber(v)} ${u}`;
}

/** "180 cm" / "70.9 in" from a stored cm value; '' when blank. */
function formatHeight(cm, unit) {
  const u = normalizeHeightUnit(unit);
  const v = heightFromMetric(cm, u);
  if (v === null) {
    return '';
  }
  return `${formatNumber(v)} ${u}`;
}

module.exports = {
  KG_PER_LB,
  CM_PER_IN,
  WEIGHT_UNITS,
  HEIGHT_UNITS,
  DEFAULT_WEIGHT_UNIT,
  DEFAULT_HEIGHT_UNIT,
  normalizeWeightUnit,
  normalizeHeightUnit,
  weightFromMetric,
  weightToMetric,
  heightFromMetric,
  heightToMetric,
  formatWeight,
  formatHeight,
};
