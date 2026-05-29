// Data export — shapes a user's full account data into a portable JSON
// object. Pure + platform-free: the platform layer fetches the docs
// (profile, skis, wax logs, test logs, wax tests) and hands them here;
// this module normalizes timestamps and assembles the envelope. Used by
// the "Download / export my data" compliance feature on web and mobile.

const EXPORT_VERSION = 1;

// Firestore Timestamps serialize poorly (they're class instances). Walk
// the value and convert any Timestamp-like object (has toDate()) to an
// ISO string so the exported JSON is human- and machine-readable.
function normalizeValue(value) {
  if (value == null) {
    return value;
  }
  if (typeof value === 'object') {
    if (typeof value.toDate === 'function') {
      try {
        return value.toDate().toISOString();
      } catch {
        return null;
      }
    }
    // Firestore Timestamp shape {seconds, nanoseconds} without toDate.
    if (
      typeof value.seconds === 'number' &&
      typeof value.nanoseconds === 'number' &&
      Object.keys(value).length === 2
    ) {
      return new Date(value.seconds * 1000).toISOString();
    }
    if (Array.isArray(value)) {
      return value.map(normalizeValue);
    }
    const out = {};
    for (const k of Object.keys(value)) {
      out[k] = normalizeValue(value[k]);
    }
    return out;
  }
  return value;
}

function normalizeCollection(list) {
  return Array.isArray(list) ? list.map(normalizeValue) : [];
}

/**
 * Build a portable export of a user's account data.
 *
 * @param {object} input
 * @param {object} [input.profile]
 * @param {Array}  [input.skis]
 * @param {Array}  [input.waxLogs]
 * @param {Array}  [input.testLogs]
 * @param {Array}  [input.waxTests]
 * @param {string} [input.uid]
 * @param {Date|string} [input.exportedAt]  defaults to now
 * @returns {object} the export envelope (JSON-serializable)
 */
function buildDataExport(input = {}) {
  const exportedAt =
    input.exportedAt instanceof Date
      ? input.exportedAt.toISOString()
      : typeof input.exportedAt === 'string'
        ? input.exportedAt
        : new Date().toISOString();

  const skis = normalizeCollection(input.skis);
  const waxLogs = normalizeCollection(input.waxLogs);
  const testLogs = normalizeCollection(input.testLogs);
  const waxTests = normalizeCollection(input.waxTests);

  return {
    app: 'NordicFleet',
    exportVersion: EXPORT_VERSION,
    exportedAt,
    uid: input.uid || (input.profile && input.profile.uid) || null,
    profile: input.profile ? normalizeValue(input.profile) : null,
    counts: {
      skis: skis.length,
      waxLogs: waxLogs.length,
      testLogs: testLogs.length,
      waxTests: waxTests.length,
    },
    skis,
    waxLogs,
    testLogs,
    waxTests,
  };
}

/**
 * Serialize an export to a pretty JSON string.
 * @param {object} exportObj  result of buildDataExport
 */
function dataExportToJSON(exportObj) {
  return JSON.stringify(exportObj, null, 2);
}

/**
 * A stable, filesystem-safe filename for the export.
 * e.g. nordicfleet-export-2026-05-29.json
 */
function dataExportFilename(exportObj) {
  const iso =
    (exportObj && exportObj.exportedAt) || new Date().toISOString();
  const day = String(iso).slice(0, 10);
  return `nordicfleet-export-${day}.json`;
}

module.exports = {
  EXPORT_VERSION,
  buildDataExport,
  dataExportToJSON,
  dataExportFilename,
};
