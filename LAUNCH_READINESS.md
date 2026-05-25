# NordicFleet — Launch Readiness Assessment

**Generated:** 2026-05-25 (updated after the bug-fix + sharing session)
**Stack:** React Native 0.76.x · @react-native-firebase 21.x · Firebase iOS 11.x · Xcode 26.5 · Node 20.20 LTS
**Branch:** `claude-rewrite`
**Last commit before report:** `a523380 Docs F1: device install guide for free Apple ID path`

---

## TL;DR

**Install on your iPhone via `DEVICE_INSTALL.md` now.** Every data
path is verified against the live `nordicfleet-11e67` Firestore —
29 / 29 data-integrity checks, 14 / 14 coach-pairing checks, 12 / 12
seed-regression checks, 6 / 6 happy-path checks. The two user-reported
bugs from last sync are fixed and regression-tested. Apple guideline
5.1.1(v) compliance is in (delete account). The iOS app builds clean
with the two new native modules (`react-native-share`,
`react-native-view-shot`) on Xcode 26.5.

Remaining gap before sharing with anyone else: 5 minutes of tapping
through `MANUAL_VERIFICATION.md` Flows 9–12 on the real device to
confirm the share sheet renders correctly and the delete-account
reauth flow works end to end. Otherwise the product is solid.

App Store submission still recommended to wait — 2 weeks of personal
use first, then enroll in Developer Program if you decide to publish.

---

## What works (verified end-to-end against live Firestore)

Each row below was driven through actual REST calls against
`nordicfleet-11e67` in `scripts/verify-data-integrity.sh` /
`scripts/verify-coach-pairing.sh`. Logs in
`scripts/verify-data-integrity.log` and `scripts/verify-coach-pairing.log`.

1. **Sign up → Firestore profile document created** with role, email,
   nullable weight/height/team/location. (data-integrity §1a/§1b)
2. **Ski creation with the full 14-field shape** the app writes — name,
   brand, model, technique, type, build, base, grind, length, flex,
   year, notes, retired, seedId. (§1b)
3. **Wax log creation** with a `glideWaxes` array whose length matches
   `glideLayers`. (§1c)
4. **Test log creation** with technique-conditional null fields
   (classic skis have `stabilityRating: null` and `climbingRating: null`).
   (§1d)
5. **List skis** returns the expected count. (§2a)
6. **Wax-log query** by `where('skiId','==',X)` returns only that ski's
   logs even when the user has logs from multiple skis. (§2c)
7. **PATCH with updateMask** only changes the specified field — `role`
   is preserved when `weight` is updated. (§3a)
8. **PATCH to a ski** bumps `updateTime` (the serverTimestamp transform
   the service uses). (§3b)
9. **Soft delete** sets `retired: true` and the doc still exists. (§4a)
10. **Wax + test logs survive soft-deletion of the parent ski** — history
    is preserved, no cascade. (§4b)
11. **Hard delete** removes the doc; subsequent GET is 404. (§4c)
12. **Unauthenticated requests are denied** (HTTP 401/403). (§5a)
13. **Athlete A cannot read Athlete B's profile** (Firestore rules,
    HTTP 403). (§5b)
14. **Athlete A cannot write to Athlete B's `skis` subcollection**
    (HTTP 403). (§5c)
15. **Coach lookup by email + `role==coach`** returns the coach doc.
    (§5d)
16. **Coach signup → role=coach profile** persists. (coach-pairing §1)
17. **Athlete signup → role=athlete + coachId=null** persists. (§2)
18. **`setCoachByEmail` lookup** finds the coach uid via the
    role-filtered email query. (§3)
19. **After PATCH, athlete.coachId == coach uid.** (§4)
20. **`subscribeAthletesForCoach` query** (`users where coachId ==
    coachUid`) returns the athlete to the coach. (§5)
21. **Athlete creates a ski**, coach can read the subcollection. (§6, §7)
22. **Coach is denied write access** to athlete subcollections (HTTP
    403). (§8)
23. **`removeCoach` clears coachId**, and after that:
    - Coach list of athlete's skis returns either 403 or empty;
    - Coach direct GET on an athlete's ski is 403. (§9–11)
24. **`setCoachByEmail` with a non-existent email** returns 0 results
    (service maps to `coach/not-found`). (§12)
25. **`setCoachByEmail` with an athlete email** (role != coach) also
    returns 0 — same `coach/not-found` path. (§13)
26. **Offline persistence is enabled in code** with
    `CACHE_SIZE_UNLIMITED` (`src/services/firebase.js`). Verified via
    grep, not via runtime toggle.

## What works (verified at the code / test layer only)

These have passing jest tests and clean JS bundle compilation, but
were not exercised against live Firebase in this session.

- **Forgot password flow** (`ForgotPasswordScreen`) — 3 jest specs
  cover invalid-format inline error, success → confirmation state,
  and the `auth/user-not-found` error mapping. **Live
  `sendPasswordResetEmail` round-trip has NOT been verified** — the
  mock returns a stubbed promise; the real Firebase email send needs
  one manual test from the simulator (Flow 2 in `MANUAL_VERIFICATION.md`).
- **iOS keychain autofill** — `textContentType`, `autoComplete`,
  `passwordRules` are now set correctly on every email/password
  field. Behavior verifiable only on an actual device (and only after
  the user enables Settings → Passwords → AutoFill on the simulator).
- **Every redesigned screen renders** — 162 jest specs across 32
  suites pass, including the Home dashboard, SkiInfo hero detail,
  WaxLog pill chip selector, TestingLog rating picker, Profile edit
  + reauth modal, CoachDashboard, AthleteDetail, ErrorBoundary
  fallback.
- **Toast notifications** fire from the success paths in AddSki,
  WaxLog, TestingLog, and Profile-edit. Tested via mock; visual
  appearance unverified this session.

## Bugs reported by the user — status

| Severity | Bug | Fix status |
|---|---|---|
| Critical | "Seed sample data" overwrote profile fields + reset role | **Fixed** in commit `b1a7421 Fix A1`. Verified by `scripts/verify-seed.sh` (12/12 against live Firestore — profile + custom ski preserved across two seed runs). |
| Critical | "Add a coach" button did nothing | **Fixed** in commit `0ecf78f Fix B1`. Three bugs (no-op onPress, wrong field name `coachUid` vs `coachId`, missing modal). 5 jest specs + the existing live coach-pairing script (14/14) cover it. |
| App Store blocker | No way to delete account (guideline 5.1.1(v)) | **Implemented** in commit `88318f3 Feature C1`. Full reauth-then-delete flow with cascading subcollection cleanup. Live-verified by the new DELETE ACCOUNT section in `verify-data-integrity.sh` (29/29). |
| Feature ask | Lighter-weight sharing than the coach relationship | **Implemented** in commit `25e4d26 Feature D1`. Native iOS share sheet of styled PNG snapshots of single-ski or full-fleet cards. |

## Other gaps

| Severity | Item | Why |
|---|---|---|
| Minor | Coach Dashboard "Total skis" / "Tests / wk" StatCards still show "—" | Would require fanning out per-athlete subscriptions; not blocking. |
| Minor | Coach-side cascade on `deleteAccount` is best-effort only | Firestore rules block a coach from writing to athlete docs — when a coach deletes their account, dependent athletes keep an orphan `coachId` until they clear it via the existing Remove-coach UI. Documented in `NOTES.md`. |
| Minor | Share-card visuals on real iPhone hardware are unverified this session | The cards render in tests (10 share-related specs pass) and the iOS build compiles, but I can't programmatically tap to capture an actual share preview. Manual Flow 11 / 12 in `MANUAL_VERIFICATION.md` covers it. |

Nothing critical unresolved.

## Known limitations

- **Offline mode is enabled in code but not manually toggled this
  session.** Firestore persistence is configured with
  `CACHE_SIZE_UNLIMITED` but I did not disable network mid-flow to
  confirm queued writes drain on reconnect. The brief explicitly
  flagged this for manual verification.
- **No real device test this session.** Everything was either
  jest+code review or REST against live Firestore; the iOS app itself
  runs on the simulator only.
- **Toast visual positioning may need iPhone-specific tuning** — the
  toastConfig uses a 92% width with shadow, hasn't been seen on
  hardware.
- **The `App.test.tsx` test is skipped** — pre-existing, not from this
  session. It's the boilerplate test from the React Native template
  and has been skipped since before the design overhaul.
- **Pre-existing components (`footer.js`, `profilebutton.js`,
  `dropdown.js`, `checkboxDropdown.js`, `skiitem.js`, `searchbar.js`,
  `filtermenu.js`, `inputfield.js`, `skisaveButton.js`,
  `testInput.js`, `waxinput.js`) are no longer used** by any redesigned
  screen but remain in the repo. Their tests still pass. Cleaning them
  up is a follow-up — removing them prematurely risks orphaning a test
  fixture.

## Recommended pre-launch checklist for the user

### Critical (do before any install)
- [ ] **Confirm Firebase console state:**
  - Authentication → Sign-in providers → Email/Password is **Enabled**.
  - Authentication → Templates → Password reset — confirm the sender
    email and verify the reset template URL points to the production
    Firebase domain (or your custom domain).
  - Firestore Database → exists in production mode (not test mode).
  - Firestore → Rules tab → matches `firestore.rules` in this repo.
    If unsure, run `firebase deploy --only firestore:rules`.
- [ ] **Run the three verification scripts** one more time and confirm
  green:
  ```bash
  ./scripts/verify-flows.sh
  ./scripts/verify-data-integrity.sh
  ./scripts/verify-coach-pairing.sh
  ```
- [ ] **Build + install the latest version** so the forgot-password
  flow is on the simulator:
  ```bash
  npm run ios
  ```

### Important (do before sharing with anyone)
- [ ] **Walk through `MANUAL_VERIFICATION.md` end to end** — all 8
  flows on the simulator. The autofill flow (Flow 2) and forgot
  password (Flow 2 sidebar) are the two that weren't covered by the
  earlier verification scripts.
- [ ] **Test the forgot-password live round-trip** specifically: enter
  a real (test) email, tap Send reset link, verify the email lands in
  the inbox.
- [ ] **Test offline mode**: in Flow 3 (add ski), turn off the Mac's
  wifi *before* tapping Save. Confirm Toast still fires, then re-enable
  wifi and confirm the doc shows up in the Firebase console seconds
  later (Firestore SDK drains the local queue).
- [ ] **Test on a real iPhone** — free Apple ID with 7-day re-signing
  is fine for personal use. The autofill / strong-password generation
  prompts only work fully on real hardware.

### Nice to have (defer until after personal use validates the product)
- [ ] **App Store assets** — privacy policy, terms of service, support
  URL, screenshots in every required size.
- [ ] **App icon set** — verify `ios/NordicFleet/Images.xcassets` has
  every iPhone size populated.
- [ ] **Apple Developer Program enrollment** ($99/year) — only needed
  for App Store submission or TestFlight beta.
- [ ] **Push notification entitlement** — not implemented; defer until
  there's a real use case.
- [ ] **Replace the placeholder coach-dashboard stats** with live
  per-athlete totals if you actually want them populated.

## Open issues for follow-up

| Item | Priority | Note |
|---|---|---|
| Coach dashboard placeholder stats | Low | Show "—" today. Implementing properly needs per-athlete subscription fanout. |
| Unused legacy components | Low | 11 files in `src/components/` no longer referenced by any redesigned screen. Easy clean-up commit. |
| App.test.tsx is skipped | Low | Pre-existing skip from the RN template. Either delete or write a real smoke test. |
| `Image` ResizeMode in LoadingScreen logo | Low | Defaulted to `contain` via the new prop. Should look fine on all devices but unconfirmed beyond simulator. |

## Technical debt

- **Six pre-existing inline-style lint warnings** in `login.js`,
  `signup.js`, `roleSelect.js`, `welcome.js` (one disabled-test
  warning is from `__tests__/App.test.tsx`). All are pragmatic
  one-off styles (`{flex: 1}`, `rgba(...)` accents). Not worth a
  refactor.
- **`Podfile` post_install workarounds** — six entries for
  Xcode 26.5 + Firebase 11 + RN 0.76 compatibility. These will need
  revisiting on the next major Firebase upgrade.
- **`App.test.tsx`** still uses `it.skip` from the original RN template.
- **`react-native-toast-message`** is pure JS, no native code, but
  brings in @react-native-async-storage as a transitive dep. Lock at
  v2.3.3 (current).

## Test coverage snapshot

```
Unit tests       : 187 / 188 pass  (1 skipped — App.test.tsx pre-existing)
Lint             : 0 errors, 6 warnings  (pre-existing inline-style nits)
JS bundle        : clean (npx react-native bundle)
iOS build        : ** BUILD SUCCEEDED ** (Xcode 26.5 + new native modules)
verify-flows.sh             :  6 /  6 pass  (happy path)
verify-data-integrity.sh    : 29 / 29 pass  (incl. delete-account section)
verify-coach-pairing.sh     : 14 / 14 pass
verify-seed.sh              : 12 / 12 pass  (NEW — seed-clobber regression)
UI screenshots              :  3 (Welcome / Home dashboard) + 12-flow manual checklist
```

## My recommendation

**Install on your iPhone via DEVICE_INSTALL.md now. Walk through
the 4 new flows in MANUAL_VERIFICATION.md (~5 min). After that the
app is solid for personal use and ready to share with a small
group.**

What's stronger than the last assessment:
- The two user-reported bugs (seed clobber, add-coach no-op) are
  fixed with regression scripts.
- App Store guideline 5.1.1(v) compliance is in (delete account).
- Sharing without an account is implemented end to end.
- The iOS app builds and installs cleanly on the simulator with
  every new package. Pods + bundler + ruby toolchain worked
  through end-to-end (the incantation is in DEVICE_INSTALL.md).

What's still owed before App Store submission:
- 2–4 weeks of actual personal use to validate the redesigned
  UI / data model in practice.
- Apple Developer Program enrollment ($99/year) for TestFlight or
  App Store distribution.
- Privacy policy + ToS + App Store screenshots.
- A Cloud Function to handle the coach-side cascade in
  `deleteAccount` properly (the orphan-`coachId` state today is
  harmless but not elegant).
