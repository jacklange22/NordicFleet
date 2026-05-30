// Web error-report seam.
//
// Single funnel for "something went wrong" on the web app. Today it
// scrubs PII (via @nordicfleet/core) and logs to the console. It is the
// ONE place a real vendor (Sentry) gets wired later - see
// OBSERVABILITY_PLAN.md. Keep all error reporting going through here so
// the vendor swap is a one-file change.

import {scrubErrorForReport} from '@nordicfleet/core';

// Vendor sending is gated on an env var so dev/local never ships errors
// anywhere, and so the seam is a no-op until a DSN is configured.
const VENDOR_ENABLED =
  typeof process !== 'undefined' &&
  !!process.env.NEXT_PUBLIC_SENTRY_DSN;

/**
 * Report an error through the PII-safe funnel.
 * @param {unknown} error
 * @param {object} [context]  only @nordicfleet/core ALLOWED_CONTEXT_KEYS survive
 */
export function reportError(error, context) {
  let payload;
  try {
    payload = scrubErrorForReport(error, {platform: 'web', ...context});
  } catch {
    payload = {name: 'Error', message: 'reportError failed to scrub', context: {platform: 'web'}};
  }

  // Always visible in dev so a failure is never silently swallowed.
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.error('[reportError]', payload);
  }

  if (VENDOR_ENABLED) {
    // TODO(OBSERVABILITY_PLAN.md): forward `payload` to Sentry here, e.g.
    //   Sentry.captureException(error, { extra: payload.context });
    // Intentionally not implemented yet - no DSN, no dependency.
  }
}

export default reportError;
