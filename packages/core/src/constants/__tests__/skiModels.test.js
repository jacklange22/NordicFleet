const {
  SKI_MODELS,
  knownBrands,
  findModelByAlias,
  modelsForBrand,
  slugifySkiModel,
} = require('../skiModels');

describe('SKI_MODELS curation', () => {
  test('between 30 and 80 curated entries', () => {
    expect(SKI_MODELS.length).toBeGreaterThanOrEqual(30);
    expect(SKI_MODELS.length).toBeLessThanOrEqual(80);
  });

  test('every entry has the required shape', () => {
    for (const m of SKI_MODELS) {
      expect(typeof m.brand).toBe('string');
      expect(m.brand.length).toBeGreaterThan(0);
      expect(typeof m.model).toBe('string');
      expect(m.model.length).toBeGreaterThan(0);
      expect(Array.isArray(m.aliases)).toBe(true);
      // technique is allowed to be null (universal) or 'classic'/'skate'
      expect([null, 'classic', 'skate']).toContain(m.technique);
    }
  });

  test('aliases are already slugified (lowercase, alphanumeric)', () => {
    for (const m of SKI_MODELS) {
      for (const a of m.aliases) {
        expect(a).toMatch(/^[a-z0-9]+$/);
      }
    }
  });

  test('major brands all represented', () => {
    const brands = knownBrands();
    for (const expected of [
      'Salomon',
      'Fischer',
      'Madshus',
      'Atomic',
      'Rossignol',
    ]) {
      expect(brands).toContain(expected);
    }
  });
});

describe('slugifySkiModel', () => {
  test('strips spaces / punctuation / cases', () => {
    expect(slugifySkiModel('S/Lab Carbon')).toBe('slabcarbon');
    expect(slugifySkiModel('Speedmax 3D')).toBe('speedmax3d');
    expect(slugifySkiModel('  Redster S9 ')).toBe('redsters9');
  });

  test('non-strings → empty', () => {
    expect(slugifySkiModel(undefined)).toBe('');
    expect(slugifySkiModel(null)).toBe('');
    expect(slugifySkiModel(123)).toBe('');
  });
});

describe('findModelByAlias', () => {
  test('exact alias hit', () => {
    const m = findModelByAlias('speedmax3d');
    expect(m).not.toBeNull();
    expect(m.brand).toBe('Fischer');
    expect(m.model).toBe('Speedmax 3D');
  });

  test('case + punctuation-insensitive via slug', () => {
    expect(findModelByAlias('S/Lab Carbon Skate').brand).toBe('Salomon');
    expect(findModelByAlias('s lab carbon classic').brand).toBe('Salomon');
    expect(findModelByAlias('Speed Max').model).toBe('Speedmax 3D');
  });

  test('substring fallback for noisy OCR', () => {
    // Vision often returns "FISCHERSPEEDMAX3DSKATEPLUS" as one line.
    const m = findModelByAlias('fischer speedmax 3d skate plus');
    expect(m).not.toBeNull();
    expect(m.model).toBe('Speedmax 3D');
  });

  test('unknown → null', () => {
    expect(findModelByAlias('Banana Splits Carbon')).toBeNull();
    expect(findModelByAlias('')).toBeNull();
    expect(findModelByAlias(null)).toBeNull();
  });
});

describe('modelsForBrand', () => {
  test('Fischer returns at least the curated Fischer models', () => {
    const list = modelsForBrand('Fischer');
    expect(list).not.toBeNull();
    expect(list.length).toBeGreaterThan(0);
    expect(list.every(m => m.brand === 'Fischer')).toBe(true);
  });

  test('case-insensitive', () => {
    expect(modelsForBrand('fischer')).toEqual(modelsForBrand('FISCHER'));
  });

  test('unknown brand → null', () => {
    expect(modelsForBrand('Nonsense')).toBeNull();
  });
});

describe('@nordicfleet/core re-exports skiModels', () => {
  test('via package barrel', () => {
    const core = require('../../');
    expect(typeof core.findModelByAlias).toBe('function');
    expect(typeof core.knownBrands).toBe('function');
    expect(Array.isArray(core.SKI_MODELS)).toBe(true);
  });
});
