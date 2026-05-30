// Coach -> athlete fleet suggestions. Top-level `fleetSuggestions/{id}`.
//
// A coach with comment|edit permission proposes changes; the ATHLETE accepts
// (applying the change through their OWN owner-write on the ski/wax/test doc)
// or rejects. The coach never writes the athlete's data directly. Rules
// (firestore.rules) enforce: comment-coach create, athlete-only accept/reject.
//
// Apply-on-accept goes through the existing update services, which rebuild a
// known-field payload - so even if a suggestion carried an unexpected key, it
// could not reach the doc. Combined with the core scalar-only sanitizer, that
// is double protection against field injection.

import {
  buildFleetSuggestionPayload,
  sanitizeSuggestedChanges,
} from '@nordicfleet/core';
import {db, firestore} from './firebase';
import {updateSki} from './skiService';
import {updateWaxLog} from './waxLogService';
import {updateTestLog} from './testLogService';

const suggestionsCollection = () => db.collection('fleetSuggestions');
const suggestionDoc = id => suggestionsCollection().doc(id);

// millis for client-side sort (avoids a composite index requirement).
const tsMillis = v => {
  if (!v) {
    return 0;
  }
  if (typeof v.toMillis === 'function') {
    return v.toMillis();
  }
  if (typeof v.toDate === 'function') {
    return v.toDate().getTime();
  }
  if (typeof v.seconds === 'number') {
    return v.seconds * 1000;
  }
  const t = new Date(v).getTime();
  return isNaN(t) ? 0 : t;
};

const byNewest = (a, b) => tsMillis(b.createdAt) - tsMillis(a.createdAt);

/**
 * Coach-side: create a pending suggestion. Throws on invalid input.
 * @param {Object} args see core buildFleetSuggestionPayload
 * @returns {Promise<string>} new suggestion id
 */
export async function createSuggestion(args) {
  const payload = {
    ...buildFleetSuggestionPayload(args),
    createdAt: firestore.FieldValue.serverTimestamp(),
    updatedAt: firestore.FieldValue.serverTimestamp(),
  };
  const ref = await suggestionsCollection().add(payload);
  return ref.id;
}

/**
 * Athlete-side: every suggestion addressed to this athlete, newest first.
 */
export function subscribeSuggestionsForAthlete(athleteUid, callback) {
  if (!athleteUid) {
    callback([]);
    return () => {};
  }
  return suggestionsCollection()
    .where('athleteUid', '==', athleteUid)
    .onSnapshot(
      snap => {
        const list = [];
        snap.forEach(d => list.push({id: d.id, ...d.data()}));
        list.sort(byNewest);
        callback(list);
      },
      () => callback([]),
    );
}

/**
 * Coach-side: this coach's suggestions to one athlete, newest first.
 */
export function subscribeSuggestionsFromCoach(coachUid, athleteUid, callback) {
  if (!coachUid || !athleteUid) {
    callback([]);
    return () => {};
  }
  return suggestionsCollection()
    .where('coachUid', '==', coachUid)
    .onSnapshot(
      snap => {
        const list = [];
        snap.forEach(d => {
          const data = d.data();
          if (data.athleteUid === athleteUid) {
            list.push({id: d.id, ...data});
          }
        });
        list.sort(byNewest);
        callback(list);
      },
      () => callback([]),
    );
}

/**
 * Athlete-side: accept a suggestion - apply the sanitized change to the
 * target doc (athlete owner-write) then mark the suggestion accepted.
 * @param {Object} suggestion the suggestion doc ({id, athleteUid, targetType, targetId, suggestedChanges})
 */
export async function acceptSuggestion(suggestion) {
  if (!suggestion || !suggestion.id) {
    throw new Error('acceptSuggestion: a suggestion with an id is required');
  }
  const {id, athleteUid, targetType, targetId, suggestedChanges} = suggestion;
  const changes = sanitizeSuggestedChanges(suggestedChanges);
  if (athleteUid && targetId && Object.keys(changes).length > 0) {
    if (targetType === 'ski') {
      await updateSki(athleteUid, targetId, changes);
    } else if (targetType === 'waxLog') {
      await updateWaxLog(athleteUid, targetId, changes);
    } else if (targetType === 'testLog') {
      await updateTestLog(athleteUid, targetId, changes);
    }
  }
  await suggestionDoc(id).set(
    {status: 'accepted', updatedAt: firestore.FieldValue.serverTimestamp()},
    {merge: true},
  );
}

/**
 * Athlete-side: reject a suggestion (no change applied).
 */
export async function rejectSuggestion(suggestionId) {
  if (!suggestionId) {
    throw new Error('rejectSuggestion: suggestionId is required');
  }
  await suggestionDoc(suggestionId).set(
    {status: 'rejected', updatedAt: firestore.FieldValue.serverTimestamp()},
    {merge: true},
  );
}
