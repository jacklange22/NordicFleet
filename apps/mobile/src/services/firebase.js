// Central Firebase initialization.
//
// We explicitly enable disk persistence even though it's the mobile default,
// per the brief. Doing it here means anyone importing `db` is guaranteed to
// get a persistence-enabled client.

import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import {trace} from './devTrace';

let persistenceConfigured = false;

function configurePersistence() {
  if (persistenceConfigured) {
    return;
  }
  try {
    firestore().settings({
      persistence: true,
      cacheSizeBytes: firestore.CACHE_SIZE_UNLIMITED,
    });
    persistenceConfigured = true;
  } catch (err) {
    // settings() throws if it's called more than once or after the client is
    // initialized; safe to swallow.
  }
}

configurePersistence();
trace('firebase configured', {persistence: persistenceConfigured});

export {auth, firestore};
export const db = firestore();
