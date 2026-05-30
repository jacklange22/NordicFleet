// Coach -> athlete invites. Top-level `athleteInvites/{id}` collection: the
// coach's PRIVATE tracking list of who they invited and the status.
//
// Rules (firestore.rules): only the owning coach can read / list / create /
// revoke. There is NO public or athlete read, so tokens cannot be enumerated.
// Redemption is NOT a token lookup here - the athlete connects through the
// existing athlete-initiated coachRequest flow (entering the coach's email).
// Nothing in this module sends email; the UI copies links or opens a draft.

import {buildInvitePayload} from '@nordicfleet/core';
import {db, firestore} from './firebase';

const invitesCollection = () => db.collection('athleteInvites');
const inviteDoc = id => invitesCollection().doc(id);

const EXPIRY_DAYS = 30;

/**
 * Create one tracking invite per email. Invalid emails are skipped (the UI
 * pre-filters via parseEmailList, this is belt-and-suspenders). Returns the
 * created docs (with token) so the caller can build links.
 *
 * @param {string} coachUid
 * @param {string} coachName
 * @param {string[]} emails
 * @returns {Promise<Array<object>>}
 */
export async function createInvites(coachUid, coachName, emails) {
  if (!coachUid) {
    throw new Error('createInvites: coachUid is required');
  }
  const list = Array.isArray(emails) ? emails : [];
  const expiresAt = firestore.Timestamp.fromDate(
    new Date(Date.now() + EXPIRY_DAYS * 24 * 60 * 60 * 1000),
  );
  const created = [];
  for (const email of list) {
    let payload;
    try {
      payload = buildInvitePayload({coachUid, coachName, email});
    } catch {
      continue; // skip an invalid email rather than abort the batch
    }
    const full = {
      ...payload,
      createdAt: firestore.FieldValue.serverTimestamp(),
      expiresAt,
    };
    const ref = await invitesCollection().add(full);
    created.push({id: ref.id, ...full});
  }
  return created;
}

/**
 * Live list of the coach's own invites, newest first.
 * @param {string} coachUid
 * @param {(invites: Array<object>) => void} callback
 * @returns {() => void} unsubscribe
 */
export function subscribeInvitesForCoach(coachUid, callback) {
  if (!coachUid) {
    callback([]);
    return () => {};
  }
  return invitesCollection()
    .where('coachUid', '==', coachUid)
    .orderBy('createdAt', 'desc')
    .onSnapshot(
      snap => {
        const list = [];
        snap.forEach(d => list.push({id: d.id, ...d.data()}));
        callback(list);
      },
      () => callback([]),
    );
}

/**
 * Revoke a pending invite (owner coach only, enforced by rules).
 * @param {string} inviteId
 * @returns {Promise<void>}
 */
export async function revokeInvite(inviteId) {
  if (!inviteId) {
    throw new Error('revokeInvite: inviteId is required');
  }
  await inviteDoc(inviteId).set(
    {status: 'revoked', updatedAt: firestore.FieldValue.serverTimestamp()},
    {merge: true},
  );
}
