# Overnight Stabilization Report

_Branch `claude-rewrite` · 2026-05-30 · evidence in `debug/overnight-20260530-0046/`._

## 1. Executive summary

Stabilization + verification pass, no new features. The headline: **the
reported iPhone freeze produced no crash report and does not implicate
NordicFleet in any memory event** — so it is a **hang or a stale on-device
Debug bundle**, not a native crash or a NordicFleet memory kill. I hardened
the boot/mode paths, added a timestamped `[NF_BOOT]` boot trace + watchdog to
pin the hang on-device, preserved + committed the device signing, fixed one
navigation label mismatch, audited every screen and all 25 core flows, and
verified both web surfaces are live. The full gate is green. **The freeze
cannot be reproduced in the simulator (the app boots cleanly), so the decisive
next step is a clean reinstall + capturing the `[NF_BOOT]` trace on the
phone.**

## 2. Root cause of freeze — best current diagnosis (not proven)

**Not proven, because the evidence to prove it does not exist on this machine.**
What IS established:

- **No native crash**: zero `NordicFleet-*.ips` crash reports anywhere.
- **Not a NordicFleet memory kill**: NordicFleet appears in **none** of the
  Jetsam events; those events killed/measured Spotify, Oura, Gmail, etc.
- **Logs are stale**: newest device log synced to this Mac is **2026-05-25**,
  days before the current freeze — there are **no logs of the actual freeze**.

That signature (foreground app unresponsive, no `.ips`) is most consistent
with a **JS-thread hang** or a **stale/disconnected Debug bundle** (the #1
cause of an RN "freeze" with no crash log). Static analysis found **no
infinite loop** in entry/providers/navigation/hooks. Mitigations added (boot
timeout, mode-race fix) + the `[NF_BOOT]` trace will either prevent or
pinpoint it on the next device run.

## 3. Crash-report findings

Full detail: `debug/overnight-*/CRASH_ANALYSIS.md`.

| Candidate | Verdict |
|---|---|
| Native crash | Ruled out (no NordicFleet `.ips`) |
| JS-exception crash | Ruled out as a *crash* (no report; ErrorBoundary + global handler catch these) |
| Jetsam kill of NordicFleet | Ruled out (absent from every Jetsam event) |
| Watchdog kill | No evidence |
| **Hang / stale Debug bundle** | **Most consistent** |

## 4. Commits made this session

| Hash | Commit |
|---|---|
| `cf76ab5` | chore: preserve iOS development team signing |
| `90416ab` | debug: [NF_BOOT] timestamped boot trace + watchdog; harden mode tests |
| `809e95c` | fix(ios): correct coach-dashboard profile affordance + dev build tag |

(Built on prior `94aada2` "harden boot/mode against silent hangs + freeze
diagnostics".) A docs+evidence commit follows in Phase 14.

## 5. Files changed

- **Signing**: `apps/mobile/ios/NordicFleet.xcodeproj/project.pbxproj`
  (DEVELOPMENT_TEAM + entitlements; keychain preserved).
- **Boot trace/hardening**: `src/services/devTrace.js`, `index.js`, `App.tsx`,
  `src/context/AuthContext.js`, `src/context/ModeContext.js`,
  `src/screens/AuthLoadingScreen.js`, `src/components/ui/TabBar.js`,
  `src/services/firebase.js`, `src/components/ErrorBoundary.js`,
  `src/services/reportError.js` + `ModeContext.test.js` (+3 tests).
- **Nav fix + build tag**: `src/screens/coachDashboard.js`,
  `src/buildInfo.js`, `src/screens/settings.js`.
- **Docs**: `PHONE_FREEZE_DEBUG_STEPS.md`, `PHONE_INSTALL_NEXT_STEPS.md`,
  `WEBSITE_STATUS.md`, `OVERNIGHT_STABILIZATION_REPORT.md`, `debug/overnight-*`.

## 6. Tests / builds run

| Gate | Baseline | Final |
|---|---|---|
| `npm run lint` | 0 errors (5 warn) | **0 errors (5 warn)** |
| `npm test` (mobile) | 289 ✓ +1 skip | **292 ✓ +1 skip** (+3 ModeContext) |
| `npm test` (core) | 336 ✓ | **336 ✓** |
| `npm run web:build` | ✓ 18 routes | **✓ 18 routes** |
| iOS simulator build | `BUILD SUCCEEDED` | **`BUILD SUCCEEDED`** |

Logs: `debug/overnight-*/{lint,test,web-build,ios-sim-build}-{before,final}.txt`.

## 7. Route / link / navigation audit

`debug/overnight-*/NAVIGATION_AUDIT.md` — **~120 interactive elements, 22
screens + TabBar.** All 20 navigation targets are registered routes (zero
dead navigations); **zero silent no-ops**; all 6 destructive actions
confirmed (delete account, remove coach, sign out, stop coaching, cancel
request); all 3 external URLs correct (own domain / support mailto). **One
issue found and fixed**: coach-dashboard header was a gear+"Settings" that
opened Profile → relabeled to a person icon + "Open profile" (`809e95c`).

## 8. iOS flow audit

`debug/overnight-*/IOS_FLOW_AUDIT.md` — **20 / 25 flows have automated
coverage**; none are broken. **Two flows have NO iOS UI** (documented, not
hidden): **Edit ski** and **Retire/unretire ski** — the service methods
(`updateSki`/`deleteSki`) exist + are tested, but there is no mobile screen to
invoke them (editing exists on web). Highest-risk-unproven-by-human: Wax Truck
(#22/#24/#25) and the coach messaging loop (#19–21) — logic tested, on-device
UX not.

## 9. Website / marketing status

`WEBSITE_STATUS.md`. Both live: web app
**https://nordicfleet-web.vercel.app** (13/13 routes 200), marketing
**https://marketing-black-eight.vercel.app** (7/7 routes 200). **Gaps (config,
not code):** marketing "Get started" CTA points to **`app.nordicfleet.com`**
(dead until DNS); app legal links point to **`nordicfleet.com`** (dead until
DNS); `NEXT_PUBLIC_FIREBASE_*` must be set in both Vercel projects (sign-in /
email-capture only work if so — needs a human live test). Domain plan + exact
Vercel/DNS steps are in `WEBSITE_STATUS.md`.

## 10. Firebase status

`debug/overnight-*/firebase-verify-readonly.txt`. CLI logged into
**nordicfleet-11e67** (current). `.firebaserc` + `firebase.json` correct;
`firestore.rules` **unchanged since its last live verification (`da38d13`)**.
Safe read-only probe: unauthenticated `/users` read → **HTTP 403** (rules
enforce auth). Live-write verify scripts (`verify-coach-pairing`,
`verify-wax-truck`, `verify-data-integrity`) **were NOT re-run** — rules are
unchanged and two of them create `.test` users without cleanup, so running
them would pollute the live beta DB. No rules deployed (none changed).

## 11. Is the app ready to reinstall on the phone?

**Yes — ready to reinstall, but the freeze is not *proven* fixed.** Signing is
configured + committed, keychain intact, gate green, simulator boot clean. The
clean reinstall is expected to resolve a stale-bundle freeze; if a real hang
remains, the `[NF_BOOT]` trace will pin it.

## 12. Exact phone reinstall steps

See `PHONE_INSTALL_NEXT_STEPS.md` (short, operator-focused). In brief: delete
app → `npm start -- --reset-cache` → clean build folder + DerivedData → Run
from Xcode → trust cert → **confirm `BUILD_TAG` in Settings** → if it still
freezes, report the **last `[NF_BOOT]` line**.

## 13. What still needs human verification

1. **Reinstall on the iPhone** and confirm boot (the freeze can't be
   reproduced in simulator).
2. If still frozen, **capture the `[NF_BOOT]` trace** + report the last line.
3. **Sign in on the live web URL** + **submit the marketing waitlist** once
   (confirms Vercel Firebase env).
4. **DNS / Vercel domains** for `nordicfleet.com` + `app.nordicfleet.com`.
5. Decide if **Edit/Retire ski** need iOS UI for the beta.
6. Optional: re-run live Firebase verify scripts (with cleanup) — only if you
   want fresh rule evidence; rules are unchanged.

## 14. What was intentionally NOT changed

- Firestore **rules** (unchanged → not redeployed).
- **Dependencies** (no upgrades). **App structure / navigation** (no rewrite).
- **No new features.** The Edit/Retire-ski gaps are documented, not built.
- **`CACHE_SIZE_UNLIMITED`** Firestore cache left as-is (see risks) — no
  evidence it caused the freeze, so not changed speculatively.
- The `project.pbxproj` signing change was **preserved + committed**, not
  reverted (it's correct and needed for device installs).

## 15. Remaining risks

- **Freeze root cause unproven** — no device logs of the actual event exist;
  resolution depends on the reinstall + a fresh on-device trace.
- **`CACHE_SIZE_UNLIMITED`** is a latent memory-growth risk over time on a
  data-heavy device (not implicated in any current Jetsam event). Bound it
  *only* if Instruments later shows the Firestore cache as a culprit.
- **Web/marketing depend on Vercel env + DNS** not verifiable from the repo.
- The `[NF_BOOT]` trace + `BUILD_TAG` are **temporary** dev-only aids — remove
  once the freeze is understood.
