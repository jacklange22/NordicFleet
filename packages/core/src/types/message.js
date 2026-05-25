/**
 * A message in the top-level `messages/{messageId}` collection.
 *
 * Sent coach → athlete only. Athlete can mark as read. Either party
 * can read messages where they're the from/to uid. See firestore.rules.
 *
 * @typedef {Object} Message
 * @property {string}   id
 * @property {string}   fromUid             coach uid
 * @property {string}   toUid               athlete uid
 * @property {string}   body                markdown-allowed plain text
 * @property {string}   [subject]           optional short title
 * @property {string[]} [attachedSkiIds]    athlete's skiIds the coach is calling out
 * @property {boolean}  read                athlete has opened it
 * @property {*}        createdAt           Firestore Timestamp
 * @property {*}        updatedAt           Firestore Timestamp
 */

/**
 * @typedef {Object} MessageInput
 * @property {string}   toUid
 * @property {string}   body
 * @property {string}   [subject]
 * @property {string[]} [attachedSkiIds]
 */

module.exports = {};
