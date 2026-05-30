import {
  buildSkiCreatePayload,
  buildSkiUpdatePayload,
} from '@nordicfleet/core';
import {db, firestore} from './firebase';

const skisCollection = uid =>
  db.collection('users').doc(uid).collection('skis');
const skiDoc = (uid, skiId) => skisCollection(uid).doc(skiId);

function snapshotToSki(snap) {
  if (!snap || !snap.exists) {
    return null;
  }
  return {id: snap.id, ...snap.data()};
}

/**
 * One-time read of every ski for a user, including retired.
 * @param {string} uid
 * @returns {Promise<Array<object>>}
 */
export async function listSkis(uid) {
  if (!uid) {
    return [];
  }
  const snap = await skisCollection(uid).get();
  const out = [];
  snap.forEach(d => out.push({id: d.id, ...d.data()}));
  return out;
}

/**
 * Read a single ski.
 * @param {string} uid
 * @param {string} skiId
 * @returns {Promise<object|null>}
 */
export async function getSki(uid, skiId) {
  if (!uid || !skiId) {
    return null;
  }
  const snap = await skiDoc(uid, skiId).get();
  return snapshotToSki(snap);
}

/**
 * Create a new ski. Returns the doc ID.
 * @param {string} uid
 * @param {object} data
 * @returns {Promise<string>} new skiId
 */
export async function createSki(uid, data) {
  if (!uid) {
    throw new Error('createSki: uid is required');
  }
  // Validation + normalization lives in @nordicfleet/core so the web
  // app applies the exact same rules. The platform-specific bit here
  // is just the serverTimestamp fields.
  const payload = {
    ...buildSkiCreatePayload(data),
    createdAt: firestore.FieldValue.serverTimestamp(),
    updatedAt: firestore.FieldValue.serverTimestamp(),
  };
  const ref = await skisCollection(uid).add(payload);
  return ref.id;
}

/**
 * Merge a partial update.
 * @param {string} uid
 * @param {string} skiId
 * @param {object} partial
 * @returns {Promise<void>}
 */
export async function updateSki(uid, skiId, partial) {
  if (!uid || !skiId) {
    throw new Error('updateSki: uid and skiId required');
  }
  // Empty / undefined partials are tolerated (no-op). Anything provided
  // goes through the core builder for normalization. The `retired` field
  // is special-cased because the soft-delete path passes just {retired}.
  const normalized = buildSkiUpdatePayload(partial || {});
  await skiDoc(uid, skiId).set(
    {...normalized, updatedAt: firestore.FieldValue.serverTimestamp()},
    {merge: true},
  );
}

/**
 * Soft delete - sets retired=true. Wired to the UI.
 * @param {string} uid
 * @param {string} skiId
 * @returns {Promise<void>}
 */
export async function deleteSki(uid, skiId) {
  await updateSki(uid, skiId, {retired: true});
}

/**
 * Hard delete - permanently removes the ski doc. Not wired to UI.
 * @param {string} uid
 * @param {string} skiId
 * @returns {Promise<void>}
 */
export async function hardDeleteSki(uid, skiId) {
  if (!uid || !skiId) {
    throw new Error('hardDeleteSki: uid and skiId required');
  }
  await skiDoc(uid, skiId).delete();
}

/**
 * Coach read of an athlete's ski list. This is a thin alias of listSkis
 * with the athlete's uid - the access check happens in Firestore rules
 * (only the owner or the athlete's coach can read). `coachUid` isn't
 * passed to Firestore (the rules use request.auth.uid), but the parameter
 * is here to make the call site self-documenting at the screen layer.
 *
 * @param {string} _coachUid  unused, kept for call-site clarity
 * @param {string} athleteUid
 * @returns {Promise<Array<object>>}
 */
export async function listSkisForAthlete(_coachUid, athleteUid) {
  return listSkis(athleteUid);
}

/**
 * Real-time subscription to an athlete's ski list, gated by Firestore
 * rules to the owning athlete or their linked coach.
 *
 * @param {string} _coachUid  unused, kept for call-site clarity
 * @param {string} athleteUid
 * @param {(skis: Array<object>) => void} callback
 * @returns {() => void} unsubscribe
 */
export function subscribeSkisForAthlete(_coachUid, athleteUid, callback) {
  return subscribeSkis(athleteUid, callback);
}

/**
 * Subscribe to live updates of the ski list.
 * @param {string} uid
 * @param {(skis: Array<object>) => void} callback
 * @returns {() => void} unsubscribe
 */
export function subscribeSkis(uid, callback) {
  if (!uid) {
    callback([]);
    return () => {};
  }
  return skisCollection(uid).onSnapshot(
    snap => {
      const skis = [];
      snap.forEach(d => skis.push({id: d.id, ...d.data()}));
      callback(skis);
    },
    () => {
      callback([]);
    },
  );
}

/**
 * Subscribe to live updates of a single ski.
 * @param {string} uid
 * @param {string} skiId
 * @param {(ski: object|null) => void} callback
 * @returns {() => void} unsubscribe
 */
export function subscribeSki(uid, skiId, callback) {
  if (!uid || !skiId) {
    callback(null);
    return () => {};
  }
  return skiDoc(uid, skiId).onSnapshot(
    snap => callback(snapshotToSki(snap)),
    () => {
      callback(null);
    },
  );
}
