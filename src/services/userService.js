import {db, firestore} from './firebase';

const userDoc = uid => db.collection('users').doc(uid);

/**
 * Fetch the user profile document.
 * @param {string} uid
 * @returns {Promise<object|null>} the profile data or null when missing.
 */
export async function getProfile(uid) {
  if (!uid) {
    return null;
  }
  const snap = await userDoc(uid).get();
  if (!snap.exists) {
    return null;
  }
  return {uid, ...snap.data()};
}

/**
 * Create an initial profile doc. Idempotent — uses set with merge so we never
 * blow away an existing record.
 * @param {string} uid
 * @param {{email?: string, displayName?: string}} data
 * @returns {Promise<void>}
 */
export async function createProfile(uid, data = {}) {
  if (!uid) {
    throw new Error('createProfile: uid is required');
  }
  await userDoc(uid).set(
    {
      email: data.email || null,
      displayName: data.displayName || null,
      weight: data.weight ?? null,
      height: data.height ?? null,
      team: data.team || null,
      location: data.location || null,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    },
    {merge: true},
  );
}

/**
 * Merge a partial update into the profile. Always bumps updatedAt.
 * @param {string} uid
 * @param {object} partial
 * @returns {Promise<void>}
 */
export async function updateProfile(uid, partial) {
  if (!uid) {
    throw new Error('updateProfile: uid is required');
  }
  await userDoc(uid).set(
    {
      ...partial,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    },
    {merge: true},
  );
}

/**
 * Subscribe to live updates of the profile doc.
 * @param {string} uid
 * @param {(profile: object|null) => void} callback
 * @returns {() => void} unsubscribe
 */
export function subscribeProfile(uid, callback) {
  if (!uid) {
    callback(null);
    return () => {};
  }
  return userDoc(uid).onSnapshot(
    snap => {
      if (!snap.exists) {
        callback(null);
        return;
      }
      callback({uid, ...snap.data()});
    },
    () => {
      // Errors in subscriptions deliver null; callers decide what to show.
      callback(null);
    },
  );
}
