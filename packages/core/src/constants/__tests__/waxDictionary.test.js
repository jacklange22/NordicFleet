const {
  WAX_DICTIONARY,
  searchWaxes,
  getWaxById,
} = require('../waxDictionary');

describe('waxDictionary', () => {
  test('WAX_DICTIONARY is an array (possibly empty until Phase E)', () => {
    expect(Array.isArray(WAX_DICTIONARY)).toBe(true);
  });

  test('every entry has the required shape', () => {
    for (const w of WAX_DICTIONARY) {
      expect(typeof w.id).toBe('string');
      expect(w.id.length).toBeGreaterThan(0);
      expect(typeof w.manufacturer).toBe('string');
      expect(typeof w.product).toBe('string');
      expect(typeof w.fullName).toBe('string');
      expect(['kick', 'glide', 'binder', 'base', 'klister']).toContain(w.type);
      expect(Array.isArray(w.searchKeywords)).toBe(true);
    }
  });

  test('no duplicate ids', () => {
    const ids = WAX_DICTIONARY.map(w => w.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('searchWaxes returns [] for empty dict + empty query', () => {
    // When empty dictionary, any query returns [].
    if (WAX_DICTIONARY.length === 0) {
      expect(searchWaxes('foo')).toEqual([]);
    }
  });

  test('searchWaxes respects the limit option', () => {
    if (WAX_DICTIONARY.length > 0) {
      const result = searchWaxes('', {limit: 1});
      expect(result.length).toBeLessThanOrEqual(1);
    }
  });

  test('getWaxById returns null for unknown id', () => {
    expect(getWaxById('does-not-exist')).toBeNull();
    expect(getWaxById(null)).toBeNull();
    expect(getWaxById('')).toBeNull();
  });
});
