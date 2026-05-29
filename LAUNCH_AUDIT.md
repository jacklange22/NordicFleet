# NordicFleet — Launch Audit

_Date: 2026-05-29. Author: the "push to launch-ready" build session._

This audit reports **evidence**, not a verdict. Whether NordicFleet is
ready to put in front of users is your call — below is what was built,
what was verified and how, and what was explicitly **not** verified so
you can close those gaps before you decide.

A blunt headline up front: **no human has used any of this.** Everything
here is verified by compilation, automated tests, and live security-rule
checks — not by a person tapping through the app. Treat it as
"engineering-complete, not user-validated."

---

## What shipped this session

| Phase | Scope | State |
|------|-------|-------|
| 1 | **Wax Truck** — bracket-based head-to-head wax testing, as a 3rd mode | Implemented on iOS + web |
| 2 | **Marketing site** (`apps/marketing`) for nordicfleet.com | Built; not deployed |
| 3 | **Android foundation** — get a debug build unstuck | Config fixed; toolchain-blocked |
| 4 | **Hardening** — fix 3 named fall-throughs | Done |
| 5 | **Compliance** — export, account deletion, legal links | Done |
| 6 | **Verification + this audit** | Done (with documented gaps) |

Commits this session: `512845c` (Wax truck 1) … `0260203` (compliance),
16 commits, each small and self-contained.

---

## Definition-of-done scorecard

The original brief set nine objective criteria. Honest status:

### 1. Every feature implemented on its platforms — ✅ (with one caveat)
- **Wax Truck**: iOS (`waxTruck`, `waxTestSetup`, `waxTestRunner`) and web
  (`/wax-truck`, `/wax-truck/new`, `/wax-truck/[testId]`). Category
  selector filters the typeahead but **never blocks** free text — the
  core rule the brief insisted on. Winner → race-day advisory bridge on
  iOS.
- **Marketing site**: landing, features, coaches, pricing, about, privacy,
  terms — built.
- **Android**: project configuration is complete; the build itself is
  toolchain-blocked (see #6).
- Caveat: Wax Truck's "send winner as advisory" exists on iOS only (web
  has the full test flow but not the advisory bridge — web has no
  advisory composer yet).

### 2. `npm run lint` — 0 errors, all workspaces — ✅
Verified this session. (6 pre-existing warnings remain — inline-style and
one disabled test — all non-blocking and predating this work.)

### 3. `npm test` — green, all workspaces, with new tests — ✅
- core: **320 passing** (was 311). New: bracket engine (31), waxTestService
  shape (7), data export (8), import re-map fidelity (1).
- mobile: **261 passing / 1 skipped** (the pre-existing disabled App test).
  New: ModeContext + TabBar wax-truck coverage.
- web: `--passWithNoTests` (web has no unit tests; it's covered by build).

### 4. `npm run web:build` — clean, both web surfaces — ✅
Both `@nordicfleet/web` (18 routes) and `@nordicfleet/marketing` (9 routes)
compile and statically generate without error.

### 5. iOS `xcodebuild build` — ⚠️ NOT re-verified this session
All Wax Truck / compliance work on iOS is **pure JS/React Native** — no
native modules added, no Podfile or Xcode project changes. That code is
bundled by Metro at runtime, not compiled by `xcodebuild`, so the native
build is unaffected by this session's changes, and the app was confirmed
building + launching on the iPhone 17 simulator in the prior session.
**But:** a fresh `xcodebuild` was not run this session (it needs
`pod install` + a multi-minute Xcode build). Before launch, do a clean
build and tap through the new screens.

### 6. Android `./gradlew assembleDebug` — ✅ documented blocker
The brief allowed "succeeds OR documented blocker." The build now gets
through Gradle bootstrap, the RN gradle plugin compile, and project
configuration — past the monorepo path problems that previously stopped
it at line 2 of `settings.gradle`. It stops on **environment** gaps only:
JDK 17 (only 11 is installed) and the Android SDK (not installed), plus
`google-services.json`. All three are documented in **`BLOCKERS.md`** with
the captured failure log at `scripts/logs/android-assembleDebug.log` and
exact remediation steps. Repo-side configuration work is complete.

### 7. Every feature verified vs LIVE Firebase — ⚠️ PARTIAL (rules ✅)
- The updated **security rules are deployed live** (`firebase deploy
  --only firestore:rules`, compiled + released to `nordicfleet-11e67`).
- **New rules are live-verified** via `scripts/verify-wax-truck.sh`
  (log: `scripts/logs/verify-wax-truck.log`, **7/7 passed**): owner can
  create/read a `waxTests` doc, other users are blocked (403 read +
  write); anonymous can create a `marketingSignups` doc, and listing is
  blocked for both anonymous and signed-in users.
- Prior features retain their earlier live verify scripts
  (`verify-data-integrity.sh`, `verify-coach-pairing.sh`, etc.).
- **Gap:** the full Wax Truck *application flow* (build a test in the UI →
  run the bracket → read results) was not driven against live Firebase
  end-to-end — only the data-layer rules were. The service layer is
  unit-tested against the firestore mock, not the live backend.

### 8. Web verified on deployed Vercel URL — ❌ NOT done this session
- The web app was already deployed at the canonical `nordicfleet-web`
  Vercel project from a prior session, but **this session's changes
  (Wax Truck pages, geolocation, compliance) were not redeployed.**
- The **marketing site was not deployed** at all — it needs its own
  Vercel project, and nordicfleet.com needs to be purchased + pointed at
  it (DNS), which I can't do. See "What you must do" below.

### 9. LAUNCH_AUDIT.md written honestly — ✅ this document.

---

## What you must do before launch (can't be done from here)

1. **Redeploy the web app** so the Wax Truck pages + compliance changes
   go live: `npm run web:build` is clean; deploy the `nordicfleet-web`
   project (`npx vercel --prod` from the repo, per `BLOCKERS.md`).
2. **Deploy the marketing site** as a new Vercel project rooted at
   `apps/marketing`, set its six `NEXT_PUBLIC_FIREBASE_*` env vars (same
   project), and set `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_MARKETING_URL`.
3. **Buy nordicfleet.com** and point DNS at the marketing Vercel project;
   point an `app.` subdomain at the web app. (Domain purchase + DNS are
   out of scope for an automated session.)
4. **Android**: install JDK 17 + the Android SDK, drop in
   `google-services.json`, then `./gradlew assembleDebug` (see BLOCKERS.md).
5. **iOS**: `cd apps/mobile/ios && pod install`, clean `xcodebuild`, and
   tap through the new Wax Truck screens on a simulator/device. Add
   `GoogleService-Info.plist` if not already present.
6. **Apple Developer Program**: enrollment is required to ship to
   TestFlight / App Store — a human + payment step.
7. **Manually tap through** the new flows on both platforms. Nothing here
   replaces a person actually using the wax-test builder and bracket
   runner.

---

## Things I deliberately did NOT do (and why)

- **No fabricated data.** The wax dictionary only gained confidently-real
  products (Swix Cera F, Toko HelX) plus three clearly-labeled generic
  structure conventions. Structure stays mostly free-text, by design.
- **No payment / subscription processing**, no domain purchase, no DNS
  changes, no Apple enrollment — all explicitly out of scope and/or
  require a human with credentials/payment.
- **No screenshots** — capturing simulator screenshots needs the macOS
  Screen Recording permission for the desktop app, which is not granted.
- **No `--force`, no `--legacy-peer-deps`, no disabled or deleted tests,
  no commented-out code.** One pre-existing lint error (a dead variable in
  the spreadsheet parser) was fixed properly, not suppressed.

---

## Bottom line

The codebase is in strong shape: the marquee feature is built on both
primary platforms, the gate is green, the new security rules are live and
proven, the marketing site and legal pages exist, and the Android blocker
is real-but-documented. The honest gaps to closing the loop are all
**deploy + device + human** steps that need your credentials and your
hands: redeploy web, deploy marketing, wire the domain, finish the Android
toolchain, rebuild iOS, and — most importantly — actually use it.
