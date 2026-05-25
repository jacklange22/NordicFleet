const {validateSkiInput} = require('../ski');

describe('validateSkiInput', () => {
  test('throws when name is missing', () => {
    expect(() => validateSkiInput({})).toThrow(/name/i);
    expect(() => validateSkiInput({name: '  '})).toThrow(/name/i);
  });

  test('throws on invalid technique', () => {
    expect(() =>
      validateSkiInput({name: 'A', technique: 'biathlon', type: 'cold'}),
    ).toThrow(/Technique must be one of/);
  });

  test('throws on invalid type', () => {
    expect(() =>
      validateSkiInput({name: 'A', technique: 'classic', type: 'racing'}),
    ).toThrow(/Type must be one of/);
  });

  test('lowercases technique and type', () => {
    const out = validateSkiInput({
      name: 'Speedmax',
      technique: 'Classic',
      type: 'Cold',
    });
    expect(out.technique).toBe('classic');
    expect(out.type).toBe('cold');
  });

  test('normalizes optional strings via trim', () => {
    const out = validateSkiInput({
      name: '  Speedmax  ',
      technique: 'classic',
      type: 'cold',
      brand: '  Fischer  ',
      model: '  Plus  ',
      notes: '  hi  ',
    });
    expect(out.name).toBe('Speedmax');
    expect(out.brand).toBe('Fischer');
    expect(out.model).toBe('Plus');
    // notes are NOT trimmed (user might want trailing whitespace), unchanged here
    expect(out.notes).toBe('  hi  ');
  });

  test('parses numeric length / flex', () => {
    const out = validateSkiInput({
      name: 'A',
      technique: 'classic',
      type: 'cold',
      length: '200',
      flex: 90,
    });
    expect(out.length).toBe(200);
    expect(out.flex).toBe(90);
  });

  test('empty length / flex become null', () => {
    const out = validateSkiInput({
      name: 'A',
      technique: 'classic',
      type: 'cold',
      length: '',
      flex: undefined,
    });
    expect(out.length).toBeNull();
    expect(out.flex).toBeNull();
  });

  test('throws on non-numeric length', () => {
    expect(() =>
      validateSkiInput({
        name: 'A',
        technique: 'classic',
        type: 'cold',
        length: 'twenty',
      }),
    ).toThrow(/Length must be a number/);
  });

  test('year outside range throws', () => {
    expect(() =>
      validateSkiInput({
        name: 'A',
        technique: 'classic',
        type: 'cold',
        year: 1800,
      }),
    ).toThrow(/out of range/);
  });

  test('retired defaults to false', () => {
    const out = validateSkiInput({
      name: 'A',
      technique: 'classic',
      type: 'cold',
    });
    expect(out.retired).toBe(false);
  });

  test('passes seedId through', () => {
    const out = validateSkiInput({
      name: 'A',
      technique: 'classic',
      type: 'cold',
      seedId: '334',
    });
    expect(out.seedId).toBe('334');
  });
});
