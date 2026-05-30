// Beta-feedback / bug-report email shaping. Pure string building, no
// sending: the app uses these to open the user's own mail composer with
// a draft pre-filled, including the build tag + platform so a report
// carries the version context (lightweight observability).

/**
 * Build the subject + body for a feedback / bug email draft. The build
 * tag and platform are appended so every report says which build it came
 * from.
 *
 * @param {Object} [opts]
 * @param {'feedback'|'bug'} [opts.kind]   default 'feedback'
 * @param {string} [opts.buildTag]
 * @param {string} [opts.platform]         'ios' | 'web' | ...
 * @returns {{subject: string, body: string}}
 */
function buildFeedbackEmail(opts = {}) {
  const kind = opts.kind === 'bug' ? 'bug' : 'feedback';
  const buildTag = opts.buildTag ? String(opts.buildTag) : 'unknown';
  const platform = opts.platform ? String(opts.platform) : 'unknown';
  const subject =
    kind === 'bug' ? 'NordicFleet bug report' : 'NordicFleet beta feedback';
  const intro =
    kind === 'bug'
      ? 'Describe the problem (what you did, what happened, what you expected):'
      : 'Share your feedback on the NordicFleet beta:';
  const body = [
    intro,
    '',
    '',
    '---',
    `Build: ${buildTag}`,
    `Platform: ${platform}`,
  ].join('\n');
  return {subject, body};
}

/**
 * Build a mailto: URI for a feedback / bug draft. Returns '' when no
 * recipient is given so the caller can fall back to another entry point
 * rather than opening an empty composer.
 *
 * @param {string} toEmail
 * @param {Object} [opts]   forwarded to buildFeedbackEmail
 * @returns {string}
 */
function buildFeedbackMailto(toEmail, opts = {}) {
  const to = String(toEmail || '').trim();
  if (!to) {
    return '';
  }
  const {subject, body} = buildFeedbackEmail(opts);
  return `mailto:${to}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(body)}`;
}

module.exports = {
  buildFeedbackEmail,
  buildFeedbackMailto,
};
