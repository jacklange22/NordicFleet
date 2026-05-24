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
      coachId: role === 'athlete' ? data.coachId || null : null,
      // Coaches track their athletes' uids. Empty array for athletes.
      athleteIds: role === 'coach' ? data.athleteIds || [] : [],
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
 * Find a user by email. Used by coach lookup during signup. Returns the
 * first matching profile or null. Email match is exact (not case-insensitive)
 * because Firestore where() doesn't support case folding without an
 * extension.
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
 * Look up a coach by email and link the given athlete to them. Two-way:
 *   - athlete's coachId ← coach.uid
 *   - coach's athleteIds ← athleteIds + athleteUid (no duplicates)
 *
 * Throws when the email doesn't match a coach account.
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
  const coach = await findProfileByEmail(coachEmail);
  if (!coach) {
    const err = new Error('No account found with that email');
    err.code = 'coach/not-found';
    throw err;
  }
  if (coach.role !== 'coach') {
    const err = new Error('That account is not a coach');
    err.code = 'coach/not-a-coach';
    throw err;
  }
  if (coach.uid === athleteUid) {
    const err = new Error('You cannot be your own coach');
    err.code = 'coach/self-link';
    throw err;
  }

  // Write the athlete side.
  await updateProfile(athleteUid, {coachId: coach.uid});

  // Write the coach side — use arrayUnion so duplicates are impossible
  // even if this is called twice.
  await userDoc(coach.uid).set(
    {
      athleteIds: firestore.FieldValue.arrayUnion(athleteUid),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    },
    {merge: true},
  );

  return {coachUid: coach.uid};
}

/**
 * Unlink an athlete from their coach. Removes from both sides. Safe to call
 * when no coach is set.
 *
 * @param {string} athleteUid
 * @returns {Promise<void>}
 */
export async function removeCoach(athleteUid) {
  if (!athleteUid) {
    throw new Error('removeCoach: athleteUid is required');
  }
  const athlete = await getProfile(athleteUid);
  const coachUid = athlete && athlete.coachId;
  await updateProfile(athleteUid, {coachId: null});
  if (coachUid) {
    await userDoc(coachUid).set(
      {
        athleteIds: firestore.FieldValue.arrayRemove(athleteUid),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      },
      {merge: true},
    );
  }
}

/**
 * Read every athlete profile linked to this coach. Returns full profile
 * objects (not just IDs) so the dashboard can render names/emails directly.
 * Athletes with no public profile read access fall out.
 *
 * @param {string} coachUid
 * @returns {Promise<Array<object>>}
 */
export async function listAthletesForCoach(coachUid) {
  if (!coachUid) {
    return [];
  }
  const coach = await getProfile(coachUid);
  if (!coach || !coach.athleteIds || coach.athleteIds.length === 0) {
    return [];
  }
  const results = await Promise.all(
    coach.athleteIds.map(async uid => {
      try {
        return await getProfile(uid);
      } catch {
        return null;
      }
    }),
  );
  return results.filter(Boolean);
}

/**
 * Real-time subscription to the coach's athlete list. Watches the coach's
 * own document for changes to athleteIds, then refetches each athlete
 * profile. Returns the unsubscribe function from the coach-doc onSnapshot.
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
  return userDoc(coachUid).onSnapshot(
    async snap => {
      if (!snap.exists) {
        callback([]);
        return;
      }
      const data = snap.data();
      const ids = (data && data.athleteIds) || [];
      if (ids.length === 0) {
        callback([]);
        return;
      }
      const results = await Promise.all(
        ids.map(async uid => {
          try {
            return await getProfile(uid);
          } catch {
            return null;
          }
        }),
      );
      callback(results.filter(Boolean));
    },
    () => {
      callback([]);
    },
  );
}
