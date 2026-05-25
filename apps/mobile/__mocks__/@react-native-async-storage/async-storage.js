const store = new Map();

const AsyncStorage = {
  setItem: jest.fn((key, value) => {
    store.set(key, String(value));
    return Promise.resolve();
  }),
  getItem: jest.fn(key => {
    return Promise.resolve(store.has(key) ? store.get(key) : null);
  }),
  removeItem: jest.fn(key => {
    store.delete(key);
    return Promise.resolve();
  }),
  clear: jest.fn(() => {
    store.clear();
    return Promise.resolve();
  }),
  getAllKeys: jest.fn(() => Promise.resolve([...store.keys()])),
  multiGet: jest.fn(keys =>
    Promise.resolve(keys.map(k => [k, store.has(k) ? store.get(k) : null])),
  ),
  multiSet: jest.fn(pairs => {
    pairs.forEach(([k, v]) => store.set(k, String(v)));
    return Promise.resolve();
  }),
  __reset: () => store.clear(),
};

module.exports = AsyncStorage;
module.exports.default = AsyncStorage;
