// Analytics contract — pure, platform-free, privacy-first.
//
// This module does NOT call any analytics vendor. It defines the event
// taxonomy, the SAFE property allow-list, and bucketing helpers, and
// shapes a validated `{name, params}` event. Platform wrappers (mobile:
// Firebase Analytics; web: a thin sink) take that shaped event and send
// it. Putting the contract here means:
//   - the privacy guarantee is enforced in code + tested, not just docs;
//   - both clients emit identical, comparable events;
//   - vendor calls never get scattered through screens.
//
// See ANALYTICS_PLAN.md for where each event fires and how to wire a sink.

// The complete, closed set of events. Anything not here is rejected so a
// typo or an ad-hoc event can't silently pollute the data.
const ANALYTICS_EVENTS = Object.freeze({
  SIGN_UP_COMPLETED: 'sign_up_completed',
  SKI_ADDED: 'ski_added',
  SKI_IMPORT_STARTED: 'ski_import_started',
  SKI_IMPORT_COMPLETED: 'ski_import_completed',
  WAX_LOG_CREATED: 'wax_log_created',
  TEST_LOG_CREATED: 'test_log_created',
  WAX_TRUCK_TEST_CREATED: 'wax_truck_test_created',
  WAX_TRUCK_WINNER_SELECTED: 'wax_truck_winner_selected',
  COACH_MODE_ENABLED: 'coach_mode_enabled',
  COACH_REQUEST_SENT: 'coach_request_sent',
  MESSAGE_SENT: 'message_sent',
  DATA_EXPORT_REQUESTED: 'data_export_requested',
  ACCOUNT_DELETED: 'account_deleted',
});

const EVENT_NAME_SET = new Set(Object.values(ANALYTICS_EVENTS));

// The ONLY event properties that may ever be sent. Everything else is
// dropped. Note what's absent: names, emails, message bodies, wax
// names/notes, ski serials, GPS — none can be expressed here.
const SAFE_PROPERTY_KEYS = Object.freeze([
  'platform', // 'ios' | 'web'
  'isCoach', // boolean
  'ski_count_bucket',
  'wax_log_count_bucket',
  'test_log_count_bucket',
]);

const VALID_BUCKETS = Object.freeze(['0', '1-5', '6-15', '16+']);

/**
 * Bucket a raw count into a coarse, non-identifying range.
 * @param {number} n
 * @returns {'0'|'1-5'|'6-15'|'16+'}
 */
function countBucket(n) {
  const num = Number(n);
  if (!Number.isFinite(num) || num <= 0) {
    return '0';
  }
  if (num <= 5) {
    return '1-5';
  }
  if (num <= 15) {
    return '6-15';
  }
  return '16+';
}

function isAllowedScalar(v) {
  return (
    typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'
  );
}

/**
 * Validate an event name + shape its params down to the safe allow-list.
 * Throws on an unknown event name (fail fast in dev/tests). Drops any
 * property not in SAFE_PROPERTY_KEYS, and drops non-scalar values.
 *
 * @param {string} name  one of ANALYTICS_EVENTS values
 * @param {object} [props]
 * @returns {{name: string, params: object}}
 */
function buildAnalyticsEvent(name, props) {
  if (!EVENT_NAME_SET.has(name)) {
    throw new Error(`Unknown analytics event: ${name}`);
  }
  const params = {};
  if (props && typeof props === 'object') {
    for (const key of SAFE_PROPERTY_KEYS) {
      const v = props[key];
      if (v !== undefined && v !== null && isAllowedScalar(v)) {
        params[key] = v;
      }
    }
  }
  return {name, params};
}

module.exports = {
  ANALYTICS_EVENTS,
  SAFE_PROPERTY_KEYS,
  VALID_BUCKETS,
  countBucket,
  buildAnalyticsEvent,
};
