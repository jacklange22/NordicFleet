/**
 * The user profile document at `users/{uid}` in Firestore.
 *
 * @typedef {Object} Profile
 * @property {string}   uid
 * @property {string}   email
 * @property {string|null} [displayName]
 * @property {string|null} [name]            preferred display name (falls back to displayName / email)
 * @property {string|null} [image]           profile image URL
 * @property {number|null} [weight]          kg
 * @property {number|null} [height]          cm
 * @property {string|null} [team]
 * @property {string|null} [location]        free-text city / club
 * @property {'athlete'|'coach'} role
 * @property {string|null} [coachId]         athlete's currently-linked coach uid (null if no coach)
 * @property {*} [createdAt]                 Firestore Timestamp
 * @property {*} [updatedAt]                 Firestore Timestamp
 */

/**
 * Partial profile update payload — every field is optional.
 *
 * @typedef {Object} ProfileUpdate
 * @property {string}   [displayName]
 * @property {string}   [name]
 * @property {string}   [image]
 * @property {number|null} [weight]
 * @property {number|null} [height]
 * @property {string|null} [team]
 * @property {string|null} [location]
 * @property {'athlete'|'coach'} [role]
 * @property {string|null} [coachId]
 */

module.exports = {};
