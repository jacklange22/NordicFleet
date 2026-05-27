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
  serverTimestamp,
} from 'firebase/firestore';
import {
  buildSkiCreatePayload,
  buildSkiUpdatePayload,
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
