// Coach acceptance service. Replaces the previous "athlete unilaterally
// sets coachId" path with a request/response model:
//
//   1. Athlete requests   → creates coachRequests/{id} with status 'pending'.
//   2. Coach reads requests where coachUid == self.
//   3. Coach accepts      → updates status to 'accepted'.
//   4. Athlete client observes 'accepted' on its outgoing request and
//      sets users/{athleteUid}.coachId = coachUid (cross-doc write that
//      Firestore rules wouldn't allow the coach to do, but the athlete
//      can do for themselves - see NOTES.md "Coach-acceptance flow").
//   5. Either party can later set the request status to 'ended' to
//      unlink. The athlete additionally clears their own coachId on
//      transition to 'ended'.

import {
  buildCoachRequestCreatePayload,
  buildCoachRequestStatusPayload,
} from '@nordicfleet/core';
import {db, firestore} from './firebase';
import {findCoachByEmail, updateProfile} from './userService';

const requestsCollection = () => db.collection('coachRequests');
const requestDoc = id => requestsCollection().doc(id);

/**
 * Athlete-side: look up a coach by email and create a pending request.
 * Throws a coded error when:
 *   - The email isn't an existing coach account (coach/not-found).
 *   - The athlete would be coaching themselves (coach/self-link).
 *   - There's already an active (pending or accepted) request to the
 *     same coach (coach/already-requested).
 *
 * @param {string} athleteUid
 * @param {string} athleteEmail
 * @param {string} coachEmail
 * @returns {Promise<{requestId: string, coachUid: string}>}
 */
export async function requestCoach(athleteUid, athleteEmail, coachEmail) {
  if (!athleteUid) {
    throw new Error('requestCoach: athleteUid is required');
  }
  const coach = await findCoachByEmail(coachEmail);
  if (!coach) {
    const err = new Error('No coach account found with that email');
    err.code = 'coach/not-found';
    throw err;
  }
  if (coach.uid === athleteUid) {
    const err = new Error('You cannot be your own coach');
    err.code = 'coach/self-link';
    throw err;
  }
  // Look for an existing active request to the same coach.
  const existing = await requestsCollection()
    .where('athleteUid', '==', athleteUid)
    .where('coachUid', '==', coach.uid)
    .where('status', 'in', ['pending', 'accepted'])
    .get();
  if (!existing.empty) {
    const err = new Error('There is already an active request to this coach');
    err.code = 'coach/already-requested';
    throw err;
  }

  const payload = {
    ...buildCoachRequestCreatePayload({
      athleteUid,
      athleteEmail,
      coachUid: coach.uid,
      coachEmail: coach.email || coachEmail,
    }),
    createdAt: firestore.FieldValue.serverTimestamp(),
    updatedAt: firestore.FieldValue.serverTimestamp(),
  };
  const ref = await requestsCollection().add(payload);
  return {requestId: ref.id, coachUid: coach.uid};
}

/**
 * Athlete-side: cancel an outstanding pending request.
 */
export async function cancelRequest(requestId) {
  if (!requestId) {
    throw new Error('cancelRequest: requestId is required');
  }
  await requestDoc(requestId).set(
    {
      ...buildCoachRequestStatusPayload('cancel'),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    },
    {merge: true},
  );
}

/**
 * Coach-side: accept (true) or decline (false) a pending request.
 * On accept, the athlete observer hook (subscribeOutgoingRequests…)
 * sees the status transition and writes the athlete's coachId.
 */
export async function respondToRequest(requestId, accept) {
  if (!requestId) {
    throw new Error('respondToRequest: requestId is required');
  }
  await requestDoc(requestId).set(
    {
      ...buildCoachRequestStatusPayload(accept ? 'accept' : 'decline'),
      respondedAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    },
    {merge: true},
  );
}

/**
 * Either party - transition an accepted request to 'ended'. Used when
 * either side wants to unlink. Note: the athlete should also clear
 * their coachId locally (the rules don't let the coach do it).
 */
export async function endRequest(requestId) {
  if (!requestId) {
    throw new Error('endRequest: requestId is required');
  }
  await requestDoc(requestId).set(
    {
      ...buildCoachRequestStatusPayload('end'),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    },
    {merge: true},
  );
}

/**
 * Subscribe to the coach's incoming requests (status: pending).
 */
export function subscribePendingRequestsForCoach(coachUid, callback) {
  if (!coachUid) {
    callback([]);
    return () => {};
  }
  return requestsCollection()
    .where('coachUid', '==', coachUid)
    .where('status', '==', 'pending')
    .onSnapshot(
      snap => {
        const out = [];
        snap.forEach(d => out.push({id: d.id, ...d.data()}));
        callback(out);
      },
      () => callback([]),
    );
}

/**
 * Subscribe to the athlete's outgoing requests (all statuses). The
 * caller is expected to react to status transitions:
 *   - 'accepted' → write users/{athleteUid}.coachId = coachUid
 *   - 'ended'    → write users/{athleteUid}.coachId = null
 *
 * That cross-doc write is the athlete-side compensating action that
 * makes the acceptance flow work without Cloud Functions.
 */
export function subscribeOutgoingRequestsForAthlete(athleteUid, callback) {
  if (!athleteUid) {
    callback([]);
    return () => {};
  }
  return requestsCollection()
    .where('athleteUid', '==', athleteUid)
    .onSnapshot(
      snap => {
        const out = [];
        snap.forEach(d => out.push({id: d.id, ...d.data()}));
        callback(out);
      },
      () => callback([]),
    );
}

/**
 * Athlete-side helper: when an outgoing request transitions to
 * 'accepted' OR 'ended', call this to keep users/{athleteUid}.coachId
 * in sync.
 *
 * Pass the FULL list of outgoing requests (from
 * subscribeOutgoingRequestsForAthlete) - the function picks the most
 * recent accepted one (if any) as the current coach.
 */
export async function syncCoachIdFromRequests(athleteUid, requests) {
  if (!athleteUid) {
    return;
  }
  const accepted = requests
    .filter(r => r.status === 'accepted')
    .sort((a, b) => {
      const at = a.updatedAt?.seconds || 0;
      const bt = b.updatedAt?.seconds || 0;
      return bt - at;
    });
  const coachId = accepted.length ? accepted[0].coachUid : null;
  await updateProfile(athleteUid, {coachId});
}
