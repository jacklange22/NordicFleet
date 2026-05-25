/**
 * A coach-athlete relationship request in `coachRequests/{requestId}`.
 *
 * Lifecycle:
 *   athlete creates       → status 'pending'
 *   coach accepts         → status 'accepted' (athlete client then sets users/{athleteUid}.coachId)
 *   coach declines        → status 'declined'
 *   athlete cancels       → status 'cancelled' (only allowed while pending)
 *   either party unlinks  → status 'ended'
 *
 * The request document is retained for audit / history; only `status`
 * and timestamps are mutated.
 *
 * @typedef {'pending'|'accepted'|'declined'|'cancelled'|'ended'} CoachRequestStatus
 *
 * @typedef {Object} CoachRequest
 * @property {string}              id
 * @property {string}              athleteUid
 * @property {string}              coachUid
 * @property {string}              athleteEmail        denormalized at create time
 * @property {string}              coachEmail          denormalized at create time
 * @property {CoachRequestStatus}  status
 * @property {*}                   createdAt
 * @property {*}                   updatedAt
 * @property {*|null}              [respondedAt]       when accepted / declined
 */

const COACH_REQUEST_STATUSES = Object.freeze([
  'pending',
  'accepted',
  'declined',
  'cancelled',
  'ended',
]);

module.exports = {COACH_REQUEST_STATUSES};
