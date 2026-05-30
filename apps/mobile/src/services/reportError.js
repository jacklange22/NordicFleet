// Mobile error-report seam.
//
// Single funnel for crashes/errors on iOS. Today it scrubs PII (via
// @nordicfleet/core) and logs to the console. It is the ONE place a real
// vendor (Firebase Crashlytics or Sentry) gets wired later — see
// OBSERVABILITY_PLAN.md. Keep all reporting going through here so the
// vendor swap is a one-file change.

import {scrubErrorForReport} from '@nordicfleet/core';
import {trace} from './devTrace';

/**
 * Report an error through the PII-safe funnel.
 * @param {unknown} error
 * @param {object} [context] only @nordicfleet/core ALLOWED_CONTEXT_KEYS survive
 */
export function reportError(error, context) {
  let payload;
  try {
    payload = scrubErrorForReport(error, {platform: 'ios', ...context});
  } catch {
    payload = {name: 'Error', message: 'reportError failed to scrub'};
  }
  // Always visible in dev so a failure is never silently swallowed.
  if (__DEV__) {
    console.warn('[reportError]', payload);
  }
  // TODO(OBSERVABILITY_PLAN.md): forward to Crashlytics/Sentry here, e.g.
  //   crashlytics().recordError(error);  // with payload.context as attrs
  // Intentionally not implemented yet — no native vendor dependency.
}

let installed = false;

/**
 * Install a global handler for otherwise-unhandled JS errors (async
 * rejections surfaced by RN, errors outside React render). Preserves the
 * previous handler so the dev red-box still appears. Idempotent.
 */
export function installGlobalErrorHandler() {
  if (installed) {
    return;
  }
  installed = true;
  const g = global;
  if (!g || !g.ErrorUtils || typeof g.ErrorUtils.getGlobalHandler !== 'function') {
    return;
  }
  const previous = g.ErrorUtils.getGlobalHandler();
  g.ErrorUtils.setGlobalHandler((error, isFatal) => {
    try {
      trace('global JS error caught', {fatal: !!isFatal});
      reportError(error, {boundary: 'global', code: isFatal ? 'fatal' : 'nonfatal'});
    } catch {
      // never let reporting break the chain
    }
    if (typeof previous === 'function') {
      previous(error, isFatal);
    }
  });
}

export default reportError;
