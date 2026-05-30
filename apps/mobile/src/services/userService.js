import {
  buildProfileCreatePayload,
  buildCoachCapabilityPayload,
  needsCoachBackfill,
  deriveIsCoach,
} from '@nordicfleet/core';
import {auth, db, firestore} from './firebase';

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
 * Create an initial profile doc. Idempotent - uses set with merge so we never
 * blow away an existing record.
 * @param {string} uid
 * @param {{email?: string, displayName?: string, role?: 'athlete'|'coach'}} data
 * @returns {Promise<void>}
 */
export async function createProfile(uid, data = {}) {
  if (!uid) {
    throw new Error('createProfile: uid is required');
  }
  // Capability model: every user gets a personal fleet; isCoach is an
  // added capability. buildProfileCreatePayload normalizes the fields
  // and keeps a legacy `role` mirror for back-compat. The platform
  // layer (here) attaches the server timestamps.
  await userDoc(uid).set(
    {
      ...buildProfileCreatePayload(data),
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    },
    {merge: true},
  );
}

/**
 * Migrate-on-read: when the app loads a profile that predates the
 * isCoach field, derive it from the legacy role and write it back
 * once. Safe to call on every login - it no-ops when isCoach already
 * exists. Returns the derived isCoach so the caller can use it
 * immediately without waiting for the write.
 *
 * @param {string} uid
 * @param {object|null} profile  the just-loaded profile doc
 * @returns {Promise<boolean>} the effective isCoach value
 */
export async function backfillCoachCapability(uid, profile) {
  const isCoach = deriveIsCoach(profile);
  if (uid && needsCoachBackfill(profile)) {
    try {
      await userDoc(uid).set(
        {isCoach, updatedAt: firestore.FieldValue.serverTimestamp()},
        {merge: true},
      );
    } catch {
      // Backfill is best-effort. deriveIsCoach already gave us the
      // right value to use this session; the write will retry next
      // login if it failed.
    }
  }
  return isCoach;
}

/**
 * Toggle the coaching capability on or off.
 *
 * Turning it ON just flips the flag. Turning it OFF additionally runs
 * the athlete cascade: every athlete with coachId == this uid gets
 * cleared (same logic as account deletion's coach-unlink step), so we
 * don't leave athletes pointing at someone who's no longer coaching.
 *
 * @param {string} uid
 * @param {boolean} isCoach
 * @returns {Promise<{clearedAthletes: number}>}
 */
export async function setCoachCapability(uid, isCoach) {
  if (!uid) {
    throw new Error('setCoachCapability: uid is required');
  }
  let clearedAthletes = 0;
  if (!isCoach) {
    // Cascade: unlink athletes before dropping the capability.
    try {
      const athletes = await usersCollection()
        .where('coachId', '==', uid)
        .get();
      if (!athletes.empty) {
        const batch = db.batch();
        athletes.forEach(doc => {
          batch.set(
            doc.ref,
            {
              coachId: null,
              updatedAt: firestore.FieldValue.serverTimestamp(),
            },
            {merge: true},
          );
        });
        await batch.commit();
        clearedAthletes = athletes.size;
      }
    } catch {
      // Tolerate - if there are no athletes or the query fails, we
      // still drop the capability below.
    }
  }
  await userDoc(uid).set(
    {
      ...buildCoachCapabilityPayload(isCoach),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    },
    {merge: true},
  );
  return {clearedAthletes};
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
 * This is a thin helper - most callers want `findCoachByEmail`, which
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
 * role filter lets Firestore rules permit the read - coach profiles are
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
  // Clear the permission too so the next coach starts at the default (view).
  await updateProfile(athleteUid, {coachId: null, coachPermission: null});
}

const COACH_PERMISSION_LEVELS = ['view', 'comment', 'edit'];

/**
 * Athlete sets how much access their coach has. Stored on the athlete's own
 * user doc (owner-write), so a coach can never raise their own permission.
 * Invalid values fall back to 'view'.
 *
 * @param {string} athleteUid
 * @param {'view'|'comment'|'edit'} level
 * @returns {Promise<void>}
 */
export async function setCoachPermission(athleteUid, level) {
  if (!athleteUid) {
    throw new Error('setCoachPermission: athleteUid is required');
  }
  const value = COACH_PERMISSION_LEVELS.includes(level) ? level : 'view';
  await updateProfile(athleteUid, {coachPermission: value});
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

/**
 * Permanently delete the current user's account and ALL their data.
 *
 * Steps (in order - see Self-recovery in the brief: don't skip any
 * because partial deletes leave orphan data):
 *   1. If the user is a coach, find every athlete with
 *      coachId == this uid and clear it. Firestore rules don't allow
 *      writing arbitrary user docs, so the coach can only do this
 *      while authenticated as themselves - hence we run it BEFORE
 *      the auth user is deleted. (This step is also tolerant: if the
 *      query / write fails because no athletes reference this coach,
 *      we proceed.)
 *   2. Batch-delete all docs in skis / waxLogs / testLogs.
 *   3. Delete the user doc.
 *   4. Delete the Firebase Auth user. This requires recent reauth;
 *      callers must reauthenticate immediately before invoking this.
 *
 * After step 4 succeeds, the auth state becomes null and the app's
 * AuthContext listener will route back to Welcome.
 *
 * @returns {Promise<void>}
 */
export async function deleteAccount() {
  const user = auth().currentUser;
  if (!user) {
    throw new Error('Not signed in');
  }
  const uid = user.uid;

  // 1. If the user is a coach, unlink every athlete pointing at them.
  //    Tolerate failures here (the user may not be a coach, or the
  //    query may be empty) - we just move on.
  try {
    const athletes = await usersCollection()
      .where('coachId', '==', uid)
      .get();
    if (!athletes.empty) {
      const batch = db.batch();
      athletes.forEach(doc => {
        batch.set(
          doc.ref,
          {coachId: null, updatedAt: firestore.FieldValue.serverTimestamp()},
          {merge: true},
        );
      });
      await batch.commit();
    }
  } catch {
    // Non-coach users (or no athletes referencing this user) end up
    // here. Continue with deletion.
  }

  // 2. Batch-delete subcollections. Firestore doesn't auto-cascade,
  //    and a single batch can hold up to 500 ops, so we chunk just in
  //    case. Per-collection commit keeps memory low.
  const subcollections = ['skis', 'waxLogs', 'testLogs', 'waxTests'];
  for (const sub of subcollections) {
    const snap = await db
      .collection('users')
      .doc(uid)
      .collection(sub)
      .get();
    if (snap.empty) {
      continue;
    }
    const docs = snap.docs;
    for (let i = 0; i < docs.length; i += 400) {
      const chunk = docs.slice(i, i + 400);
      const batch = db.batch();
      chunk.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }
  }

  // 3. Delete the parent user doc.
  await db.collection('users').doc(uid).delete();

  // 4. Delete the auth user. Throws auth/requires-recent-login if the
  //    user hasn't reauth'd in the last ~5 minutes - the UI handles
  //    that by gating the call behind a reauth modal.
  await user.delete();
}
