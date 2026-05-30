# Product Hardening Report

_Branch `claude-rewrite` · 2026-05-30 · disciplined overnight pass._
_Evidence: `debug/product-hardening-20260530-*/`._

## 1. Executive summary

This was a **stabilization + core-UX** pass, run disciplined: each change is
small, tested, and committed; nothing was shipped untested. The headline win
is **the Wax Truck "Create test" crash is fixed** (root cause found and
proven), on top of the already-fixed mode-switch crash. I also landed four
high-value UX completions. The remaining large phases (messaging overhaul,
history screens, weight/height units, and the full public-sharing system)
were **deliberately deferred rather than half-built** — they are documented
below with rationale and exact next steps. **This is an honest partial of a
very large brief, not a claim that everything was done.**

Gate at the tip: **lint 0 errors · mobile 309 tests +1 skipped · core 341 ·
web build ✓ · Metro bundle ✓ · iOS simulator build ✓.**

## 2. What was fixed / added (done, tested, committed)

| Phase | Change | Commit |
|---|---|---|
| 1 | **Wax Truck create crash fixed** (nested-array → Firestore) | `3dd8d09` |
| 1 | Wax Truck: required **Test type** at top (Kick/Paraffin/Structure/Topcoat), one type per test, safe create errors via `reportError` | `dec9402` |
| 3 | **Legal + share links → live marketing Vercel URL** (no more dead nordicfleet.com) | `9c81483` |
| 4 | **Delete account: extra confirmation stage** ("Delete forever" → "Yes, delete forever" → password) + build tag visible in Release | `f9f12b6` |
| 6 | **Edit a ski** from its detail screen (pre-fill + `updateSki`) | `56bb7c0` |
| — | (earlier this branch) mode-switch native crash fix | `05be232` |

## 3. Wax Truck crash — root cause & fix

**Root cause:** the bracket's `rounds` is `Match[][]` (an array of arrays).
**Firestore forbids nested arrays**, so every wax-test write rejected — and RN
Firebase can crash *natively* on it, which a JS `try/catch` cannot catch (so
the app crashed instead of showing the error). The test mock didn't enforce
the limit, so unit tests passed while the device crashed. Type was irrelevant
because the bracket shape is identical for every wax type — exactly the report.

**Fix:** at the `waxTestService` boundary, **serialize** the bracket to a
rounds-**map** (`{"0": Match[], "1": Match[]}`) on every write and
**deserialize** back to `Match[][]` on every read. Core + runner keep the
array form; only storage changes. Also: required test type, and create
failures now route through `reportError` + show a clear message. Regression
tests prove the stored doc has no nested array, the read restores the array
form, and a 5-combo bye bracket round-trips. Bracket generation already
supported arbitrary counts >2 with byes (verified).

## 4. Message / unread behavior — **DEFERRED**

Not changed this session. The messaging unification (one chronological
sent+received list, accurate received-only unread badge, tap-to-open clears)
is a real but separate piece touching `messages.js`, `messageDetail.js`,
`messageService`, and the TabBar badge. It was deferred to avoid a rushed,
under-tested change. **Next step:** audit `subscribeUnreadCountForAthlete`
(confirm it filters `senderUid != me && !read`) and merge the sent/received
queries into one ordered list.

## 5. Legal link status

**Done.** iOS Settings (`legalUrl`) and the web profile now default to
**`https://marketing-black-eight.vercel.app`** (`/privacy`, `/terms`) instead
of the unowned `nordicfleet.com`. Centralized + env-overridable in
`apps/mobile/src/config/urls.js`. Both marketing pages return HTTP 200.
**Web caveat:** the live web app shows the new default only after a **web
redeploy** (or set `NEXT_PUBLIC_MARKETING_URL` in Vercel).

## 6. Delete-account new flow

**Done.** Three stages, no typing required: tap **Delete account** → alert
**"Delete forever"** → second alert **"Yes, delete forever"** → password
reauth modal → delete. Cancel available at every stage; a single accidental
tap cannot reach the destructive action. Tests cover both confirmations,
second-stage cancel, and the full success path.

## 7. History / stat-card behavior — **DEFERRED**

Not done. The Wax-History / Test-History screens + making stat cards navigate
to them is a self-contained feature (data already exists via
`listAllWaxLogs` / `listAllTestLogs`); deferred for time. **Next step:** add
`WaxHistory` + `TestHistory` list screens + routes, link Home/Profile stats.
(These are also the natural entry points for editing wax/test logs — see §8.)

## 8. Edit ski / wax / test — **partial**

- **Edit ski: DONE.** The ski-detail header has an Edit action that reopens
  the Add-Ski form pre-filled, saving via `updateSki` (merge preserves
  `createdAt`, bumps `updatedAt`).
- **Edit wax log / test log: DEFERRED.** These are NOT a quick reuse: the wax
  and test log screens are *multi-ski batch* forms ("log a wax for several
  skis at once"), not single-record editors. Editing one existing log needs a
  dedicated edit screen (load one log → form → `updateWaxLog`/`updateTestLog`).
  The services support updates; the UI is the work. Deferred honestly rather
  than forced into the batch form.

## 9. Unit preferences (weight/height) — **DEFERRED**

Not done. Core kg↔lb / cm↔in conversion + a Settings preference + the profile
edit toggle is bounded but touches the profile edit modal; deferred for time.
Internal storage stays metric (existing values are metric), so it can be added
later without data migration.

## 10–12. Public share links — **DEFERRED (largest piece)**

Not done. This spans **four surfaces** — core (share payload/sanitization),
**Firestore rules** (a new `publicShares` collection with safe
unauth-read/owner-write/expiry/revoke), **marketing** public pages
(`/share/fleet|ski|test/[id]`), and **mobile** (share options, duration,
revoke, "Manage shared links"). Building this securely and tested is a
multi-day feature; doing it overnight would mean unreviewed security rules
touching live data — explicitly against the brief. **Deferred in full.**
`apps/mobile/src/config/urls.js` already exposes `shareUrl(type, id)` pointing
at the marketing Vercel URL as the foundation. The current share still sends a
snapshot **with an invite caption + link** (not a context-less screenshot).

## 13. Website deployment status

- Marketing **https://marketing-black-eight.vercel.app** and app
  **https://nordicfleet-web.vercel.app** are live (all audited routes 200).
- **Web change this session:** the profile legal-link default. The live web
  app needs a **redeploy** to pick it up (push to `main` if Vercel auto-deploys
  main, or `vercel --prod` from `apps/web`). No marketing code changed.
- Full domain/DNS plan unchanged — see `WEBSITE_STATUS.md`.

## 14. Tests / builds run

`lint 0 errors` · `mobile 309 +1 skipped` · `core 341` · `web:build ✓` ·
`react-native bundle ✓` · `build-ios-simulator.sh → BUILD SUCCEEDED`. Logs in
`debug/product-hardening-20260530-*/`. **No Firestore rules changed** → none
deployed.

## 15. What was deferred (and why)

Messaging (§4), History screens (§7), Edit wax/test logs (§8), Units (§9),
Public sharing (§10–12). All deferred to keep every shipped change small +
tested, per the brief's discipline rule — not abandoned. Each has a concrete
next step above.

## 16. Still needs manual phone testing

Reinstall, then verify: build tag `product-hardening-1` in Settings · mode
switching (no crash) · **create a Kick / Paraffin / Structure / Topcoat Wax
Truck test → lands in the runner, no crash** · run a bracket to a winner ·
**Edit a ski from its detail** · Privacy/Terms open the marketing Vercel pages
· Delete account shows the two confirmations.

## 17. Exact phone reinstall steps

See `PHONE_INSTALL_NEXT_STEPS.md`. Short: delete app → `npm start --
--reset-cache` → clean build folder → Run from Xcode → confirm Settings shows
`product-hardening-1`. (Device runs Release now — the build tag is visible in
Release too.)

## 18. Web / marketing URLs to test

- App: https://nordicfleet-web.vercel.app  (`/login`, `/signup`, `/home`, `/profile`)
- Marketing: https://marketing-black-eight.vercel.app  (`/`, `/privacy`, `/terms`)

## 19. Beta demo script for a coach

1. Open app → **Settings** shows the build tag (proves latest build).
2. **Add a ski** (brand, model, technique, type) → opens its detail.
3. **Edit the ski** (pencil top-right) → fix the name → saves back to detail.
4. Switch to **Wax Truck** mode (no crash) → **New test** → pick **Paraffin**,
   name it, add 2–3 wax combinations → **Create** → bracket appears.
5. Run the bracket head-to-head to a **winner**.
6. Back to personal mode → **log a wax**, **log a test** for the ski.
7. **Profile → Settings → Privacy Policy** opens the live marketing page.
8. (Show the safety) **Delete account** → note the two explicit confirmations
   before any password prompt (then Cancel).
