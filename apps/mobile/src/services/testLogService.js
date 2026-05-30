import {db, firestore} from './firebase';

const testLogsCollection = uid =>
  db.collection('users').doc(uid).collection('testLogs');

function mapDoc(d) {
  return {id: d.id, ...d.data()};
}

function toNumberOrNull(v) {
  if (v === undefined || v === null || v === '') {
    return null;
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Test logs for a single ski, newest first.
 * @param {string} uid
 * @param {string} skiId
 * @returns {Promise<Array<object>>}
 */
export async function listTestLogsForSki(uid, skiId) {
  if (!uid || !skiId) {
    return [];
  }
  const snap = await testLogsCollection(uid)
    .where('skiId', '==', skiId)
    .orderBy('date', 'desc')
    .get();
  const out = [];
  snap.forEach(d => out.push(mapDoc(d)));
  return out;
}

/**
 * Every test log for the user, newest first.
 * @param {string} uid
 * @returns {Promise<Array<object>>}
 */
export async function listAllTestLogs(uid) {
  if (!uid) {
    return [];
  }
  const snap = await testLogsCollection(uid).orderBy('date', 'desc').get();
  const out = [];
  snap.forEach(d => out.push(mapDoc(d)));
  return out;
}

/**
 * Create a test log. Returns the new doc ID.
 * @param {string} uid
 * @param {object} data
 * @returns {Promise<string>}
 */
export async function createTestLog(uid, data) {
  if (!uid) {
    throw new Error('createTestLog: uid is required');
  }
  if (!data || !data.skiId) {
    throw new Error('createTestLog: data.skiId is required');
  }
  const payload = {
    skiId: data.skiId,
    date: data.date || firestore.FieldValue.serverTimestamp(),
    temperature: toNumberOrNull(data.temperature),
    humidity: toNumberOrNull(data.humidity),
    snowType: data.snowType ? String(data.snowType).toLowerCase() : null,
    surface: data.surface ? String(data.surface).toLowerCase() : null,
    glideWax: data.glideWax || null,
    kickWax: data.kickWax || null,
    glideRating: toNumberOrNull(data.glideRating) ?? 0,
    kickRating: toNumberOrNull(data.kickRating),
    stabilityRating: toNumberOrNull(data.stabilityRating),
    climbingRating: toNumberOrNull(data.climbingRating),
    notes: data.notes || '',
    createdAt: firestore.FieldValue.serverTimestamp(),
  };
  const ref = await testLogsCollection(uid).add(payload);
  return ref.id;
}

/**
 * Read a single test log by id (used to populate the edit form).
 * @param {string} uid
 * @param {string} logId
 * @returns {Promise<object|null>}
 */
export async function getTestLog(uid, logId) {
  if (!uid || !logId) {
    return null;
  }
  const snap = await testLogsCollection(uid).doc(logId).get();
  if (!snap.exists) {
    return null;
  }
  return {id: snap.id, ...snap.data()};
}

/**
 * Update an existing test log. Edits conditions + ratings + notes and
 * stamps updatedAt. skiId, the original date, createdAt, and the stored
 * location are intentionally left untouched.
 * @param {string} uid
 * @param {string} logId
 * @param {object} data
 * @returns {Promise<void>}
 */
export async function updateTestLog(uid, logId, data) {
  if (!uid) {
    throw new Error('updateTestLog: uid is required');
  }
  if (!logId) {
    throw new Error('updateTestLog: logId is required');
  }
  const payload = {
    temperature: toNumberOrNull(data.temperature),
    humidity: toNumberOrNull(data.humidity),
    snowType: data.snowType ? String(data.snowType).toLowerCase() : null,
    surface: data.surface ? String(data.surface).toLowerCase() : null,
    glideWax: data.glideWax || null,
    kickWax: data.kickWax || null,
    glideRating: toNumberOrNull(data.glideRating) ?? 0,
    kickRating: toNumberOrNull(data.kickRating),
    stabilityRating: toNumberOrNull(data.stabilityRating),
    climbingRating: toNumberOrNull(data.climbingRating),
    notes: data.notes || '',
    updatedAt: firestore.FieldValue.serverTimestamp(),
  };
  await testLogsCollection(uid).doc(logId).update(payload);
}

/**
 * Subscribe to EVERY test log for the user, newest first. Powers the
 * full test-history screen (reached from the dashboard).
 * @param {string} uid
 * @param {(logs: Array<object>) => void} callback
 * @returns {() => void} unsubscribe
 */
export function subscribeAllTestLogs(uid, callback) {
  if (!uid) {
    callback([]);
    return () => {};
  }
  return testLogsCollection(uid)
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
 * Subscribe to test logs for a single ski, newest first.
 * @param {string} uid
 * @param {string} skiId
 * @param {(logs: Array<object>) => void} callback
 * @returns {() => void} unsubscribe
 */
export function subscribeTestLogsForSki(uid, skiId, callback) {
  if (!uid || !skiId) {
    callback([]);
    return () => {};
  }
  return testLogsCollection(uid)
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
