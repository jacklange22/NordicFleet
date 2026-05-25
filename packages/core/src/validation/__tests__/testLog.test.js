const {validateTestLogInput} = require('../testLog');

describe('validateTestLogInput', () => {
  test('requires skiId', () => {
    expect(() => validateTestLogInput({})).toThrow(/skiId/);
  });

  test('temperature allows negative numbers', () => {
    const out = validateTestLogInput({skiId: 's1', temperature: '-5'});
    expect(out.temperature).toBe(-5);
  });

  test('humidity clamped to 0-100', () => {
    expect(validateTestLogInput({skiId: 's1', humidity: 150}).humidity).toBe(
      100,
    );
    expect(validateTestLogInput({skiId: 's1', humidity: -20}).humidity).toBe(
      0,
    );
  });

  test('snowType / surface lowercased', () => {
    const out = validateTestLogInput({
      skiId: 's1',
      snowType: 'Old',
      surface: 'Hardpack',
    });
    expect(out.snowType).toBe('old');
    expect(out.surface).toBe('hardpack');
  });

  test('glideRating clamps to 1-10 and defaults to 5', () => {
    expect(validateTestLogInput({skiId: 's1'}).glideRating).toBe(5);
    expect(
      validateTestLogInput({skiId: 's1', glideRating: 15}).glideRating,
    ).toBe(10);
    expect(
      validateTestLogInput({skiId: 's1', glideRating: 0}).glideRating,
    ).toBe(1);
  });

  test('rounds non-integer ratings', () => {
    expect(
      validateTestLogInput({skiId: 's1', glideRating: 7.4}).glideRating,
    ).toBe(7);
    expect(
      validateTestLogInput({skiId: 's1', glideRating: 7.6}).glideRating,
    ).toBe(8);
  });

  test('nullable ratings stay null when missing', () => {
    const out = validateTestLogInput({skiId: 's1'});
    expect(out.kickRating).toBeNull();
    expect(out.stabilityRating).toBeNull();
    expect(out.climbingRating).toBeNull();
  });

  test('location: valid coords pass through', () => {
    const out = validateTestLogInput({
      skiId: 's1',
      location: {latitude: 43.7, longitude: -72.3, accuracy: 12, label: 'Hanover'},
    });
    expect(out.location).toEqual({
      latitude: 43.7,
      longitude: -72.3,
      accuracy: 12,
      label: 'Hanover',
    });
  });

  test('location: out-of-range lat returns null', () => {
    const out = validateTestLogInput({
      skiId: 's1',
      location: {latitude: 200, longitude: 0},
    });
    expect(out.location).toBeNull();
  });

  test('location: missing object stays null', () => {
    expect(validateTestLogInput({skiId: 's1'}).location).toBeNull();
  });

  test('location: empty label normalized to null', () => {
    const out = validateTestLogInput({
      skiId: 's1',
      location: {latitude: 1, longitude: 1, label: '   '},
    });
    expect(out.location.label).toBeNull();
  });
});
