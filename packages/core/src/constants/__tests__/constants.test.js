const {
  SKI_BRANDS,
  SNOW_TYPES,
  SURFACE_TYPES,
  BINDER_TYPES,
} = require('../../constants');

describe('constants', () => {
  test('SKI_BRANDS includes the major nordic brands', () => {
    expect(SKI_BRANDS).toEqual(
      expect.arrayContaining(['Fischer', 'Salomon', 'Atomic', 'Madshus']),
    );
  });

  test('SNOW_TYPES is the expected enum', () => {
    expect(SNOW_TYPES).toEqual(['Old', 'New', 'Manmade']);
  });

  test('SURFACE_TYPES is the expected enum', () => {
    expect(SURFACE_TYPES).toEqual([
      'Hardpack',
      'Powder',
      'Corduroy',
      'Slush',
    ]);
  });

  test('BINDER_TYPES starts with "None"', () => {
    expect(BINDER_TYPES[0]).toBe('None');
  });

  test('every constant array is frozen', () => {
    for (const arr of [SKI_BRANDS, SNOW_TYPES, SURFACE_TYPES, BINDER_TYPES]) {
      expect(Object.isFrozen(arr)).toBe(true);
    }
  });
});
