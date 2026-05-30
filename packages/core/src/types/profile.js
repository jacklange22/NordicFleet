/**
 * The user profile document at `users/{uid}` in Firestore.
 *
 * @typedef {Object} Profile
 * @property {string}   uid
 * @property {string}   email
 * @property {string|null} [displayName]
 * @property {string|null} [name]            preferred display name (falls back to displayName / email)
 * @property {string|null} [image]           profile image URL
 * @property {number|null} [weight]          stored in kg (display unit is a preference)
 * @property {number|null} [height]          stored in cm (display unit is a preference)
 * @property {'kg'|'lb'} [weightUnit]        preferred weight display unit (default kg)
 * @property {'cm'|'in'} [heightUnit]        preferred height display unit (default cm)
 * @property {string|null} [team]
 * @property {string|null} [location]        free-text city / club
 * @property {boolean}  isCoach              has the coaching capability (own fleet PLUS athlete management)
 * @property {'athlete'|'coach'} [role]      DEPRECATED legacy mirror of isCoach; kept readable for back-compat, not used for routing
 * @property {string|null} [coachId]         this user's currently-linked coach uid (null if none). Every user can have a coach.
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
 * @property {'kg'|'lb'} [weightUnit]
 * @property {'cm'|'in'} [heightUnit]
 * @property {string|null} [team]
 * @property {string|null} [location]
 * @property {'athlete'|'coach'} [role]
 * @property {string|null} [coachId]
 */

module.exports = {};
