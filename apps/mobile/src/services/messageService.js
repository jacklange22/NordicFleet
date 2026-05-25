// Coach → athlete messages. Top-level `messages/{id}` collection.
//
// Rule summary (firestore.rules):
//   - Either party can read messages where they're listed (fromUid/toUid).
//   - Coach creates a message; rules verify the recipient's coachId
//     points at the coach (i.e. the relationship is currently linked).
//   - Athlete can flip `read: true` (and the platform updates updatedAt).
//
// No push notifications, no Cloud Functions — UI surfaces unread
// counts via a live subscription.

import {
  buildMessageCreatePayload,
  buildMarkReadPayload,
} from '@nordicfleet/core';
import {db, firestore} from './firebase';

const messagesCollection = () => db.collection('messages');
const messageDoc = id => messagesCollection().doc(id);

/**
 * Coach-side: send a message to one of their athletes.
 *
 * @param {Object} args
 * @param {string} args.fromUid       coach uid
 * @param {string} args.toUid         athlete uid
 * @param {string} args.body
 * @param {string} [args.subject]
 * @param {string[]} [args.attachedSkiIds]
 * @returns {Promise<string>} new message id
 */
export async function sendMessage(args) {
  const payload = {
    ...buildMessageCreatePayload(args),
    createdAt: firestore.FieldValue.serverTimestamp(),
    updatedAt: firestore.FieldValue.serverTimestamp(),
  };
  const ref = await messagesCollection().add(payload);
  return ref.id;
}

/**
 * Athlete-side: mark a message read. Fires on open.
 */
export async function markRead(messageId) {
  if (!messageId) {
    throw new Error('markRead: messageId is required');
  }
  await messageDoc(messageId).set(
    {
      ...buildMarkReadPayload(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    },
    {merge: true},
  );
}

/**
 * Subscribe to every message addressed TO this athlete, newest first.
 */
export function subscribeMessagesForAthlete(athleteUid, callback) {
  if (!athleteUid) {
    callback([]);
    return () => {};
  }
  return messagesCollection()
    .where('toUid', '==', athleteUid)
    .orderBy('createdAt', 'desc')
    .onSnapshot(
      snap => {
        const list = [];
        snap.forEach(d => list.push({id: d.id, ...d.data()}));
        callback(list);
      },
      () => callback([]),
    );
}

/**
 * Subscribe to messages from this coach to one specific athlete —
 * used to render the "Sent" history on the coach's AthleteDetail.
 */
export function subscribeMessagesFromCoach(coachUid, athleteUid, callback) {
  if (!coachUid || !athleteUid) {
    callback([]);
    return () => {};
  }
  return messagesCollection()
    .where('fromUid', '==', coachUid)
    .where('toUid', '==', athleteUid)
    .orderBy('createdAt', 'desc')
    .onSnapshot(
      snap => {
        const list = [];
        snap.forEach(d => list.push({id: d.id, ...d.data()}));
        callback(list);
      },
      () => callback([]),
    );
}

/**
 * Live unread count for the athlete's TabBar badge. Returns the
 * unsubscribe function; the callback receives a number on every
 * change.
 */
export function subscribeUnreadCountForAthlete(athleteUid, callback) {
  if (!athleteUid) {
    callback(0);
    return () => {};
  }
  return messagesCollection()
    .where('toUid', '==', athleteUid)
    .where('read', '==', false)
    .onSnapshot(
      snap => callback(snap.size),
      () => callback(0),
    );
}

/**
 * Read a single message by id (used on the detail screen if nav
 * params don't already include the body).
 */
export async function getMessage(messageId) {
  if (!messageId) {
    return null;
  }
  const snap = await messageDoc(messageId).get();
  if (!snap.exists) {
    return null;
  }
  return {id: snap.id, ...snap.data()};
}
