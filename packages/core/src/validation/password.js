// Password validation — currently the only rule we enforce client-side is
// minimum length. Firebase Auth enforces its own server-side rules (which
// may reject pwned passwords via the new "password policy" feature when it's
// enabled in the console).
//
// `validatePassword` returns a list of human-readable failure messages.
// The caller picks the first one to show, or shows all of them.

const MIN_LENGTH = 6;

/**
 * @param {string} value
 * @returns {{valid: boolean, errors: string[]}}
 */
function validatePassword(value) {
  const errors = [];
  if (typeof value !== 'string') {
    errors.push('Password is required');
    return {valid: false, errors};
  }
  if (value.length < MIN_LENGTH) {
    errors.push(`Password must be at least ${MIN_LENGTH} characters`);
  }
  return {valid: errors.length === 0, errors};
}

module.exports = {validatePassword, MIN_LENGTH};
