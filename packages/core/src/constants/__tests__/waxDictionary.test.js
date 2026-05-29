const {
  WAX_DICTIONARY,
  WAX_CATEGORIES,
  searchWaxes,
  waxesByCategory,
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
      expect([
        'kick',
        'glide',
        'binder',
        'base',
        'klister',
        'topcoat',
        'structure',
      ]).toContain(w.type);
      expect(Array.isArray(w.searchKeywords)).toBe(true);
      // Every entry now carries a coarse category + categories list.
      expect(WAX_CATEGORIES).toContain(w.category);
      expect(Array.isArray(w.categories)).toBe(true);
      expect(w.categories).toContain(w.category);
    }
  });

  test('legacy type maps onto the right category', () => {
    const byId = id => WAX_DICTIONARY.find(w => w.id === id);
    // kick/klister/binder → kick
    for (const w of WAX_DICTIONARY) {
      if (['kick', 'klister', 'binder'].includes(w.type)) {
        expect(w.category).toBe('kick');
      }
      if (['glide', 'base'].includes(w.type)) {
        expect(w.category).toBe('paraffin');
      }
      if (w.type === 'topcoat') {
        expect(w.category).toBe('topcoat');
      }
      if (w.type === 'structure') {
        expect(w.category).toBe('structure');
      }
    }
    expect(byId('swix-cera-f-fc8x').category).toBe('topcoat');
    expect(byId('structure-fine-cold').category).toBe('structure');
  });

  test('all four categories have at least one suggestion', () => {
    for (const cat of WAX_CATEGORIES) {
      expect(waxesByCategory(cat).length).toBeGreaterThan(0);
    }
  });

  test('searchWaxes(category) only returns that category', () => {
    for (const cat of WAX_CATEGORIES) {
      const out = searchWaxes('', {category: cat});
      expect(out.every(w => w.category === cat)).toBe(true);
    }
  });

  test('category filter narrows but query still works within it', () => {
    const kickResults = searchWaxes('swix', {category: 'kick'});
    expect(kickResults.length).toBeGreaterThan(0);
    expect(kickResults.every(w => w.category === 'kick')).toBe(true);
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
