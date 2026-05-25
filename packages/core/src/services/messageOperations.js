/**
 * Build the payload for a coach → athlete message.
 *
 * fromUid is set by the caller (typically auth().currentUser.uid on the
 * coach client). The Firestore rules require fromUid == request.auth.uid
 * AND the athlete (toUid) to have coachId == fromUid (i.e. the
 * relationship is currently linked).
 *
 * @param {Object} args
 * @param {string} args.fromUid
 * @param {string} args.toUid
 * @param {string} args.body
 * @param {string} [args.subject]
 * @param {string[]} [args.attachedSkiIds]
 */
function buildMessageCreatePayload({
  fromUid,
  toUid,
  body,
  subject,
  attachedSkiIds,
}) {
  if (!fromUid || !toUid) {
    throw new Error('fromUid and toUid are required');
  }
  if (fromUid === toUid) {
    throw new Error('Cannot send a message to yourself');
  }
  const trimmedBody = typeof body === 'string' ? body.trim() : '';
  if (!trimmedBody) {
    throw new Error('Message body is required');
  }
  return {
    fromUid,
    toUid,
    body: trimmedBody,
    subject: subject ? String(subject).trim().slice(0, 120) : null,
    attachedSkiIds: Array.isArray(attachedSkiIds)
      ? attachedSkiIds.filter(s => typeof s === 'string' && s.length > 0)
      : [],
    read: false,
  };
}

/**
 * Build the partial-update payload to mark a message as read.
 * Used by the athlete client when opening a message.
 */
function buildMarkReadPayload() {
  return {read: true};
}

module.exports = {buildMessageCreatePayload, buildMarkReadPayload};
