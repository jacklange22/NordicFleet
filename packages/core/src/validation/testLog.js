/**
 * Validate + normalize a TestLog input payload.
 *
 * Required: skiId.
 * glideRating: 1-10. Defaults to 5 if missing/invalid.
 * temperature: allows negative numbers (winter cold-snow conditions).
 * humidity: 0-100 if provided; null otherwise.
 * snowType / surface lowercased.
 *
 * Technique-conditional fields are NOT enforced here — the caller knows the
 * ski's technique and decides whether to null out kickRating / stability /
 * climbing. Core just normalizes whatever it's handed.
 *
 * @param {import('../types/testLog').TestLogInput} input
 */
function validateTestLogInput(input) {
  if (!input || typeof input !== 'object') {
    throw new Error('Test log input is required');
  }
  if (!input.skiId || typeof input.skiId !== 'string') {
    throw new Error('skiId is required on a test log');
  }

  return {
    skiId: input.skiId,
    temperature: toNumberOrNull(input.temperature),
    humidity: toBoundedNumberOrNull(input.humidity, 0, 100),
    snowType: lowerOrNull(input.snowType),
    surface: lowerOrNull(input.surface),
    glideWax: stringOrNull(input.glideWax),
    glideWaxId: input.glideWaxId || null,
    kickWax: stringOrNull(input.kickWax),
    kickWaxId: input.kickWaxId || null,
    glideRating: clampRating(input.glideRating, 5),
    kickRating: nullableRating(input.kickRating),
    stabilityRating: nullableRating(input.stabilityRating),
    climbingRating: nullableRating(input.climbingRating),
    notes: typeof input.notes === 'string' ? input.notes : '',
    location: validateLocation(input.location),
  };
}

function toNumberOrNull(v) {
  if (v === undefined || v === null || v === '') {
    return null;
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function toBoundedNumberOrNull(v, min, max) {
  const n = toNumberOrNull(v);
  if (n === null) {
    return null;
  }
  return Math.min(max, Math.max(min, n));
}

function lowerOrNull(v) {
  if (typeof v !== 'string' || !v.trim()) {
    return null;
  }
  return v.trim().toLowerCase();
}

function stringOrNull(v) {
  if (typeof v !== 'string' || !v.trim()) {
    return null;
  }
  return v.trim();
}

function clampRating(raw, fallback) {
  const n = toNumberOrNull(raw);
  if (n === null) {
    return fallback;
  }
  return Math.min(10, Math.max(1, Math.round(n)));
}

function nullableRating(raw) {
  const n = toNumberOrNull(raw);
  if (n === null) {
    return null;
  }
  return Math.min(10, Math.max(1, Math.round(n)));
}

function validateLocation(loc) {
  if (!loc || typeof loc !== 'object') {
    return null;
  }
  const lat = Number(loc.latitude);
  const lng = Number(loc.longitude);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    return null;
  }
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    return null;
  }
  const accuracy = Number(loc.accuracy);
  return {
    latitude: lat,
    longitude: lng,
    accuracy: Number.isFinite(accuracy) ? accuracy : null,
    label: typeof loc.label === 'string' && loc.label.trim() ? loc.label.trim() : null,
  };
}

module.exports = {validateTestLogInput};
