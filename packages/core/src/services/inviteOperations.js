// Coach -> athlete invite helpers. Pure string shaping, no I/O and NO
// email sending: these build the email-address list, the shareable
// invite link, and a mailto: draft the COACH's own mail app opens. The
// app must never claim an invite was "sent" - the coach sends it.
//
// (The server-side invite record that would let an athlete redeem a link
// needs new Firestore rules, which are gated on the rules test harness.
// Until then this is link + draft only.)

const {isValidEmail} = require('../validation/email');

/**
 * Split a free-text blob of email addresses (commas, semicolons,
 * whitespace, or newlines between them) into valid + invalid buckets.
 * Valid addresses are lowercased and de-duplicated, order preserved.
 *
 * @param {string} text
 * @returns {{emails: string[], invalid: string[]}}
 */
function parseEmailList(text) {
  const tokens = String(text || '')
    .split(/[\s,;]+/)
    .map(t => t.trim())
    .filter(Boolean);
  const seen = new Set();
  const emails = [];
  const invalid = [];
  for (const tok of tokens) {
    const lower = tok.toLowerCase();
    if (isValidEmail(lower)) {
      if (!seen.has(lower)) {
        seen.add(lower);
        emails.push(lower);
      }
    } else {
      invalid.push(tok);
    }
  }
  return {emails, invalid};
}

/**
 * Build a shareable invite link off a base URL. Carries the coach id (so
 * the athlete app can pre-fill the coach request) and optional name.
 *
 * @param {string} baseUrl   e.g. the marketing site URL
 * @param {{coachId?: string, coachName?: string}} [opts]
 * @returns {string}
 */
function buildInviteLink(baseUrl, opts = {}) {
  const base = String(baseUrl || '').replace(/\/+$/, '');
  const params = [];
  if (opts.coachId) {
    params.push(`coach=${encodeURIComponent(opts.coachId)}`);
  }
  if (opts.coachName) {
    params.push(`name=${encodeURIComponent(opts.coachName)}`);
  }
  const qs = params.length ? `?${params.join('&')}` : '';
  return `${base}/invite${qs}`;
}

/**
 * Build the subject + plain-text body for an invite email draft.
 *
 * @param {{coachName?: string, inviteLink?: string}} [opts]
 * @returns {{subject: string, body: string}}
 */
function buildInviteEmail(opts = {}) {
  const coach = String(opts.coachName || '').trim();
  const link = String(opts.inviteLink || '').trim();
  const subject = coach
    ? `${coach} invited you to NordicFleet`
    : 'You are invited to NordicFleet';
  const body = [
    coach
      ? `${coach} wants to coach your skis on NordicFleet.`
      : 'You have been invited to NordicFleet.',
    '',
    'NordicFleet keeps your ski fleet, wax logs, and test results in one place, and lets your coach send wax tips and race plans.',
    '',
    link ? `Get started: ${link}` : 'Get started by downloading NordicFleet.',
  ].join('\n');
  return {subject, body};
}

/**
 * Build a mailto: URI that opens the coach's mail app with the
 * recipients, subject, and body pre-filled. Nothing is sent here.
 *
 * @param {string[]|string} emails
 * @param {{coachName?: string, inviteLink?: string}} [opts]
 * @returns {string}
 */
function buildInviteMailto(emails, opts = {}) {
  const to = Array.isArray(emails) ? emails.join(',') : String(emails || '');
  const {subject, body} = buildInviteEmail(opts);
  const q = `subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
    body,
  )}`;
  return `mailto:${to}?${q}`;
}

module.exports = {
  parseEmailList,
  buildInviteLink,
  buildInviteEmail,
  buildInviteMailto,
};
