import {db, firestore} from './firebase';

const userDoc = uid => db.collection('users').doc(uid);
const usersCollection = () => db.collection('users');

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
 * @param {{email?: string, displayName?: string, role?: 'athlete'|'coach'}} data
 * @returns {Promise<void>}
 */
export async function createProfile(uid, data = {}) {
  if (!uid) {
    throw new Error('createProfile: uid is required');
  }
  // Initial profile write: every field exists with a default if not supplied.
  // Use updateProfile for subsequent merges that should preserve existing values.
  const role = data.role === 'coach' ? 'coach' : 'athlete';
  await userDoc(uid).set(
    {
      email: data.email || null,
      displayName: data.displayName || null,
      weight: data.weight ?? null,
      height: data.height ?? null,
      team: data.team || null,
      location: data.location || null,
      role,
      // Athletes track their chosen coach (uid). Null until they set one.
      // (Coach side isn't denormalized — see listAthletesForCoach for the
      // reverse query.)
      coachId: role === 'athlete' ? data.coachId || null : null,
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

/**
 * Find a user by email. Returns null when no match. Email match is exact
 * (not case-insensitive) because Firestore where() doesn't support case
 * folding without an extension.
 *
 * This is a thin helper — most callers want `findCoachByEmail`, which
 * also filters by role so Firestore rules permit the read.
 *
 * @param {string} email
 * @returns {Promise<object|null>}
 */
export async function findProfileByEmail(email) {
  if (!email) {
    return null;
  }
  const snap = await usersCollection().where('email', '==', email).get();
  if (snap.empty) {
    return null;
  }
  const doc = snap.docs[0];
  return {uid: doc.id, ...doc.data()};
}

/**
 * Find a coach by email. Two filters: email match + role=='coach'. The
 * role filter lets Firestore rules permit the read — coach profiles are
 * effectively public to authenticated users for lookup purposes.
 *
 * @param {string} email
 * @returns {Promise<object|null>}
 */
export async function findCoachByEmail(email) {
  if (!email) {
    return null;
  }
  const snap = await usersCollection()
    .where('email', '==', email)
    .where('role', '==', 'coach')
    .get();
  if (snap.empty) {
    return null;
  }
  const doc = snap.docs[0];
  return {uid: doc.id, ...doc.data()};
}

/**
 * Look up a coach by email and link the given athlete to them. The link
 * is one-way: only the athlete's own coachId field is written. The
 * coach's athlete list is derived via a query (see
 * listAthletesForCoach), which avoids a cross-user write that Firestore
 * rules would otherwise have to permit.
 *
 * @param {string} athleteUid
 * @param {string} coachEmail
 * @returns {Promise<{coachUid: string}>}
 */
export async function setCoachByEmail(athleteUid, coachEmail) {
  if (!athleteUid) {
    throw new Error('setCoachByEmail: athleteUid is required');
  }
  if (!coachEmail) {
    throw new Error('setCoachByEmail: coachEmail is required');
  }
  // Use the role-filtered query so the read is permitted by the
  // Firestore rules (coach profiles are readable to any authenticated
  // user when role=='coach' is in the filter; arbitrary profile reads
  // are not).
  const coach = await findCoachByEmail(coachEmail);
  if (!coach) {
    // Could be: no account with that email, OR the account is an
    // athlete (not a coach). We can't tell from this side without
    // leaking, so surface a single message.
    const err = new Error('No coach account found with that email');
    err.code = 'coach/not-found';
    throw err;
  }
  if (coach.uid === athleteUid) {
    const err = new Error('You cannot be your own coach');
    err.code = 'coach/self-link';
    throw err;
  }

  await updateProfile(athleteUid, {coachId: coach.uid});
  return {coachUid: coach.uid};
}

/**
 * Unlink an athlete from their coach. Idempotent.
 *
 * @param {string} athleteUid
 * @returns {Promise<void>}
 */
export async function removeCoach(athleteUid) {
  if (!athleteUid) {
    throw new Error('removeCoach: athleteUid is required');
  }
  await updateProfile(athleteUid, {coachId: null});
}

/**
 * Read every athlete linked to this coach via a `users where coachId ==
 * coachUid` query. Firestore rules permit a coach to read those docs
 * (see `firestore.rules`).
 *
 * @param {string} coachUid
 * @returns {Promise<Array<object>>}
 */
export async function listAthletesForCoach(coachUid) {
  if (!coachUid) {
    return [];
  }
  const snap = await usersCollection().where('coachId', '==', coachUid).get();
  const out = [];
  snap.forEach(d => out.push({uid: d.id, ...d.data()}));
  return out;
}

/**
 * Real-time subscription to the coach's athlete list, via a `users where
 * coachId == coachUid` onSnapshot. Returns the unsubscribe function.
 *
 * @param {string} coachUid
 * @param {(athletes: Array<object>) => void} callback
 * @returns {() => void} unsubscribe
 */
export function subscribeAthletesForCoach(coachUid, callback) {
  if (!coachUid) {
    callback([]);
    return () => {};
  }
  return usersCollection()
    .where('coachId', '==', coachUid)
    .onSnapshot(
      snap => {
        const out = [];
        snap.forEach(d => out.push({uid: d.id, ...d.data()}));
        callback(out);
      },
      () => {
        callback([]);
      },
    );
}
