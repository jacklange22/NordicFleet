/**
 * @typedef {Object} TestLocation
 * @property {number} latitude
 * @property {number} longitude
 * @property {number} [accuracy]   meters
 * @property {string|null} [label] human label ("Craftsbury") — may be user-entered
 */

/**
 * A test-log document at `users/{uid}/testLogs/{logId}`.
 *
 * @typedef {Object} TestLog
 * @property {string}        id
 * @property {string}        skiId
 * @property {*}             date              Firestore Timestamp
 * @property {number|null}   [temperature]     °C (allow negative)
 * @property {number|null}   [humidity]        % (0-100)
 * @property {string|null}   [snowType]        'old' | 'new' | 'manmade'
 * @property {string|null}   [surface]         'hardpack' | 'powder' | 'corduroy' | 'slush'
 * @property {string|null}   [glideWax]        free text
 * @property {string|null}   [glideWaxId]      dictionary id
 * @property {string|null}   [kickWax]         null for skate
 * @property {string|null}   [kickWaxId]
 * @property {number}        glideRating       1-10
 * @property {number|null}   [kickRating]      classic only
 * @property {number|null}   [stabilityRating] skate only
 * @property {number|null}   [climbingRating]  skate only
 * @property {string}        [notes]
 * @property {TestLocation|null} [location]    optional geotag (Phase F)
 * @property {*}             [createdAt]
 */

/**
 * @typedef {Object} TestLogInput
 * @property {string}        skiId
 * @property {number|string|null} [temperature]
 * @property {number|string|null} [humidity]
 * @property {string|null}   [snowType]
 * @property {string|null}   [surface]
 * @property {string|null}   [glideWax]
 * @property {string|null}   [glideWaxId]
 * @property {string|null}   [kickWax]
 * @property {string|null}   [kickWaxId]
 * @property {number|string} [glideRating]
 * @property {number|string|null} [kickRating]
 * @property {number|string|null} [stabilityRating]
 * @property {number|string|null} [climbingRating]
 * @property {string}        [notes]
 * @property {TestLocation|null} [location]
 */

module.exports = {};
