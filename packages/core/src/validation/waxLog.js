/**
 * Validate + normalize a WaxLog input payload.
 *
 * Required: skiId.
 * kickLayers / glideLayers default to 0 / 1 when missing or non-numeric.
 * glideWaxes is resized to match glideLayers (extra trimmed, short padded
 * with empty strings).
 * binder normalized: 'None' → null.
 *
 * Throws on missing required fields. Returns the normalized payload
 * (no Firestore-specific fields).
 *
 * @param {import('../types/waxLog').WaxLogInput} input
 */
function validateWaxLogInput(input) {
  if (!input || typeof input !== 'object') {
    throw new Error('Wax log input is required');
  }
  if (!input.skiId || typeof input.skiId !== 'string') {
    throw new Error('skiId is required on a wax log');
  }

  const kickLayers = clampLayers(input.kickLayers, 0);
  const glideLayers = clampLayers(input.glideLayers, 1, /*min=*/ 1);

  const glideWaxes = Array.isArray(input.glideWaxes)
    ? input.glideWaxes.slice(0, glideLayers)
    : [];
  while (glideWaxes.length < glideLayers) {
    glideWaxes.push('');
  }
  const glideWaxIds = Array.isArray(input.glideWaxIds)
    ? input.glideWaxIds.slice(0, glideLayers)
    : [];
  while (glideWaxIds.length < glideLayers) {
    glideWaxIds.push(null);
  }

  const binderRaw =
    typeof input.binder === 'string' ? input.binder.trim() : null;
  const binder = !binderRaw || binderRaw.toLowerCase() === 'none' ? null : binderRaw;

  return {
    skiId: input.skiId,
    binder,
    binderId: input.binderId || null,
    kickLayers,
    kickWax:
      typeof input.kickWax === 'string' && input.kickWax.trim()
        ? input.kickWax.trim()
        : null,
    kickWaxId: input.kickWaxId || null,
    glideLayers,
    glideWaxes,
    glideWaxIds,
    notes: typeof input.notes === 'string' ? input.notes : '',
  };
}

/**
 * True when a wax-log entry carries at least one meaningful field —
 * a binder (other than "None"), a kick wax, any glide wax, or a note.
 * Used by the UI to block saving a completely empty log. Pure: takes a
 * raw entry (pre-validation) so the screen can check before submitting.
 *
 * @param {object} input  a wax entry (binder/kickWax/glideWaxes/notes)
 * @returns {boolean}
 */
function waxLogHasContent(input) {
  if (!input || typeof input !== 'object') {
    return false;
  }
  const str = v => (typeof v === 'string' ? v.trim() : '');
  const binder = str(input.binder);
  if (binder && binder.toLowerCase() !== 'none') {
    return true;
  }
  if (str(input.kickWax)) {
    return true;
  }
  if (
    Array.isArray(input.glideWaxes) &&
    input.glideWaxes.some(g => str(g))
  ) {
    return true;
  }
  if (str(input.notes)) {
    return true;
  }
  return false;
}

function clampLayers(raw, fallback, min = 0) {
  if (raw === undefined || raw === null || raw === '') {
    return fallback;
  }
  const n = Number(raw);
  if (!Number.isFinite(n)) {
    return fallback;
  }
  return Math.max(min, Math.floor(n));
}

module.exports = {validateWaxLogInput, waxLogHasContent};
