# NordicFleet — Analytics Plan

_Last updated: 2026-05-29_

## TL;DR

The **contract is implemented and tested** in `packages/core`
(`analytics.js`): the closed event taxonomy, the safe-property allow-list
(privacy enforced in code), and bucketing. The **vendor wiring** (one thin
`track()` per platform + the 13 call sites) is **deferred** and specified
below so it's a small, mechanical follow-up — not scattered vendor calls.

## What's implemented now (this session, no new dependencies)

- `ANALYTICS_EVENTS` — the 13 event names, frozen.
- `buildAnalyticsEvent(name, props)` — rejects unknown event names; keeps
  only `SAFE_PROPERTY_KEYS` (`platform, isCoach, ski_count_bucket,
  wax_log_count_bucket, test_log_count_bucket`); drops everything else and
  any non-scalar value. **A careless caller cannot leak PII.**
- `countBucket(n)` → `'0' | '1-5' | '6-15' | '16+'`.
- 8 tests (`packages/core/src/services/__tests__/analytics.test.js`).

## Recommended sink

- **Mobile:** `@react-native-firebase/analytics` is **already installed**
  (`apps/mobile/package.json`) and Firebase is configured — so iOS needs
  **no new dependency**, just a wrapper + call sites.
- **Web:** Firebase JS Analytics (`firebase/analytics`, part of the
  already-installed `firebase@11`). It only initializes in the browser
  when a `measurementId` is present; otherwise the wrapper no-ops. No new
  dependency.

This keeps everything in the existing Firebase project (`nordicfleet-11e67`).

## The thin wrapper (one file per platform)

`apps/mobile/src/services/analytics.js`:
```js
import analytics from '@react-native-firebase/analytics';
import {buildAnalyticsEvent, countBucket} from '@nordicfleet/core';

const ENABLED = !__DEV__; // never log from dev; flip via a config if needed
export {countBucket};
export async function track(name, props) {
  const {name: n, params} = buildAnalyticsEvent(name, {platform: 'ios', ...props});
  if (!ENABLED) { return; }
  try { await analytics().logEvent(n, params); } catch {}
}
```

`apps/web/src/lib/analytics.js`:
```js
import {getAnalytics, logEvent, isSupported} from 'firebase/analytics';
import {buildAnalyticsEvent, countBucket} from '@nordicfleet/core';
// init lazily in the browser only when measurementId is set; no-op otherwise
export {countBucket};
export async function track(name, props) {
  const {name: n, params} = buildAnalyticsEvent(name, {platform: 'web', ...props});
  const a = await getClientAnalytics(); // returns null if unsupported/disabled
  if (a) { logEvent(a, n, params); }
}
```

Disable globally: `__DEV__` (mobile) / absent `measurementId` or
`NEXT_PUBLIC_ANALYTICS_DISABLED=1` (web). Both wrappers swallow errors so
analytics can never break a user flow.

## Event → call-site map

Fire **after** the operation succeeds. Counts are bucketed with
`countBucket(...)` — never raw.

| Event | Fire where (mobile / web) | Props |
|-------|---------------------------|-------|
| `sign_up_completed` | `AuthContext.signUp` / `providers signUp` after success | platform |
| `ski_added` | `skiService.createSki` / `firestore.createSki` caller | ski_count_bucket (post-add) |
| `ski_import_started` | web import `handleEnterMapping`/first parse | — (web only) |
| `ski_import_completed` | web import `handleSave` success | ski_count_bucket |
| `wax_log_created` | `waxLogService.createWaxLog` / web `createWaxLog` | wax_log_count_bucket |
| `test_log_created` | `testLogService.createTestLog` / web `createTestLog` | test_log_count_bucket |
| `wax_truck_test_created` | `waxTestService.createWaxTest` / web `createWaxTest` | — |
| `wax_truck_winner_selected` | runner `pickWinner` when `bracket.winnerId` set (both) | — |
| `coach_mode_enabled` | `setCoachCapability(true)` (both) | — |
| `coach_request_sent` | `coachRequestService.requestCoach` / web `requestCoach` | — |
| `message_sent` | `messageService.sendMessage`/`sendAdvisory` / web `sendMessage` | isCoach |
| `data_export_requested` | `dataExportService.exportAndShareUserData` / web `exportUserData` | — |
| `account_deleted` | `userService.deleteAccount` / web `deleteAccount` | — |

Prefer the **service layer** over the screen for events that have a single
service entry point (add ski, log wax/test, create wax test, send message,
export, delete) — one call site covers both the screen and any other
caller. Use the **screen** only for UI-specific events (`ski_import_started`).

## Privacy guardrails (already enforced)

- `buildAnalyticsEvent` is the only way to construct an event; it strips
  every non-allow-listed key. There is no code path to send a name, email,
  message body, wax note, serial, or GPS coordinate.
- Counts are bucketed, never raw, so even cardinality can't fingerprint a
  user.
- Set Firebase Analytics to **not** collect Advertising ID; on iOS leave
  ATT/IDFA off (no ads use case).

## Verification path

- Now: `analytics.test.js` covers the contract + privacy.
- After wiring: in Firebase console → Analytics → DebugView, enable debug
  mode, run the core loop on a test account, and confirm the 13 events
  arrive with **only** the allow-listed params. Then disable debug mode.

## Files expected to change when wiring

- mobile: `src/services/analytics.js` (new), ~9 service/screen call sites.
- web: `src/lib/analytics.js` (new), ~9 call sites.
- No change to `packages/core` (the contract is done).

## Out of scope (intentionally)

Funnels, retention cohorts, dashboards, A/B testing. For a 5-user beta the
goal is just: "did they complete the core loop at least once?" The 13
events above answer that.
