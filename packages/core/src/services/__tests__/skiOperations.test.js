const {
  buildSkiCreatePayload,
  buildSkiUpdatePayload,
} = require('../skiOperations');

describe('buildSkiCreatePayload', () => {
  test('delegates to validateSkiInput (smoke)', () => {
    const out = buildSkiCreatePayload({
      name: 'A',
      technique: 'classic',
      type: 'cold',
    });
    expect(out.name).toBe('A');
    expect(out.retired).toBe(false);
  });
});

describe('buildSkiUpdatePayload', () => {
  test('only changes the keys provided', () => {
    expect(buildSkiUpdatePayload({grind: 'Cold'})).toEqual({grind: 'Cold'});
  });

  test('empty name throws', () => {
    expect(() => buildSkiUpdatePayload({name: '   '})).toThrow();
  });

  test('lowercases technique / type', () => {
    expect(
      buildSkiUpdatePayload({technique: 'SKATE', type: 'WARM'}),
    ).toEqual({technique: 'skate', type: 'warm'});
  });

  test('length / flex empty string → null', () => {
    expect(buildSkiUpdatePayload({length: ''}).length).toBeNull();
    expect(buildSkiUpdatePayload({flex: null}).flex).toBeNull();
  });

  test('length non-numeric throws', () => {
    expect(() => buildSkiUpdatePayload({length: 'banana'})).toThrow();
  });

  test('year out of range throws', () => {
    expect(() => buildSkiUpdatePayload({year: 1700})).toThrow();
  });
});
