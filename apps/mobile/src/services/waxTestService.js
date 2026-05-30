// Wax Truck persistence - users/{coachUid}/waxTests/{testId}.
//
// Validation + bracket shaping live in @nordicfleet/core
// (buildWaxTestCreatePayload). The service is a thin Firestore wrapper
// that adds server timestamps.

import {
  buildWaxTestCreatePayload,
  serializeBracket,
  deserializeBracket,
} from '@nordicfleet/core';
import {db, firestore} from './firebase';

// The in-memory bracket is Match[][] (array of arrays). Firestore forbids
// nested arrays, so we serialize the bracket to a rounds-map on every WRITE
// and restore the array form on every READ. (This was the Wax Truck
// create-test crash: a nested array can crash RN Firebase natively.)
const withSerializedBracket = data =>
  data && data.bracket
    ? {...data, bracket: serializeBracket(data.bracket)}
    : data;

const withDeserializedBracket = data =>
  data && data.bracket
    ? {...data, bracket: deserializeBracket(data.bracket)}
    : data;

const waxTestsCollection = uid =>
  db.collection('users').doc(uid).collection('waxTests');
const waxTestDoc = (uid, testId) => waxTestsCollection(uid).doc(testId);

/**
 * Create a wax test. Returns the new doc id.
 * @param {string} uid  coach uid
 * @param {object} data WaxTestInput (see core buildWaxTestCreatePayload)
 */
export async function createWaxTest(uid, data) {
  if (!uid) {
    throw new Error('createWaxTest: uid is required');
  }
  const payload = {
    ...withSerializedBracket(buildWaxTestCreatePayload(data)),
    createdAt: firestore.FieldValue.serverTimestamp(),
    updatedAt: firestore.FieldValue.serverTimestamp(),
  };
  const ref = await waxTestsCollection(uid).add(payload);
  return ref.id;
}

/**
 * Merge a partial update (bracket progress, status, combinations,
 * performance numbers). Bumps updatedAt.
 */
export async function updateWaxTest(uid, testId, partial) {
  if (!uid || !testId) {
    throw new Error('updateWaxTest: uid and testId are required');
  }
  await waxTestDoc(uid, testId).set(
    {
      ...withSerializedBracket(partial),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    },
    {merge: true},
  );
}

export async function getWaxTest(uid, testId) {
  if (!uid || !testId) {
    return null;
  }
  const snap = await waxTestDoc(uid, testId).get();
  return snap.exists
    ? withDeserializedBracket({id: snap.id, ...snap.data()})
    : null;
}

export async function deleteWaxTest(uid, testId) {
  if (!uid || !testId) {
    throw new Error('deleteWaxTest: uid and testId are required');
  }
  await waxTestDoc(uid, testId).delete();
}

/**
 * Live subscription to the coach's wax tests, newest first.
 */
export function subscribeWaxTests(uid, callback) {
  if (!uid) {
    callback([]);
    return () => {};
  }
  return waxTestsCollection(uid)
    .orderBy('createdAt', 'desc')
    .onSnapshot(
      snap => {
        const out = [];
        snap.forEach(d =>
          out.push(withDeserializedBracket({id: d.id, ...d.data()})),
        );
        callback(out);
      },
      () => callback([]),
    );
}
