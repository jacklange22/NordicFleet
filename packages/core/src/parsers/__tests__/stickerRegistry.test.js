const {
  registerStickerParser,
  getStickerParser,
  hasStickerParser,
  listStickerParsers,
  overallConfidence,
  parseSticker,
} = require('../stickerRegistry');

describe('registry', () => {
  test('ships with Madshus and Rossignol refiners registered', () => {
    expect(hasStickerParser('Madshus')).toBe(true);
    expect(hasStickerParser('Rossignol')).toBe(true);
    expect(typeof getStickerParser('Madshus')).toBe('function');
    expect(listStickerParsers()).toEqual(
      expect.arrayContaining(['madshus', 'rossignol']),
    );
  });

  test('unknown brands have no refiner', () => {
    expect(hasStickerParser('Fischer')).toBe(false);
    expect(getStickerParser('Nope')).toBeNull();
  });

  test('a newly registered brand parser is retrievable by normalized key', () => {
    const fn = p => p;
    registerStickerParser('Brand X', fn);
    expect(getStickerParser('brandx')).toBe(fn);
    expect(hasStickerParser('Brand X')).toBe(true);
  });
});

describe('overallConfidence', () => {
  test('brand + model both high reads as high overall', () => {
    expect(
      overallConfidence({
        brand: {confidence: 'high'},
        model: {confidence: 'high'},
      }),
    ).toBe('high');
  });

  test('no recognised fields reads as low', () => {
    expect(overallConfidence({})).toBe('low');
    expect(overallConfidence(null)).toBe('low');
  });

  test('a spread of medium fields reads as medium', () => {
    expect(
      overallConfidence({
        brand: {confidence: 'medium'},
        type: {confidence: 'medium'},
        length: {confidence: 'medium'},
      }),
    ).toBe('medium');
  });
});

describe('parseSticker', () => {
  test('attaches brand metrics and an overall confidence', () => {
    const out = parseSticker(['FISCHER SPEEDMAX 3D', 'SKATE COLD', '192', '75']);
    expect(out.metrics).toBeDefined();
    expect(out.metrics.brand).toBe('Fischer');
    expect(['high', 'medium', 'low']).toContain(out.overallConfidence);
    // Still returns the generic per-field shape.
    expect(out.brand.value).toBe('Fischer');
  });

  test('decodes a Madshus hardness code into an approximate kg flex', () => {
    const out = parseSticker(['MADSHUS REDLINE', 'F3 SKATE', '192']);
    expect(out.metrics.brand).toBe('Madshus');
    expect(out.metrics.flexUnit).toBe('code');
    expect(out.flex).toBeDefined();
    expect(out.flex.value).toBe(80); // F3 -> ~80 kg
    expect(out.flex.confidence).toBe('low');
  });

  test('does not invent a flex for a brand with no code and no number', () => {
    const out = parseSticker(['SALOMON', 'S/LAB CARBON', 'SKATE']);
    // No kg number, no decodable code -> no flex fabricated.
    expect(out.flex).toBeUndefined();
    expect(out.metrics.brand).toBe('Salomon');
  });
});
