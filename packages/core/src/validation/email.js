// Conservative email format check — same pattern the iOS app has used since
// Phase 1. Good enough to catch typos; the real authority is Firebase Auth's
// server-side validation.
//
// We deliberately keep this strict-ish (no spaces, requires an @, requires a
// top-level domain) but don't try to validate the local-part RFC-precisely.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * @param {string} value
 * @returns {boolean} true when the string looks like a usable email
 */
function isValidEmail(value) {
  if (typeof value !== 'string') {
    return false;
  }
  return EMAIL_RE.test(value.trim());
}

module.exports = {isValidEmail, EMAIL_RE};
