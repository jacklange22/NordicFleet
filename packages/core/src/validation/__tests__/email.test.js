const {isValidEmail} = require('../email');

describe('isValidEmail', () => {
  test.each([
    ['a@b.co', true],
    ['skier@nordicfleet.test', true],
    ['JACK@Example.COM', true],
    ['  trim@example.com  ', true],
  ])('accepts %s', (input, expected) => {
    expect(isValidEmail(input)).toBe(expected);
  });

  test.each([
    [''],
    ['no-at-sign'],
    ['missing-tld@host'],
    ['@no-local.com'],
    ['spaces in@host.com'],
    [null],
    [undefined],
    [42],
    [{}],
  ])('rejects %p', input => {
    expect(isValidEmail(input)).toBe(false);
  });
});
