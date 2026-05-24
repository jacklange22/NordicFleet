/**
 * In-memory Firestore mock.
 *
 * Supports the subset of the real API our service layer touches:
 *   firestore()
 *   .collection(path)
 *   .doc(id)
 *   .collection(path)
 *   .doc(id)
 *   .get() / .set() / .update() / .delete() / .onSnapshot()
 *   .add() / .orderBy() / .where()
 *
 * Tests can reset state with `__resetFirestoreMock()` and seed data via
 * `__seedDoc(path, data)`.
 */

const store = new Map(); // path -> data
const listeners = new Map(); // path -> Set<callback>

function joinPath(...parts) {
  return parts.filter(Boolean).join('/');
}

function notify(path) {
  // Notify listeners for the exact path and for any parent collection.
  for (const [listenerPath, callbacks] of listeners.entries()) {
    if (listenerPath === path) {
      for (const cb of callbacks) {
        cb();
      }
    }
    // Collection listeners (no trailing doc id) match any doc whose path
    // starts with their path.
    if (
      path.startsWith(listenerPath + '/') &&
      path.split('/').length === listenerPath.split('/').length + 1
    ) {
      for (const cb of callbacks) {
        cb();
      }
    }
  }
}

function docSnapshot(path) {
  const data = store.get(path);
  return {
    exists: data !== undefined,
    id: path.split('/').pop(),
    data: () => (data ? {...data} : undefined),
    ref: docRef(path),
  };
}

function querySnapshot(path, filters = [], orderBy = null) {
  const prefix = path + '/';
  const docs = [];
  for (const [key, value] of store.entries()) {
    if (key.startsWith(prefix)) {
      // Only direct children (one slash beyond the prefix).
      const tail = key.slice(prefix.length);
      if (!tail.includes('/')) {
        docs.push({
          id: tail,
          data: () => ({...value}),
          ref: docRef(key),
          exists: true,
        });
      }
    }
  }
  let filtered = docs;
  for (const [field, op, val] of filters) {
    filtered = filtered.filter(d => {
      const v = d.data()[field];
      if (op === '==') {
        return v === val;
      }
      if (op === '!=') {
        return v !== val;
      }
      if (op === '<') {
        return v < val;
      }
      if (op === '<=') {
        return v <= val;
      }
      if (op === '>') {
        return v > val;
      }
      if (op === '>=') {
        return v >= val;
      }
      return false;
    });
  }
  if (orderBy) {
    const [field, direction = 'asc'] = orderBy;
    filtered = filtered.slice().sort((a, b) => {
      const av = a.data()[field];
      const bv = b.data()[field];
      if (av === bv) {
        return 0;
      }
      const cmp = av < bv ? -1 : 1;
      return direction === 'desc' ? -cmp : cmp;
    });
  }
  return {
    empty: filtered.length === 0,
    size: filtered.length,
    docs: filtered,
    forEach(fn) {
      filtered.forEach(fn);
    },
  };
}

function docRef(path) {
  return {
    id: path.split('/').pop(),
    path,
    get: jest.fn(() => {
      const inj = firestore.__shouldInjectError();
      if (inj) {
        return Promise.reject(inj);
      }
      return Promise.resolve(docSnapshot(path));
    }),
    set: jest.fn((data, options = {}) => {
      const inj = firestore.__shouldInjectError();
      if (inj) {
        return Promise.reject(inj);
      }
      const existing = store.get(path);
      if (options.merge && existing) {
        store.set(path, {...existing, ...data});
      } else {
        store.set(path, {...data});
      }
      notify(path);
      return Promise.resolve();
    }),
    update: jest.fn(data => {
      const inj = firestore.__shouldInjectError();
      if (inj) {
        return Promise.reject(inj);
      }
      const existing = store.get(path) || {};
      store.set(path, {...existing, ...data});
      notify(path);
      return Promise.resolve();
    }),
    delete: jest.fn(() => {
      const inj = firestore.__shouldInjectError();
      if (inj) {
        return Promise.reject(inj);
      }
      store.delete(path);
      notify(path);
      return Promise.resolve();
    }),
    onSnapshot: jest.fn(callback => {
      if (!listeners.has(path)) {
        listeners.set(path, new Set());
      }
      const wrapped = () => callback(docSnapshot(path));
      listeners.get(path).add(wrapped);
      // fire immediately, like real onSnapshot
      callback(docSnapshot(path));
      return () => listeners.get(path).delete(wrapped);
    }),
    collection: name => collectionRef(joinPath(path, name)),
  };
}

function collectionRef(path) {
  const filters = [];
  let order = null;
  const api = {
    path,
    doc: id => docRef(joinPath(path, id || `auto_${Date.now()}_${Math.random().toString(36).slice(2)}`)),
    add: jest.fn(data => {
      const inj = firestore.__shouldInjectError();
      if (inj) {
        return Promise.reject(inj);
      }
      const id = `auto_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const full = joinPath(path, id);
      store.set(full, {...data});
      notify(full);
      return Promise.resolve({id, path: full});
    }),
    where: (field, op, val) => {
      filters.push([field, op, val]);
      return api;
    },
    orderBy: (field, direction) => {
      order = [field, direction || 'asc'];
      return api;
    },
    get: jest.fn(() => {
      const inj = firestore.__shouldInjectError();
      if (inj) {
        return Promise.reject(inj);
      }
      return Promise.resolve(querySnapshot(path, filters, order));
    }),
    onSnapshot: jest.fn(callback => {
      if (!listeners.has(path)) {
        listeners.set(path, new Set());
      }
      const wrapped = () => callback(querySnapshot(path, filters, order));
      listeners.get(path).add(wrapped);
      callback(querySnapshot(path, filters, order));
      return () => listeners.get(path).delete(wrapped);
    }),
  };
  return api;
}

const firestore = jest.fn(() => ({
  collection: name => collectionRef(name),
  settings: jest.fn(),
}));

// Static fields on the firestore namespace.
firestore.FieldValue = {
  serverTimestamp: () => ({__type: 'serverTimestamp'}),
  delete: () => ({__type: 'delete'}),
  arrayUnion: (...values) => ({__type: 'arrayUnion', values}),
  arrayRemove: (...values) => ({__type: 'arrayRemove', values}),
  increment: n => ({__type: 'increment', n}),
};
firestore.Timestamp = {
  now: () => ({seconds: Math.floor(Date.now() / 1000), nanoseconds: 0, toDate: () => new Date()}),
  fromDate: date => ({
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: 0,
    toDate: () => date,
  }),
};
firestore.CACHE_SIZE_UNLIMITED = -1;

// Test helpers
let injectedError = null;
firestore.__resetFirestoreMock = () => {
  store.clear();
  listeners.clear();
  injectedError = null;
};
firestore.__seedDoc = (path, data) => {
  store.set(path, {...data});
  notify(path);
};
firestore.__getStore = () => store;
/**
 * Force the next set/update/add/get to reject with the given error code.
 * Auto-cleared after one call so tests don't leak state. Useful for
 * exercising offline/network-failure code paths.
 */
firestore.__injectError = err => {
  injectedError = err;
};
firestore.__shouldInjectError = () => {
  if (!injectedError) {
    return null;
  }
  const e = injectedError;
  injectedError = null;
  return e;
};

module.exports = firestore;
module.exports.default = firestore;
