const {validatePassword, MIN_LENGTH} = require('../password');

describe('validatePassword', () => {
  test('rejects non-string input', () => {
    const r = validatePassword(null);
    expect(r.valid).toBe(false);
    expect(r.errors[0]).toMatch(/required/i);
  });

  test('rejects short passwords', () => {
    const r = validatePassword('a'.repeat(MIN_LENGTH - 1));
    expect(r.valid).toBe(false);
    expect(r.errors[0]).toMatch(`at least ${MIN_LENGTH}`);
  });

  test('accepts a minimum-length password', () => {
    const r = validatePassword('a'.repeat(MIN_LENGTH));
    expect(r.valid).toBe(true);
    expect(r.errors).toEqual([]);
  });

  test('accepts a longer password', () => {
    const r = validatePassword('correct-horse-battery-staple');
    expect(r.valid).toBe(true);
  });
});
