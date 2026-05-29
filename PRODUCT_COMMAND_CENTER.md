# NordicFleet — Product Command Center

_The first file to read each session. Last updated: 2026-05-29._
_Keep this short and decision-driving. Update the status line + blockers as things change._

## Current objective

Move from **engineering-complete → validated private beta.** Stop adding
features; get the existing product in front of **5 real skiers/coaches**
and learn whether it helps on race day.

## Core loop (what the product is for)

Add skis → log wax → log testing/performance → review history → **pick the
right ski + wax for race day.** Everything else (coaching, Wax Truck,
import, sharing) orbits this loop. If a change doesn't make that loop
better or get it in front of a user, it's probably not the priority right now.

## Architecture (don't disturb)

- Monorepo: `apps/mobile` (RN 0.76 iOS), `apps/web` (Next 16), `apps/marketing` (Next 16), `packages/core` (pure, platform-free logic).
- `packages/core` is the source of truth for validation, payloads, parsers, the bracket engine, data export, and the new error/analytics contracts. Both clients import it. Keep it platform-free.
- Firebase (`nordicfleet-11e67`): Auth + Firestore. Security rules in `firestore.rules` are deployed + live-verified. **Never weaken them.**
- iOS sign-in works (root cause was a missing keychain entitlement — see the entitlements file + `MORNING_REPORT.md`). Don't disturb it.

## Current status (2026-05-29)

- **Gate green:** lint 0 errors · core 334 tests · mobile 261 (+1 skipped) · web build clean · iOS `xcodebuild` BUILD SUCCEEDED.
- **Engineering:** strong. Auth, data layer, rules, two clients, shared core, Wax Truck, marketing site, compliance (export/delete), and now PII-safe error + analytics contracts + web error boundaries.
- **Validation:** ~zero. **No human has completed a real session.** Every flow is "verified by tests/builds," not "used by a skier." This is the gap.
- **Deployed:** web app is live but **stale** (recent features not redeployed); marketing **not deployed**; Firestore rules **current**.

## Private beta success criteria

Beta is "working" when, across the 5 users:
1. ≥3 complete the full core loop (add 5 skis → log wax → log test → make a race-day call) without help.
2. ≥1 coach links an athlete and sends an advisory the athlete receives.
3. No stop-the-beta bug (data loss, security leak, can't sign in, crash w/o recovery).
4. We can answer, from their feedback: *would they use it next week, and does it help on race day?*

## Top blockers (to inviting users)

1. **Nobody has tested it** — run `MANUAL_BETA_TEST_SCRIPT.md` on both platforms first.
2. **Redeploy web** so the live URL has Wax Truck / export / error boundaries; resolve the `web` vs `nordicfleet-web` Vercel project question (`DEPLOYMENT_READINESS.md`).
3. **No production error visibility** — `reportError` funnel exists; wire Sentry per `OBSERVABILITY_PLAN.md` before wider release (OK to start the 5-user beta without it).
4. **Highest-risk flows unproven by a human:** Wax Truck (#11–13) and the coach messaging/advisory loop (#17–18) — see `BETA_READINESS_REPORT.md`.

## What NOT to build yet

ML/recommendations, subscriptions/payments, push notifications, Apple
Watch, team/org accounts, Android launch, crowdsourced wax database, major
redesign. Also: no dependency upgrades, no data-model rewrites, no auth
rewrite. (These are explicitly out of scope until beta feedback justifies them.)

## Next 5 engineering tasks (only if validation demands)

1. Wire **analytics** sink (Firebase Analytics already installed) per `ANALYTICS_PLAN.md` — 2 thin wrappers + 13 call sites.
2. Wire **Sentry** per `OBSERVABILITY_PLAN.md` (web + RN) — drop into the existing `reportError` funnel.
3. Add **web advisory composer** (parity gap — web has messaging but no advisory; `BETA_READINESS_REPORT.md` #17).
4. Commit **`.firebaserc`** + small deploy-reproducibility cleanups.
5. Whatever the top recurring beta complaint is (don't pre-guess it).

## Next 5 real-world validation tasks (do these FIRST)

1. Run `MANUAL_BETA_TEST_SCRIPT.md` end-to-end on iOS + web; fix any stop-the-beta bug.
2. Redeploy web; (optionally) deploy marketing.
3. Use it yourself for a week with your real quiver (esp. Wax Truck + OCR, the least-proven features).
4. Invite 5 users with `BETA_TESTER_GUIDE.md`; collect `BETA_FEEDBACK_FORM.md`.
5. Read the feedback before writing any new code; re-rank everything above.

## Metrics to watch (once analytics is wired)

`sign_up_completed` → `ski_added` → `wax_log_created` → `test_log_created`
completion rate (the loop funnel). Plus `wax_truck_winner_selected` and
`message_sent` (do coaches actually use the coach features?). All
PII-safe + bucketed (see `analytics.js`).

## Open product questions (for beta to answer)

- Does the app actually change a race-day decision, or is it a logbook people abandon?
- Is **Wax Truck** a killer feature or a gimmick coaches won't run on a cold morning?
- Is OCR sticker-scan accurate enough on real stickers to keep, or should it be hidden until tuned?
- Is the coach↔athlete one-way messaging enough, or do athletes expect to reply?
- What's the smallest version of this that someone would pay for?

## Map of the other docs

- `BETA_READINESS_REPORT.md` — 20-flow status table (start here for "does X work?").
- `OBSERVABILITY_PLAN.md` / `ANALYTICS_PLAN.md` — wire-up specs (contracts already in core).
- `BETA_TESTER_GUIDE.md` / `BETA_FEEDBACK_FORM.md` / `MANUAL_BETA_TEST_SCRIPT.md` — the beta package.
- `DEPLOYMENT_READINESS.md` — how/where to deploy + human steps.
- `BLOCKERS.md` — Android toolchain, iOS distribution, Vercel notes.
- `LAUNCH_AUDIT.md` / `READINESS_AUDIT.md` — prior honest assessments.
