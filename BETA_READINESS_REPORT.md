# NordicFleet — Beta Readiness Report

_Generated: 2026-05-29 · autonomous hardening session · branch `claude-rewrite`_

## How to read this

Status legend (deliberately strict):

- **Ready** — implemented, has automated test or live-script evidence, no known bug. Still **not** human-field-tested.
- **Rough** — works in code/tests but has a known sharp edge, or only one platform is covered, or only indirect evidence.
- **Unknown** — code exists but there is no real evidence it behaves correctly; needs a manual pass.
- **Broken** — known not to work.

**Field-tested status across the whole product: NONE.** No person other than the developer has completed any real session. Every "Ready" below means "verified by tests/builds/live-REST," not "a skier used it." This is the single biggest beta risk and the reason this report exists.

Evidence keys: `core/<file>` = packages/core test; `mobile/<file>` = apps/mobile test; `script/<name>` = live REST verification against `nordicfleet-11e67`; `build` = compiles in `web:build`/`xcodebuild`; `live` = exercised against live Firebase this or a prior session.

## Flow-by-flow

| # | Flow | iOS | Web | Evidence | Risk | Recommended next action |
|---|------|-----|-----|----------|------|------------------------|
| 1 | Sign up | Ready | Rough | `mobile/signup.test.js`, `mobile/AuthContext.test.js`; iOS native SIGN-UP OK `script/ios-signin-verify`; web `script/verify-flows` (REST) | Med — web UI never human-driven | Manual web signup once on deployed URL |
| 2 | Sign in | Ready | Ready | iOS native SIGN-IN OK `script/ios-signin-verify` (keychain fix); web verified on deployed URL (prior session) | Low | None blocking |
| 3 | Sign out | Rough | Rough | `AuthContext.signOut`; used in `mobile/profile.*`; no dedicated assertion | Low | Cover in manual smoke |
| 4 | Add ski | Ready | Rough | `mobile/newSki.test.js`, `mobile/skiService.test.js`, `core/skiOperations`; `script/verify-flows` | Low | Manual web add-ski |
| 5 | Edit ski | Ready | Rough | `mobile/skiService.test.js`, `core/skiOperations` (update payload); web `ski/[id]/edit` build-only | Low | Manual web edit |
| 6 | Retire / unretire ski | Ready | Rough | `mobile/skiService.test.js`; `script/verify-data-integrity` §4a (soft delete) | Low | Manual web retire toggle |
| 7 | Log wax | Ready | Rough | `mobile/waxinglog.test.js`, `mobile/waxLogService.test.js`, `core/waxLog`; `script/verify-flows` | Low | Manual web log-wax |
| 8 | Log test | Ready | Rough | `mobile/testinglog.test.js`, `mobile/testLogService.test.js`, `core/testLog`; `script/verify-flows` | Low | Manual web log-test; confirm geolocation prompt on web |
| 9 | View ski detail / history | Ready | Rough | `mobile/skiInfo.test.js`; web `ski/[id]` build-only | Low | Manual web detail |
| 10 | Spreadsheet import (web) | n/a | Rough | `core/spreadsheetParser.*` (4 suites incl. real-data fixture, re-map fidelity); web UI build-only | Med — parser solid, UI never human-driven | Manual paste of a real user sheet |
| 11 | Wax truck — setup | Unknown | Unknown | `mobile/waxTestService.test.js`, `core/waxTestOperations`; UI build-only | **High — newest feature, zero human use** | Build a real test on both platforms |
| 12 | Wax truck — bracket generation | Ready* | Ready* | `core/waxTestOperations` (sizes 2/3/4/5/8/16, byes, run-to-winner, 31 tests) | Med — *logic Ready, UI Unknown | Verify rendering matches logic on device |
| 13 | Wax truck — winner selection | Unknown | Unknown | `core/advanceWinner` tested; UI tap path never exercised | High | Run a full bracket to a winner, both platforms |
| 14 | Coach mode enable / disable | Ready | Rough | `mobile/userService.coachCapability.test.js`, `mobile/profile.coach.test.js`, `ModeContext.test.js`, web `ModeProvider` | Med — cascade only mock-tested | Manual enable→disable with a linked athlete |
| 15 | Coach request / accept | Ready | Rough | `mobile/coachRequestService.test.js`, `core/coachOperations`; `script/verify-coach-pairing` (14/14 live) | Low — data layer live-verified | Manual two-account UI pass |
| 16 | Coach views athlete fleet | Ready | Rough | `script/verify-coach-pairing` (coach reads athlete skis live; write denied) | Low | Manual coach browse |
| 17 | Coach sends message / advisory | Rough | Rough | `mobile/messageService.test.js`, `core/messageOperations`+`advisoryOperations`; advisory **compose iOS-only** | Med — never live/human; web has no advisory composer | Send a real message both ways; decide on web advisory composer |
| 18 | Athlete reads message | Rough | Rough | `messageService.subscribe*`; unread badge in TabBar/SiteHeader | Med — never human-driven | Manual: coach sends → athlete sees badge + reads |
| 19 | Data export (JSON) | Rough | Rough | `core/dataExport.test.js` (8); mobile share-sheet glue + web Blob download, neither human-tested | Med | Export on both platforms, open the file |
| 20 | Delete account | Ready | Rough | `mobile/userService.deleteAccount.test.js`, `mobile/settings.deleteAccount.test.js` (now in the Settings screen), `script/verify-data-integrity` delete section (live); web `deleteAccount` added but not human-tested | Med — destructive; web path unproven | Manual web delete with a throwaway account |

## Summary

- **Strongest:** the shared `packages/core` logic (auth payloads, validators, parsers, bracket engine, data export) — 320 deterministic tests — and the data-layer security rules, which are live-verified.
- **iOS** is generally a notch ahead of **web** because it has the test suite (`apps/mobile`, 261 tests) and the native sign-in was just fixed + verified. Web relies on `web:build` + live REST scripts and has **no unit tests**.
- **Highest-risk flows for beta:** Wax Truck (#11–13, brand-new, never human-used), and the cross-account coach messaging/advisory loop (#17–18, only mock-tested). These are exactly what a coach beta tester will reach for, so they need a manual two-account pass before any coach is invited.
- **Web parity gaps:** no advisory composer on web (#17); web has no automated tests at all.

## Known follow-ups (deferred, not beta-blocking)

- **Share = snapshot only (issue #6).** Sharing a fleet/ski now sends the
  screenshot *plus* an invite caption with a CTA + `nordicfleet.com` link
  (`shareService.fleetShareMessage` / `skiShareMessage`). There are **no
  per-ski / per-fleet web deep links yet** — a recipient lands on the
  marketing site, not the shared item. Building real deep links (web route
  that renders a public ski/fleet view + universal links) is the proper
  fix and is deferred until beta demand justifies it.

## What "Ready for 5 beta users" needs from this table

1. One manual two-account pass (coach + athlete) on **both** platforms covering #14–18.
2. One full Wax Truck run to a winner on both platforms (#11–13).
3. One web pass of #1, #4–10, #19–20 on the deployed URL (web is the least-tested client).
4. Observability in place so failures during the above are captured (see OBSERVABILITY_PLAN.md).

None of these require new features — they require a human and the manual scripts in `MANUAL_BETA_TEST_SCRIPT.md`.
