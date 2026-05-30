import {db, firestore} from './firebase';

const waxLogsCollection = uid =>
  db.collection('users').doc(uid).collection('waxLogs');

function mapDoc(d) {
  return {id: d.id, ...d.data()};
}

/**
 * Wax logs for a single ski, newest first.
 * @param {string} uid
 * @param {string} skiId
 * @returns {Promise<Array<object>>}
 */
export async function listWaxLogsForSki(uid, skiId) {
  if (!uid || !skiId) {
    return [];
  }
  const snap = await waxLogsCollection(uid)
    .where('skiId', '==', skiId)
    .orderBy('date', 'desc')
    .get();
  const out = [];
  snap.forEach(d => out.push(mapDoc(d)));
  return out;
}

/**
 * Every wax log for the user, newest first.
 * @param {string} uid
 * @returns {Promise<Array<object>>}
 */
export async function listAllWaxLogs(uid) {
  if (!uid) {
    return [];
  }
  const snap = await waxLogsCollection(uid).orderBy('date', 'desc').get();
  const out = [];
  snap.forEach(d => out.push(mapDoc(d)));
  return out;
}

/**
 * Create a wax log. Returns the new doc ID.
 * @param {string} uid
 * @param {object} data
 * @returns {Promise<string>}
 */
export async function createWaxLog(uid, data) {
  if (!uid) {
    throw new Error('createWaxLog: uid is required');
  }
  if (!data || !data.skiId) {
    throw new Error('createWaxLog: data.skiId is required');
  }
  const payload = {
    skiId: data.skiId,
    date: data.date || firestore.FieldValue.serverTimestamp(),
    binder: data.binder || null,
    kickLayers: Number.isFinite(Number(data.kickLayers))
      ? Number(data.kickLayers)
      : 0,
    kickWax: data.kickWax || null,
    glideLayers: Number.isFinite(Number(data.glideLayers))
      ? Number(data.glideLayers)
      : 0,
    glideWaxes: Array.isArray(data.glideWaxes) ? data.glideWaxes : [],
    notes: data.notes || '',
    createdAt: firestore.FieldValue.serverTimestamp(),
  };
  const ref = await waxLogsCollection(uid).add(payload);
  return ref.id;
}

/**
 * Read a single wax log by id (used to populate the edit form).
 * @param {string} uid
 * @param {string} logId
 * @returns {Promise<object|null>}
 */
export async function getWaxLog(uid, logId) {
  if (!uid || !logId) {
    return null;
  }
  const snap = await waxLogsCollection(uid).doc(logId).get();
  if (!snap.exists) {
    return null;
  }
  return {id: snap.id, ...snap.data()};
}

/**
 * Update an existing wax log. Edits only the wax fields and stamps
 * updatedAt. skiId, the original date, and createdAt are intentionally
 * left untouched so the log keeps its place in history.
 * @param {string} uid
 * @param {string} logId
 * @param {object} data
 * @returns {Promise<void>}
 */
export async function updateWaxLog(uid, logId, data) {
  if (!uid) {
    throw new Error('updateWaxLog: uid is required');
  }
  if (!logId) {
    throw new Error('updateWaxLog: logId is required');
  }
  const payload = {
    binder: data.binder || null,
    kickLayers: Number.isFinite(Number(data.kickLayers))
      ? Number(data.kickLayers)
      : 0,
    kickWax: data.kickWax || null,
    glideLayers: Number.isFinite(Number(data.glideLayers))
      ? Number(data.glideLayers)
      : 0,
    glideWaxes: Array.isArray(data.glideWaxes) ? data.glideWaxes : [],
    notes: data.notes || '',
    updatedAt: firestore.FieldValue.serverTimestamp(),
  };
  await waxLogsCollection(uid).doc(logId).update(payload);
}

/**
 * Subscribe to EVERY wax log for the user, newest first. Powers the
 * full wax-history screen (reached from the dashboard).
 * @param {string} uid
 * @param {(logs: Array<object>) => void} callback
 * @returns {() => void} unsubscribe
 */
export function subscribeAllWaxLogs(uid, callback) {
  if (!uid) {
    callback([]);
    return () => {};
  }
  return waxLogsCollection(uid)
    .orderBy('date', 'desc')
    .onSnapshot(
      snap => {
        const logs = [];
        snap.forEach(d => logs.push(mapDoc(d)));
        callback(logs);
      },
      () => {
        callback([]);
      },
    );
}

/**
 * Subscribe to wax logs for a single ski, newest first.
 * @param {string} uid
 * @param {string} skiId
 * @param {(logs: Array<object>) => void} callback
 * @returns {() => void} unsubscribe
 */
export function subscribeWaxLogsForSki(uid, skiId, callback) {
  if (!uid || !skiId) {
    callback([]);
    return () => {};
  }
  return waxLogsCollection(uid)
    .where('skiId', '==', skiId)
    .orderBy('date', 'desc')
    .onSnapshot(
      snap => {
        const logs = [];
        snap.forEach(d => logs.push(mapDoc(d)));
        callback(logs);
      },
      () => {
        callback([]);
      },
    );
}
