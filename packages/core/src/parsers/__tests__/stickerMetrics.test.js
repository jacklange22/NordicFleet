const {
  getStickerMetrics,
  normalizeBrandKey,
  STICKER_METRICS,
  DEFAULT_STICKER_METRICS,
} = require('../stickerMetrics');

describe('normalizeBrandKey', () => {
  test('lowercases and strips non-alnum', () => {
    expect(normalizeBrandKey('Fischer')).toBe('fischer');
    expect(normalizeBrandKey('One Way')).toBe('oneway');
    expect(normalizeBrandKey('')).toBe('');
    expect(normalizeBrandKey(null)).toBe('');
  });
});

describe('getStickerMetrics', () => {
  test('returns the brand descriptor for a known brand', () => {
    const f = getStickerMetrics('Fischer');
    expect(f.brand).toBe('Fischer');
    expect(f.flexUnit).toBe('kg');
    expect(f.lengthUnit).toBe('cm');
  });

  test('exposes hardness codes for code-based brands', () => {
    const m = getStickerMetrics('Madshus');
    expect(m.flexUnit).toBe('code');
    expect(m.flexCodes.f3).toBe(80);
    const r = getStickerMetrics('Rossignol');
    expect(r.flexCodes.s2).toBe(75);
  });

  test('falls back to the generic default for an unknown brand', () => {
    const d = getStickerMetrics('NoSuchBrand');
    expect(d).toBe(DEFAULT_STICKER_METRICS);
    expect(d.brand).toBeNull();
  });

  test('every metric entry carries the required shape', () => {
    for (const key of Object.keys(STICKER_METRICS)) {
      const m = STICKER_METRICS[key];
      expect(typeof m.brand).toBe('string');
      expect(Array.isArray(m.fields)).toBe(true);
      expect(m.fields.length).toBeGreaterThan(0);
      expect(typeof m.lengthUnit).toBe('string');
    }
  });
});
