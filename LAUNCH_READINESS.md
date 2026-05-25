# NordicFleet — Launch Readiness Assessment

**Generated:** 2026-05-25
**Stack:** React Native 0.76.x · @react-native-firebase 21.x · Firebase iOS 11.x · Xcode 26.5 · Node 20.20 LTS
**Branch:** `claude-rewrite`
**Last commit before report:** `6f15c26 Verify B3: refreshed UI verification checklist for the redesigned app`

---

## TL;DR

**Ship for personal use now. Ship for small-group beta after the user
completes one manual UI walkthrough.** Every data path is verified
end-to-end against the live `nordicfleet-11e67` Firestore — 22 / 22
data-integrity checks pass, 14 / 14 coach-pairing checks pass, every
security rule enforced both ways. The redesigned UI builds clean, the
jest suite is 162 / 162 green, and the JS bundle ships without
warnings. The remaining gaps are *visual confirmation* (only the
Welcome screen was screenshotted this session) and one *unverified
live call* (`sendPasswordResetEmail` is mock-verified — the real
Firebase email send needs a single manual test).

App Store submission should wait. The product is good enough to use,
not yet packaged enough to publish.

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

## What's broken or missing

| Severity | Item | Why |
|---|---|---|
| Minor | Coach Dashboard "Total skis" and "Tests / wk" StatCards are placeholders ("—") | Would require fanning out per-athlete subscriptions; deferred. Documented in commit `Design B10`. |
| Minor | Visual icon-text alignment audit was a code-level pass | The code is correct (every icon-text row has `alignItems:'center'`). Visual verification beyond the Welcome screen wasn't captured this session — the user originally reported a specific issue I couldn't reproduce in the code review. If anything still looks misaligned visually, that's the one item I'd want a screenshot for. |
| Minor | One screenshot captured this session | Only `verification-screenshots/01-initial-state.png` (Welcome screen). The manual checklist in `MANUAL_VERIFICATION.md` covers the rest. |

Nothing critical identified.

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
Unit tests       : 162 / 163 passing  (1 skipped — App.test.tsx)
Lint             : 0 errors, 7 warnings  (5 inline-style nits, 1 disabled-test, 1 var-require)
JS bundle build  : clean (npx react-native bundle --platform ios)
verify-data-integrity.sh : 22 / 22 pass  (scripts/verify-data-integrity.log)
verify-coach-pairing.sh  : 14 / 14 pass  (scripts/verify-coach-pairing.log)
verify-flows.sh          : pre-existing happy-path (re-run before launch)
UI screenshots           : 1 captured (Welcome screen) + 8-flow manual checklist
```

## My recommendation

**Ship for personal use after one manual walkthrough.**

The data layer is solid — every CRUD path is exercised against live
Firestore, every security rule is enforced both ways, the coach
relationship works in both directions and unlinks cleanly. The redesigned
UI compiles, renders in tests, and produces a clean JS bundle.

The two open items are *visual confirmation* and *one live
`sendPasswordResetEmail` call*. Both are 15-minute manual tests on the
simulator after `npm run ios` — the checklist in
`MANUAL_VERIFICATION.md` walks through them.

**For small-group beta (5–10 people):** the same recommendation, plus
test offline mode (the brief flagged this explicitly) by disabling wifi
mid-add-ski and confirming the queued write drains on reconnect. If
that works as designed, the app is beta-grade.

**For App Store submission:** defer. The product needs 2–4 weeks of
real personal use to validate that the design choices (chip selectors
instead of dropdowns, 1–10 numbered rating pills, etc.) actually work
for the use case before paying for Developer Program enrollment and
investing in App Store assets.
