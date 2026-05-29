// Email capture → Firestore `marketingSignups/{autoId}`.
//
// Writes are open-create-only (see firestore.rules): anyone can add a
// signup, nobody can read/update/delete them from the client. We keep
// the shape minimal and validate the email lightly before writing.

import {collection, addDoc, serverTimestamp} from 'firebase/firestore';
import {getDbClient} from './firebase';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_RE.test(email.trim());
}

/**
 * Record a marketing signup. Returns the new doc id.
 * @param {string} email
 * @param {object} [meta] optional { source, role }
 */
export async function recordSignup(email, meta = {}) {
  const clean = (email || '').trim().toLowerCase();
  if (!isValidEmail(clean)) {
    throw new Error('Please enter a valid email address.');
  }
  const db = getDbClient();
  if (!db) {
    throw new Error('Signups are temporarily unavailable. Please try later.');
  }
  const ref = await addDoc(collection(db, 'marketingSignups'), {
    email: clean,
    source: typeof meta.source === 'string' ? meta.source : 'website',
    role: typeof meta.role === 'string' ? meta.role : null,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}
