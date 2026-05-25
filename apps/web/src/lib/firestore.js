// Read-side Firestore helpers for the web app. The web preview is
// read-mostly (no log-creation paths yet — those stay on iOS for now),
// so the surface here is intentionally small.

import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
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
