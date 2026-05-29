// Error-report shaping — pure, platform-free, and privacy-first.
//
// This module does NOT talk to any crash/error vendor. It only shapes an
// error + context into a minimal, PII-safe payload that a platform
// wrapper (apps/web/src/lib/reportError, apps/mobile/src/services/
// reportError) can hand to console today and Sentry/Crashlytics later.
//
// Privacy guardrail is enforced HERE, in code, not just in docs: only an
// allow-listed set of context keys survives. Anything else is dropped, so
// a careless caller can't leak skier names, messages, wax notes,
// locations, emails, or inventory through the error pipe.

// Context keys that are safe to attach to an error report. Everything not
// in this list is stripped. Keep this list boring on purpose.
const ALLOWED_CONTEXT_KEYS = Object.freeze([
  'platform', // 'ios' | 'web'
  'screen', // route/screen name, e.g. 'WaxTestRunner'
  'route', // web pathname pattern, e.g. '/wax-truck/[testId]'
  'component', // component/boundary name
  'boundary', // 'global' | 'segment' | 'react'
  'isCoach', // boolean capability flag
  'code', // error code, e.g. 'auth/keychain-error'
  'action', // short verb, e.g. 'createWaxTest'
]);

const MAX_MESSAGE = 500;
const MAX_STACK = 4000;

function truncate(str, max) {
  if (typeof str !== 'string') {
    return undefined;
  }
  return str.length > max ? `${str.slice(0, max)}…[truncated]` : str;
}

// Only primitives survive, and only for allow-listed keys.
function safeContext(context) {
  const out = {};
  if (!context || typeof context !== 'object') {
    return out;
  }
  for (const key of ALLOWED_CONTEXT_KEYS) {
    const v = context[key];
    if (v === undefined || v === null) {
      continue;
    }
    if (typeof v === 'string') {
      out[key] = truncate(v, 120);
    } else if (typeof v === 'number' || typeof v === 'boolean') {
      out[key] = v;
    }
    // objects/arrays are intentionally dropped — they're the usual
    // vector for leaking PII.
  }
  return out;
}

/**
 * Shape an error + context into a minimal, PII-safe report payload.
 *
 * @param {unknown} error
 * @param {object} [context]  only ALLOWED_CONTEXT_KEYS survive
 * @returns {{name: string, message: string, code?: string, stack?: string,
 *           context: object, at: string}}
 */
function scrubErrorForReport(error, context) {
  let name = 'Error';
  let message = 'Unknown error';
  let code;
  let stack;

  if (error && typeof error === 'object') {
    if (typeof error.name === 'string') {
      name = error.name;
    }
    if (typeof error.message === 'string') {
      message = error.message;
    }
    if (typeof error.code === 'string') {
      code = error.code;
    }
    if (typeof error.stack === 'string') {
      stack = error.stack;
    }
  } else if (typeof error === 'string') {
    message = error;
  }

  const payload = {
    name,
    message: truncate(message, MAX_MESSAGE),
    context: safeContext(context),
    at: new Date().toISOString(),
  };
  if (code) {
    payload.code = code;
  }
  if (stack) {
    payload.stack = truncate(stack, MAX_STACK);
  }
  return payload;
}

module.exports = {
  ALLOWED_CONTEXT_KEYS,
  scrubErrorForReport,
};
