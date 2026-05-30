const {
  normalizeWeightUnit,
  normalizeHeightUnit,
  weightFromMetric,
  weightToMetric,
  heightFromMetric,
  heightToMetric,
  formatWeight,
  formatHeight,
} = require('../bodyMetrics');

describe('normalize unit', () => {
  test('weight falls back to kg for anything invalid', () => {
    expect(normalizeWeightUnit('kg')).toBe('kg');
    expect(normalizeWeightUnit('lb')).toBe('lb');
    expect(normalizeWeightUnit('stone')).toBe('kg');
    expect(normalizeWeightUnit(undefined)).toBe('kg');
    expect(normalizeWeightUnit(null)).toBe('kg');
  });

  test('height falls back to cm for anything invalid', () => {
    expect(normalizeHeightUnit('cm')).toBe('cm');
    expect(normalizeHeightUnit('in')).toBe('in');
    expect(normalizeHeightUnit('feet')).toBe('cm');
    expect(normalizeHeightUnit(undefined)).toBe('cm');
  });
});

describe('weight conversion', () => {
  test('kg is identity in both directions', () => {
    expect(weightFromMetric(70, 'kg')).toBe(70);
    expect(weightToMetric(72, 'kg')).toBe(72);
  });

  test('kg → lb display and lb → kg storage', () => {
    expect(weightFromMetric(70, 'lb')).toBe(154.3);
    expect(weightToMetric(154.3, 'lb')).toBeCloseTo(69.99, 1);
  });

  test('blank / non-numeric inputs return null', () => {
    expect(weightFromMetric(null, 'kg')).toBeNull();
    expect(weightFromMetric(undefined, 'lb')).toBeNull();
    expect(weightFromMetric('', 'kg')).toBeNull();
    expect(weightToMetric('abc', 'lb')).toBeNull();
  });

  test('round-trips an lb value back to itself within rounding', () => {
    const stored = weightToMetric(165, 'lb'); // store as kg
    expect(weightFromMetric(stored, 'lb')).toBeCloseTo(165, 0);
  });
});

describe('height conversion', () => {
  test('cm is identity in both directions', () => {
    expect(heightFromMetric(180, 'cm')).toBe(180);
    expect(heightToMetric(182, 'cm')).toBe(182);
  });

  test('cm → in display and in → cm storage', () => {
    expect(heightFromMetric(180, 'in')).toBe(70.9);
    expect(heightToMetric(70, 'in')).toBe(177.8);
  });

  test('blank inputs return null', () => {
    expect(heightFromMetric(null, 'in')).toBeNull();
    expect(heightToMetric('', 'cm')).toBeNull();
  });
});

describe('format helpers', () => {
  test('formatWeight renders the value with the unit suffix', () => {
    expect(formatWeight(70, 'kg')).toBe('70 kg');
    expect(formatWeight(70, 'lb')).toBe('154.3 lb');
    expect(formatWeight(null, 'kg')).toBe('');
    // An unknown unit falls back to kg.
    expect(formatWeight(70, 'stone')).toBe('70 kg');
  });

  test('formatHeight renders the value with the unit suffix', () => {
    expect(formatHeight(180, 'cm')).toBe('180 cm');
    expect(formatHeight(180, 'in')).toBe('70.9 in');
    expect(formatHeight(undefined, 'cm')).toBe('');
  });
});
