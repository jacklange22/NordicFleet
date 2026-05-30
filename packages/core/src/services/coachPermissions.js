// Coach permission ladder + fleet-suggestion shaping.
//
// Pure, no I/O and NO Firestore rules wiring: the rules that would
// actually ENFORCE these tiers add new collections and must be emulator-
// tested first (see COACH_FEATURES_DESIGN.md + FIRESTORE_RULES_TESTING_
// PLAN.md). This module is the single source of truth for the ladder and
// the suggestion payload shape so the app and the future rules agree.
//
// Important: today's live rules already make a linked coach READ-ONLY on
// an athlete's data. 'view' and 'comment' never loosen that - on accept,
// the ATHLETE (owner) writes the change. Only a future 'edit' tier would
// add a coach-write rule, behind an explicit athlete grant.

const PERMISSION_LEVELS = ['view', 'comment', 'edit'];
const DEFAULT_PERMISSION = 'view';
const PERMISSION_RANK = {view: 0, comment: 1, edit: 2};

/** Coerce arbitrary stored input to a valid level (default 'view'). */
function normalizePermission(level) {
  return PERMISSION_LEVELS.includes(level) ? level : DEFAULT_PERMISSION;
}

function permissionRank(level) {
  return PERMISSION_RANK[normalizePermission(level)];
}

/** True when `level` is at least as permissive as `required`. */
function coachHasAtLeast(level, required) {
  return permissionRank(level) >= permissionRank(required);
}

/** A linked coach can always read. */
function canView() {
  return true;
}
function canComment(level) {
  return coachHasAtLeast(level, 'comment');
}
function canEdit(level) {
  return coachHasAtLeast(level, 'edit');
}

const SUGGESTION_TARGETS = ['ski', 'waxLog', 'testLog'];

// Only primitive scalars (and arrays of scalars) may be suggested, so a
// suggestion can never smuggle nested objects / functions into a doc.
function sanitizeSuggestedChanges(changes) {
  const out = {};
  if (!changes || typeof changes !== 'object' || Array.isArray(changes)) {
    return out;
  }
  const isScalar = x =>
    x === null ||
    typeof x === 'string' ||
    typeof x === 'number' ||
    typeof x === 'boolean';
  for (const [k, v] of Object.entries(changes)) {
    if (isScalar(v)) {
      out[k] = v;
    } else if (Array.isArray(v) && v.every(isScalar)) {
      out[k] = v.slice();
    }
    // anything else is intentionally dropped
  }
  return out;
}

/**
 * Build a fleetSuggestions/{id} payload (status starts 'pending'). Throws
 * on bad input; sanitizes suggestedChanges. No Firestore here.
 *
 * @param {Object} args
 * @param {string} args.coachUid
 * @param {string} args.athleteUid
 * @param {'ski'|'waxLog'|'testLog'} args.targetType
 * @param {string} args.targetId
 * @param {Object} [args.suggestedChanges]
 * @param {string} [args.comment]
 * @returns {Object}
 */
function buildFleetSuggestionPayload({
  coachUid,
  athleteUid,
  targetType,
  targetId,
  suggestedChanges,
  comment,
} = {}) {
  if (!coachUid || !athleteUid) {
    throw new Error('coachUid and athleteUid are required');
  }
  if (coachUid === athleteUid) {
    const err = new Error('A coach cannot suggest changes to their own fleet');
    err.code = 'coach/self-suggest';
    throw err;
  }
  if (!SUGGESTION_TARGETS.includes(targetType)) {
    throw new Error(`Unknown suggestion targetType: ${targetType}`);
  }
  if (!targetId) {
    throw new Error('targetId is required');
  }
  const changes = sanitizeSuggestedChanges(suggestedChanges);
  const trimmedComment = (comment || '').trim();
  if (Object.keys(changes).length === 0 && !trimmedComment) {
    throw new Error('A suggestion needs at least one change or a comment');
  }
  return {
    coachUid,
    athleteUid,
    targetType,
    targetId,
    suggestedChanges: changes,
    comment: trimmedComment,
    status: 'pending',
  };
}

/**
 * Apply an accepted suggestion's changes onto a target doc. Pure: the
 * ATHLETE performs the real write, so view/comment never loosen the
 * owner-only write rule.
 *
 * @param {Object} target
 * @param {Object} suggestion  a fleetSuggestion payload/doc
 * @returns {Object} a new merged object
 */
function applySuggestedChanges(target, suggestion) {
  const base = target && typeof target === 'object' ? {...target} : {};
  const changes = suggestion && suggestion.suggestedChanges;
  return {...base, ...sanitizeSuggestedChanges(changes)};
}

module.exports = {
  PERMISSION_LEVELS,
  DEFAULT_PERMISSION,
  normalizePermission,
  permissionRank,
  coachHasAtLeast,
  canView,
  canComment,
  canEdit,
  SUGGESTION_TARGETS,
  sanitizeSuggestedChanges,
  buildFleetSuggestionPayload,
  applySuggestedChanges,
};
