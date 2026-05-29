// Firestore helpers for the web app. Read paths live alongside the
// small set of write paths the web exposes — currently just the
// import flow's batched ski create.

import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  addDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  buildSkiCreatePayload,
  buildSkiUpdatePayload,
  buildWaxLogCreatePayload,
  buildTestLogCreatePayload,
  buildMessageCreatePayload,
  buildMarkReadPayload,
  buildCoachRequestCreatePayload,
  buildCoachRequestStatusPayload,
  buildCoachCapabilityPayload,
  needsCoachBackfill,
  deriveIsCoach,
  buildWaxTestCreatePayload,
} from '@nordicfleet/core';
import {getDbClient} from './firebase';

function noop() {}

export function subscribeProfile(uid, cb) {
  if (!uid) {
    cb(null);
    return noop;
  }
  const db = getDbClient();
  if (!db) {
    cb(null);
    return noop;
  }
  return onSnapshot(
    doc(db, 'users', uid),
    snap => cb(snap.exists() ? {uid, ...snap.data()} : null),
    () => cb(null),
  );
}

export async function getProfile(uid) {
  if (!uid) {
    return null;
  }
  const db = getDbClient();
  if (!db) {
    return null;
  }
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? {uid, ...snap.data()} : null;
}

export function subscribeSkis(uid, cb) {
  if (!uid) {
    cb([]);
    return noop;
  }
  const db = getDbClient();
  if (!db) {
    cb([]);
    return noop;
  }
  return onSnapshot(
    collection(db, 'users', uid, 'skis'),
    snap => {
      const list = [];
      snap.forEach(d => list.push({id: d.id, ...d.data()}));
      cb(list);
    },
    () => cb([]),
  );
}

export async function getSki(uid, skiId) {
  if (!uid || !skiId) {
    return null;
  }
  const db = getDbClient();
  if (!db) {
    return null;
  }
  const snap = await getDoc(doc(db, 'users', uid, 'skis', skiId));
  return snap.exists() ? {id: snap.id, ...snap.data()} : null;
}

/**
 * Live subscription to a single ski doc. Used where a one-shot read
 * would go stale — e.g. the message-detail attached-ski cards should
 * reflect a rename without a page reload.
 */
export function subscribeSki(uid, skiId, cb) {
  if (!uid || !skiId) {
    cb(null);
    return noop;
  }
  const db = getDbClient();
  if (!db) {
    cb(null);
    return noop;
  }
  return onSnapshot(
    doc(db, 'users', uid, 'skis', skiId),
    snap => cb(snap.exists() ? {id: snap.id, ...snap.data()} : null),
    () => cb(null),
  );
}

export function subscribeWaxLogsForSki(uid, skiId, cb) {
  if (!uid || !skiId) {
    cb([]);
    return noop;
  }
  const db = getDbClient();
  if (!db) {
    cb([]);
    return noop;
  }
  const q = query(
    collection(db, 'users', uid, 'waxLogs'),
    where('skiId', '==', skiId),
    orderBy('date', 'desc'),
  );
  return onSnapshot(
    q,
    snap => {
      const list = [];
      snap.forEach(d => list.push({id: d.id, ...d.data()}));
      cb(list);
    },
    () => cb([]),
  );
}

export function subscribeTestLogsForSki(uid, skiId, cb) {
  if (!uid || !skiId) {
    cb([]);
    return noop;
  }
  const db = getDbClient();
  if (!db) {
    cb([]);
    return noop;
  }
  const q = query(
    collection(db, 'users', uid, 'testLogs'),
    where('skiId', '==', skiId),
    orderBy('date', 'desc'),
  );
  return onSnapshot(
    q,
    snap => {
      const list = [];
      snap.forEach(d => list.push({id: d.id, ...d.data()}));
      cb(list);
    },
    () => cb([]),
  );
}

export function subscribeAthletesForCoach(coachUid, cb) {
  if (!coachUid) {
    cb([]);
    return noop;
  }
  const db = getDbClient();
  if (!db) {
    cb([]);
    return noop;
  }
  const q = query(collection(db, 'users'), where('coachId', '==', coachUid));
  return onSnapshot(
    q,
    snap => {
      const list = [];
      snap.forEach(d => list.push({uid: d.id, ...d.data()}));
      cb(list);
    },
    () => cb([]),
  );
}

/**
 * Merge a partial update into the user's profile doc.
 * Always bumps updatedAt.
 */
export async function updateProfile(uid, partial) {
  if (!uid) {
    throw new Error('updateProfile: uid is required');
  }
  const db = getDbClient();
  if (!db) {
    throw new Error('Firestore is not configured');
  }
  await setDoc(
    doc(db, 'users', uid),
    {...partial, updatedAt: serverTimestamp()},
    {merge: true},
  );
}

/**
 * Find a coach by email — filters by role='coach' so Firestore rules
 * permit the read. Returns null when no match.
 */
export async function findCoachByEmail(email) {
  if (!email) {
    return null;
  }
  const db = getDbClient();
  if (!db) {
    return null;
  }
  const trimmed = email.trim();
  const q = query(
    collection(db, 'users'),
    where('email', '==', trimmed),
    where('role', '==', 'coach'),
  );
  const snap = await getDocs(q);
  if (snap.empty) {
    return null;
  }
  const d = snap.docs[0];
  return {uid: d.id, ...d.data()};
}

/**
 * Migrate-on-read: backfill the isCoach field on a legacy profile.
 * Returns the effective isCoach. Mirror of the mobile helper.
 */
export async function backfillCoachCapability(uid, profile) {
  const isCoach = deriveIsCoach(profile);
  if (uid && needsCoachBackfill(profile)) {
    const db = getDbClient();
    if (db) {
      try {
        await setDoc(
          doc(db, 'users', uid),
          {isCoach, updatedAt: serverTimestamp()},
          {merge: true},
        );
      } catch {
        // best-effort
      }
    }
  }
  return isCoach;
}

/**
 * Toggle the coaching capability. Disabling cascades: clears coachId
 * on every athlete linked to this coach. Returns {clearedAthletes}.
 */
export async function setCoachCapability(uid, isCoach) {
  if (!uid) {
    throw new Error('setCoachCapability: uid is required');
  }
  const db = getDbClient();
  if (!db) {
    throw new Error('Firestore is not configured');
  }
  let clearedAthletes = 0;
  if (!isCoach) {
    try {
      const snap = await getDocs(
        query(collection(db, 'users'), where('coachId', '==', uid)),
      );
      const writes = [];
      snap.forEach(d => {
        writes.push(
          setDoc(
            d.ref,
            {coachId: null, updatedAt: serverTimestamp()},
            {merge: true},
          ),
        );
      });
      await Promise.all(writes);
      clearedAthletes = snap.size;
    } catch {
      // tolerate — drop the capability anyway
    }
  }
  await setDoc(
    doc(db, 'users', uid),
    {...buildCoachCapabilityPayload(isCoach), updatedAt: serverTimestamp()},
    {merge: true},
  );
  return {clearedAthletes};
}

// ─── Coach-request flow ──────────────────────────────────────────────

/**
 * Athlete-side: look up a coach by email and create a pending request.
 * Throws coded errors for not-found / self-link / already-requested.
 */
export async function requestCoach(athleteUid, athleteEmail, coachEmail) {
  if (!athleteUid) {
    throw new Error('requestCoach: athleteUid is required');
  }
  const db = getDbClient();
  if (!db) {
    throw new Error('Firestore is not configured');
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
  const existing = await getDocs(
    query(
      collection(db, 'coachRequests'),
      where('athleteUid', '==', athleteUid),
      where('coachUid', '==', coach.uid),
      where('status', 'in', ['pending', 'accepted']),
    ),
  );
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
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, 'coachRequests'), payload);
  return {requestId: ref.id, coachUid: coach.uid};
}

export async function cancelCoachRequest(requestId) {
  return setRequestStatus(requestId, 'cancel');
}

export async function respondToCoachRequest(requestId, accept) {
  if (!requestId) {
    throw new Error('respondToCoachRequest: requestId is required');
  }
  const db = getDbClient();
  if (!db) {
    throw new Error('Firestore is not configured');
  }
  await setDoc(
    doc(db, 'coachRequests', requestId),
    {
      ...buildCoachRequestStatusPayload(accept ? 'accept' : 'decline'),
      respondedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    {merge: true},
  );
}

export async function endCoachRequest(requestId) {
  return setRequestStatus(requestId, 'end');
}

async function setRequestStatus(requestId, transition) {
  if (!requestId) {
    throw new Error(`${transition}: requestId is required`);
  }
  const db = getDbClient();
  if (!db) {
    throw new Error('Firestore is not configured');
  }
  await setDoc(
    doc(db, 'coachRequests', requestId),
    {
      ...buildCoachRequestStatusPayload(transition),
      updatedAt: serverTimestamp(),
    },
    {merge: true},
  );
}

export function subscribePendingRequestsForCoach(coachUid, cb) {
  if (!coachUid) {
    cb([]);
    return noop;
  }
  const db = getDbClient();
  if (!db) {
    cb([]);
    return noop;
  }
  const q = query(
    collection(db, 'coachRequests'),
    where('coachUid', '==', coachUid),
    where('status', '==', 'pending'),
  );
  return onSnapshot(
    q,
    snap => {
      const out = [];
      snap.forEach(d => out.push({id: d.id, ...d.data()}));
      cb(out);
    },
    () => cb([]),
  );
}

export function subscribeOutgoingRequestsForAthlete(athleteUid, cb) {
  if (!athleteUid) {
    cb([]);
    return noop;
  }
  const db = getDbClient();
  if (!db) {
    cb([]);
    return noop;
  }
  const q = query(
    collection(db, 'coachRequests'),
    where('athleteUid', '==', athleteUid),
  );
  return onSnapshot(
    q,
    snap => {
      const out = [];
      snap.forEach(d => out.push({id: d.id, ...d.data()}));
      cb(out);
    },
    () => cb([]),
  );
}

/**
 * Athlete-side helper: when an outgoing request transitions to
 * 'accepted' or 'ended', call this to keep users/{athleteUid}.coachId
 * in sync. Mirror of the mobile syncCoachIdFromRequests.
 */
export async function syncCoachIdFromRequests(athleteUid, requests) {
  if (!athleteUid) {
    return;
  }
  const accepted = (requests || [])
    .filter(r => r.status === 'accepted')
    .sort((a, b) => {
      const at = a.updatedAt?.seconds || 0;
      const bt = b.updatedAt?.seconds || 0;
      return bt - at;
    });
  const coachId = accepted.length ? accepted[0].coachUid : null;
  await updateProfile(athleteUid, {coachId});
}

// ─── Messages ────────────────────────────────────────────────────────

export async function sendMessage(args) {
  const db = getDbClient();
  if (!db) {
    throw new Error('Firestore is not configured');
  }
  const payload = {
    ...buildMessageCreatePayload(args),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, 'messages'), payload);
  return ref.id;
}

export async function markMessageRead(messageId) {
  if (!messageId) {
    throw new Error('markMessageRead: messageId is required');
  }
  const db = getDbClient();
  if (!db) {
    throw new Error('Firestore is not configured');
  }
  await setDoc(
    doc(db, 'messages', messageId),
    {...buildMarkReadPayload(), updatedAt: serverTimestamp()},
    {merge: true},
  );
}

export function subscribeMessagesForAthlete(athleteUid, cb) {
  if (!athleteUid) {
    cb([]);
    return noop;
  }
  const db = getDbClient();
  if (!db) {
    cb([]);
    return noop;
  }
  const q = query(
    collection(db, 'messages'),
    where('toUid', '==', athleteUid),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(
    q,
    snap => {
      const out = [];
      snap.forEach(d => out.push({id: d.id, ...d.data()}));
      cb(out);
    },
    () => cb([]),
  );
}

export function subscribeUnreadCountForAthlete(athleteUid, cb) {
  if (!athleteUid) {
    cb(0);
    return noop;
  }
  const db = getDbClient();
  if (!db) {
    cb(0);
    return noop;
  }
  const q = query(
    collection(db, 'messages'),
    where('toUid', '==', athleteUid),
    where('read', '==', false),
  );
  return onSnapshot(
    q,
    snap => cb(snap.size),
    () => cb(0),
  );
}

export async function getMessage(messageId) {
  if (!messageId) {
    return null;
  }
  const db = getDbClient();
  if (!db) {
    return null;
  }
  const snap = await getDoc(doc(db, 'messages', messageId));
  return snap.exists() ? {id: snap.id, ...snap.data()} : null;
}

// ─── Wax Truck (users/{uid}/waxTests) ───────────────────────────────

export async function createWaxTest(uid, data) {
  if (!uid) {
    throw new Error('createWaxTest: uid is required');
  }
  const db = getDbClient();
  if (!db) {
    throw new Error('Firestore is not configured');
  }
  const payload = {
    ...buildWaxTestCreatePayload(data),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, 'users', uid, 'waxTests'), payload);
  return ref.id;
}

export async function updateWaxTest(uid, testId, partial) {
  if (!uid || !testId) {
    throw new Error('updateWaxTest: uid and testId are required');
  }
  const db = getDbClient();
  if (!db) {
    throw new Error('Firestore is not configured');
  }
  await setDoc(
    doc(db, 'users', uid, 'waxTests', testId),
    {...partial, updatedAt: serverTimestamp()},
    {merge: true},
  );
}

export async function getWaxTest(uid, testId) {
  if (!uid || !testId) {
    return null;
  }
  const db = getDbClient();
  if (!db) {
    return null;
  }
  const snap = await getDoc(doc(db, 'users', uid, 'waxTests', testId));
  return snap.exists() ? {id: snap.id, ...snap.data()} : null;
}

export async function deleteWaxTest(uid, testId) {
  if (!uid || !testId) {
    throw new Error('deleteWaxTest: uid and testId are required');
  }
  const db = getDbClient();
  if (!db) {
    throw new Error('Firestore is not configured');
  }
  await deleteDoc(doc(db, 'users', uid, 'waxTests', testId));
}

export function subscribeWaxTests(uid, cb) {
  if (!uid) {
    cb([]);
    return noop;
  }
  const db = getDbClient();
  if (!db) {
    cb([]);
    return noop;
  }
  const q = query(
    collection(db, 'users', uid, 'waxTests'),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(
    q,
    snap => {
      const out = [];
      snap.forEach(d => out.push({id: d.id, ...d.data()}));
      cb(out);
    },
    () => cb([]),
  );
}

export async function listSkisForAthlete(athleteUid) {
  if (!athleteUid) {
    return [];
  }
  const db = getDbClient();
  if (!db) {
    return [];
  }
  const snap = await getDocs(collection(db, 'users', athleteUid, 'skis'));
  const list = [];
  snap.forEach(d => list.push({id: d.id, ...d.data()}));
  return list;
}

// ─── Write side ────────────────────────────────────────────────────────

/**
 * Create a single ski document under users/{uid}/skis. The platform
 * adds createdAt / updatedAt serverTimestamps; validation +
 * normalization is delegated to @nordicfleet/core so the web and iOS
 * paths produce structurally identical docs.
 *
 * @param {string} uid
 * @param {object} data  SkiInput shape (see packages/core/src/types/ski.js)
 * @returns {Promise<string>}  new ski doc ID
 */
export async function createSki(uid, data) {
  if (!uid) {
    throw new Error('createSki: uid is required');
  }
  const db = getDbClient();
  if (!db) {
    throw new Error('Firestore is not configured');
  }
  const payload = {
    ...buildSkiCreatePayload(data),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, 'users', uid, 'skis'), payload);
  return ref.id;
}

/**
 * Create several skis in parallel. Uses Promise.allSettled so one bad
 * row doesn't abort the rest — callers receive a {created, failed}
 * summary with per-row indices preserved for diagnostic messaging.
 *
 * @param {string} uid
 * @param {Array<object>} skiInputs  array of SkiInput payloads
 * @returns {Promise<{
 *   created: Array<{index: number, id: string}>,
 *   failed:  Array<{index: number, error: string}>,
 * }>}
 */
/**
 * Patch an existing ski. Goes through buildSkiUpdatePayload so the
 * same validation + normalization rules iOS uses apply on web. Passes
 * only the fields the caller provided (partial update).
 *
 * @param {string} uid
 * @param {string} skiId
 * @param {object} partial   any subset of SkiInput keys
 */
export async function updateSki(uid, skiId, partial) {
  if (!uid || !skiId) {
    throw new Error('updateSki: uid and skiId required');
  }
  const db = getDbClient();
  if (!db) {
    throw new Error('Firestore is not configured');
  }
  const normalized = buildSkiUpdatePayload(partial || {});
  await setDoc(
    doc(db, 'users', uid, 'skis', skiId),
    {...normalized, updatedAt: serverTimestamp()},
    {merge: true},
  );
}

/**
 * Soft-delete — sets retired=true. The web UI also exposes the
 * inverse (set false) so coaches can resurrect skis a user retired
 * by mistake.
 */
export async function setSkiRetired(uid, skiId, retired) {
  return updateSki(uid, skiId, {retired: !!retired});
}

/**
 * Append a wax log for the given ski. Returns the new doc id.
 * Uses buildWaxLogCreatePayload from core to apply the same
 * validation iOS does (skiId required, layers clamped, binder
 * 'None' → null, etc.). Date is forced to serverTimestamp so the
 * sort order on the ski-history list stays consistent.
 *
 * For skate skis the caller is expected to pass kickLayers: 0,
 * kickWax: null — same contract as the mobile service.
 *
 * @param {string} uid
 * @param {object} data   WaxLogInput shape
 * @returns {Promise<string>}
 */
export async function createWaxLog(uid, data) {
  if (!uid) {
    throw new Error('createWaxLog: uid is required');
  }
  const db = getDbClient();
  if (!db) {
    throw new Error('Firestore is not configured');
  }
  const payload = {
    ...buildWaxLogCreatePayload(data),
    date: serverTimestamp(),
    createdAt: serverTimestamp(),
  };
  const ref = await addDoc(
    collection(db, 'users', uid, 'waxLogs'),
    payload,
  );
  return ref.id;
}

/**
 * Append a test log for the given ski. Same pattern as createWaxLog
 * — goes through buildTestLogCreatePayload, attaches a serverTimestamp
 * for the date + createdAt.
 *
 * @param {string} uid
 * @param {object} data   TestLogInput shape
 * @returns {Promise<string>}
 */
export async function createTestLog(uid, data) {
  if (!uid) {
    throw new Error('createTestLog: uid is required');
  }
  const db = getDbClient();
  if (!db) {
    throw new Error('Firestore is not configured');
  }
  const payload = {
    ...buildTestLogCreatePayload(data),
    date: serverTimestamp(),
    createdAt: serverTimestamp(),
  };
  const ref = await addDoc(
    collection(db, 'users', uid, 'testLogs'),
    payload,
  );
  return ref.id;
}

export async function createSkisBatch(uid, skiInputs) {
  if (!uid) {
    throw new Error('createSkisBatch: uid is required');
  }
  if (!Array.isArray(skiInputs) || skiInputs.length === 0) {
    return {created: [], failed: []};
  }
  const settled = await Promise.allSettled(
    skiInputs.map(input => createSki(uid, input)),
  );
  const created = [];
  const failed = [];
  settled.forEach((res, idx) => {
    if (res.status === 'fulfilled') {
      created.push({index: idx, id: res.value});
    } else {
      const message =
        (res.reason && res.reason.message) || String(res.reason);
      failed.push({index: idx, error: message});
    }
  });
  return {created, failed};
}
