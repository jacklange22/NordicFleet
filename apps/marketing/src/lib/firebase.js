// Browser Firebase init for the marketing site.
//
// Side-effect-free import. getDbClient() only initializes in the browser
// AND only when the NEXT_PUBLIC_FIREBASE_* env vars are present, so
// `next build` can prerender every page without an env file.
//
// The marketing site only needs Firestore (to record email signups) —
// no auth, no persistent cache.

import {initializeApp, getApps, getApp} from 'firebase/app';
import {getFirestore} from 'firebase/firestore';

function readConfig() {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
}

function hasRealConfig(cfg) {
  return !!(cfg.apiKey && cfg.projectId && cfg.appId);
}

let _app = null;
let _db = null;

function getApp_() {
  if (_app) {
    return _app;
  }
  const cfg = readConfig();
  if (!hasRealConfig(cfg)) {
    return null;
  }
  _app = getApps().length ? getApp() : initializeApp(cfg);
  return _app;
}

export function getDbClient() {
  if (_db) {
    return _db;
  }
  const app = getApp_();
  if (!app) {
    return null;
  }
  _db = getFirestore(app);
  return _db;
}

export function isFirebaseConfigured() {
  return hasRealConfig(readConfig());
}
