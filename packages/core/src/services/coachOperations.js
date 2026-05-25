const {isValidEmail} = require('../validation/email');

/**
 * Build the payload for a new coachRequests/{requestId} doc.
 *
 * Both emails are denormalized into the doc so the recipient can render
 * the request without fetching the sender's profile. Status starts as
 * 'pending'.
 *
 * @param {Object} args
 * @param {string} args.athleteUid
 * @param {string} args.athleteEmail
 * @param {string} args.coachUid
 * @param {string} args.coachEmail
 */
function buildCoachRequestCreatePayload({
  athleteUid,
  athleteEmail,
  coachUid,
  coachEmail,
}) {
  if (!athleteUid || !coachUid) {
    throw new Error('athleteUid and coachUid are required');
  }
  if (athleteUid === coachUid) {
    const err = new Error('You cannot be your own coach');
    err.code = 'coach/self-link';
    throw err;
  }
  if (!isValidEmail(athleteEmail)) {
    throw new Error('athleteEmail is invalid');
  }
  if (!isValidEmail(coachEmail)) {
    throw new Error('coachEmail is invalid');
  }
  return {
    athleteUid,
    coachUid,
    athleteEmail: athleteEmail.trim().toLowerCase(),
    coachEmail: coachEmail.trim().toLowerCase(),
    status: 'pending',
    respondedAt: null,
  };
}

/**
 * Build the patch payload for transitioning an existing coachRequest's
 * status. Returns the partial update — the rules enforce who's allowed
 * to make which transition.
 *
 * @param {'accept'|'decline'|'cancel'|'end'} action
 */
function buildCoachRequestStatusPayload(action) {
  const map = {
    accept: 'accepted',
    decline: 'declined',
    cancel: 'cancelled',
    end: 'ended',
  };
  const status = map[action];
  if (!status) {
    throw new Error(`Unknown coach-request action: ${action}`);
  }
  return {status};
}

module.exports = {
  buildCoachRequestCreatePayload,
  buildCoachRequestStatusPayload,
};
