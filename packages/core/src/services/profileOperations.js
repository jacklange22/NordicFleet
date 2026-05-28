// Profile capability helpers.
//
// The app moved from a rigid role: 'athlete' | 'coach' binary to a
// capability model: every user has a personal fleet, and some users
// ADDITIONALLY have the coaching capability (isCoach: true). This
// module is the single source of truth for reading that capability
// and shaping new / updated profile docs.

/**
 * Read the coaching capability off a profile doc. Handles the
 * migration window where older docs only carry the legacy `role`
 * field and no `isCoach`:
 *   - isCoach present (boolean) → use it.
 *   - else fall back to role === 'coach'.
 *
 * This is migrate-on-read: the consuming app backfills isCoach the
 * first time it loads a legacy doc (see needsCoachBackfill).
 *
 * @param {object|null} profile
 * @returns {boolean}
 */
function deriveIsCoach(profile) {
  if (!profile || typeof profile !== 'object') {
    return false;
  }
  if (typeof profile.isCoach === 'boolean') {
    return profile.isCoach;
  }
  return profile.role === 'coach';
}

/**
 * True when a profile doc predates the isCoach field and should be
 * backfilled. Used by the app to write isCoach once on next load.
 *
 * @param {object|null} profile
 * @returns {boolean}
 */
function needsCoachBackfill(profile) {
  return (
    !!profile &&
    typeof profile === 'object' &&
    typeof profile.isCoach !== 'boolean'
  );
}

/**
 * Shape the field set for a NEW profile doc. The platform layer adds
 * createdAt / updatedAt server timestamps. Keeps `role` populated as
 * a derived mirror of isCoach so any not-yet-migrated reader still
 * works.
 *
 * @param {object} [data]
 * @param {string} [data.email]
 * @param {string} [data.displayName]
 * @param {string} [data.name]
 * @param {boolean} [data.isCoach]   preferred
 * @param {'athlete'|'coach'} [data.role]  legacy input, still accepted
 * @param {string} [data.coachId]
 * @returns {object} normalized profile fields (no timestamps)
 */
function buildProfileCreatePayload(data = {}) {
  const isCoach = data.isCoach === true || data.role === 'coach';
  return {
    email: data.email || null,
    displayName: data.displayName || null,
    name: data.name || null,
    weight: data.weight ?? null,
    height: data.height ?? null,
    team: data.team || null,
    location: data.location || null,
    isCoach,
    // Legacy mirror — keep readable so a mid-migration client that
    // still checks role doesn't break.
    role: isCoach ? 'coach' : 'athlete',
    coachId: data.coachId || null,
  };
}

/**
 * Shape the partial update for toggling the coaching capability on or
 * off. Keeps the legacy `role` mirror in sync. Platform layer adds
 * updatedAt.
 *
 * @param {boolean} isCoach
 * @returns {object}
 */
function buildCoachCapabilityPayload(isCoach) {
  const flag = !!isCoach;
  return {
    isCoach: flag,
    role: flag ? 'coach' : 'athlete',
  };
}

module.exports = {
  deriveIsCoach,
  needsCoachBackfill,
  buildProfileCreatePayload,
  buildCoachCapabilityPayload,
};
