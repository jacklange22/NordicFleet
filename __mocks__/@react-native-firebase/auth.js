/**
 * In-memory mock for @react-native-firebase/auth.
 *
 * Tests can:
 *   - call signInWithEmailAndPassword / createUserWithEmailAndPassword
 *   - subscribe to onAuthStateChanged
 *   - call signOut
 *   - reset with __resetAuthMock()
 *   - directly mutate state with __setCurrentUser({...})
 */

let currentUser = null;
const listeners = new Set();
const usersByEmail = new Map();

function notify() {
  for (const cb of listeners) {
    cb(currentUser);
  }
}

function makeUser({uid, email}) {
  return {
    uid: uid || `uid_${Math.random().toString(36).slice(2)}`,
    email,
    reauthenticateWithCredential: jest.fn(() => Promise.resolve()),
    updatePassword: jest.fn(() => Promise.resolve()),
  };
}

const authApi = {
  get currentUser() {
    return currentUser;
  },
  onAuthStateChanged: jest.fn(cb => {
    listeners.add(cb);
    // Real Firebase fires once synchronously with the current state.
    cb(currentUser);
    return () => listeners.delete(cb);
  }),
  signInWithEmailAndPassword: jest.fn((email, password) => {
    const record = usersByEmail.get(email);
    if (!record || record.password !== password) {
      const err = new Error('Wrong email or password');
      err.code = 'auth/invalid-credential';
      return Promise.reject(err);
    }
    currentUser = makeUser({uid: record.uid, email});
    notify();
    return Promise.resolve({user: currentUser});
  }),
  createUserWithEmailAndPassword: jest.fn((email, password) => {
    if (usersByEmail.has(email)) {
      const err = new Error('Email in use');
      err.code = 'auth/email-already-in-use';
      return Promise.reject(err);
    }
    const uid = `uid_${Math.random().toString(36).slice(2)}`;
    usersByEmail.set(email, {uid, password});
    currentUser = makeUser({uid, email});
    notify();
    return Promise.resolve({user: currentUser});
  }),
  signOut: jest.fn(() => {
    currentUser = null;
    notify();
    return Promise.resolve();
  }),
};

const auth = jest.fn(() => authApi);

auth.EmailAuthProvider = {
  credential: jest.fn((email, password) => ({
    providerId: 'password',
    email,
    password,
  })),
};

// Test helpers.
auth.__resetAuthMock = () => {
  currentUser = null;
  listeners.clear();
  usersByEmail.clear();
  authApi.onAuthStateChanged.mockClear();
  authApi.signInWithEmailAndPassword.mockClear();
  authApi.createUserWithEmailAndPassword.mockClear();
  authApi.signOut.mockClear();
};

auth.__setCurrentUser = user => {
  currentUser = user;
  notify();
};

auth.__seedUser = (email, password, uid) => {
  usersByEmail.set(email, {uid: uid || `uid_${email}`, password});
};

module.exports = auth;
module.exports.default = auth;
