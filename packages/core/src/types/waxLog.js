/**
 * A wax-log document at `users/{uid}/waxLogs/{logId}`.
 *
 * @typedef {Object} WaxLog
 * @property {string}        id
 * @property {string}        skiId
 * @property {*}             date            Firestore Timestamp (the date of the waxing)
 * @property {string|null}   [binder]        binder name (free text), or null when none
 * @property {string|null}   [binderId]      Wax dictionary id (when picked from typeahead)
 * @property {number}        kickLayers      integer count (0 for skate)
 * @property {string|null}   [kickWax]       free text wax name (e.g. "VR40")
 * @property {string|null}   [kickWaxId]     Wax dictionary id
 * @property {number}        glideLayers     integer count (>= 1)
 * @property {string[]}      glideWaxes      one entry per glide layer (free text)
 * @property {string[]}      [glideWaxIds]   parallel array of dictionary ids; entries may be null
 * @property {string}        [notes]
 * @property {*}             [createdAt]
 */

/**
 * @typedef {Object} WaxLogInput
 * @property {string}        skiId
 * @property {string|null}   [binder]
 * @property {string|null}   [binderId]
 * @property {number|string} [kickLayers]
 * @property {string|null}   [kickWax]
 * @property {string|null}   [kickWaxId]
 * @property {number|string} [glideLayers]
 * @property {string[]}      [glideWaxes]
 * @property {string[]}      [glideWaxIds]
 * @property {string}        [notes]
 */

module.exports = {};
