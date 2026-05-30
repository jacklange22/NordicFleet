// Browser Firebase init.
//
// Importing this module is side-effect-free. Call getAuthClient() /
// getDbClient() to actually initialize - both only succeed in the
// browser AND only when the NEXT_PUBLIC_FIREBASE_* env vars are set.
//
// This lets `next build` prerender pages without needing the env file,
// while still wiring up real Firebase the moment a client component
// runs in the browser.

import {initializeApp, getApps, getApp} from 'firebase/app';
import {getAuth} from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  CACHE_SIZE_UNLIMITED,
} from 'firebase/firestore';

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
let _auth = null;
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

export function getAuthClient() {
  if (_auth) {
    return _auth;
  }
  const app = getApp_();
  if (!app) {
    return null;
  }
  _auth = getAuth(app);
  return _auth;
}

export function getDbClient() {
  if (_db) {
    return _db;
  }
  const app = getApp_();
  if (!app) {
    return null;
  }
  if (typeof window !== 'undefined') {
    try {
      _db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          cacheSizeBytes: CACHE_SIZE_UNLIMITED,
        }),
      });
    } catch {
      _db = getFirestore(app);
    }
  } else {
    _db = getFirestore(app);
  }
  return _db;
}

/**
 * True when the env file has been filled in and a browser Firebase
 * instance is available. Use this to gate UI ("Firebase not configured -
 * fill in .env.local") in dev.
 */
export function isFirebaseConfigured() {
  return hasRealConfig(readConfig());
}
