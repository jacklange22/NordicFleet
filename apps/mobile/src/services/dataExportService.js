// Data export - read the user's full account and hand a JSON file to
// the iOS share sheet. The export shape is built by @nordicfleet/core
// (buildDataExport); this service just fetches the docs and shares.

import {Buffer} from 'buffer';
import RNShare from 'react-native-share';
import {buildDataExport, dataExportToJSON, dataExportFilename} from '@nordicfleet/core';
import {db} from './firebase';

async function readCollection(uid, sub) {
  const snap = await db.collection('users').doc(uid).collection(sub).get();
  const out = [];
  snap.forEach(d => out.push({id: d.id, ...d.data()}));
  return out;
}

/**
 * Build the export envelope for a user (no sharing) - exposed so it can
 * be unit-tested and reused.
 * @param {string} uid
 */
export async function buildUserExport(uid) {
  if (!uid) {
    throw new Error('buildUserExport: uid is required');
  }
  const profileSnap = await db.collection('users').doc(uid).get();
  const profile = profileSnap.exists
    ? {uid: profileSnap.id, ...profileSnap.data()}
    : null;
  const [skis, waxLogs, testLogs, waxTests] = await Promise.all([
    readCollection(uid, 'skis'),
    readCollection(uid, 'waxLogs'),
    readCollection(uid, 'testLogs'),
    readCollection(uid, 'waxTests'),
  ]);
  return buildDataExport({uid, profile, skis, waxLogs, testLogs, waxTests});
}

/**
 * Read the account, serialize to JSON, and open the share sheet with the
 * file attached. User cancellation is a no-op ({success:false}).
 * @param {string} uid
 * @returns {Promise<{success: boolean}>}
 */
export async function exportAndShareUserData(uid) {
  const exportObj = await buildUserExport(uid);
  const json = dataExportToJSON(exportObj);
  const filename = dataExportFilename(exportObj);
  const base64 = Buffer.from(json, 'utf8').toString('base64');
  try {
    const result = await RNShare.open({
      url: `data:application/json;base64,${base64}`,
      filename,
      type: 'application/json',
      title: 'NordicFleet data export',
      subject: 'NordicFleet data export',
      failOnCancel: false,
    });
    return {success: !!result?.success};
  } catch (err) {
    if (err && /did not share|cancel/i.test(String(err.message || err))) {
      return {success: false};
    }
    throw err;
  }
}
