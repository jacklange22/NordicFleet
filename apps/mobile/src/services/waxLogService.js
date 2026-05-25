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
