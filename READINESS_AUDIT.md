# NordicFleet — Readiness Audit

Generated: 2026-05-28
Auditor: autonomous session

## Verdict

**Ready for a small private beta. Not ready for public launch.**

The engineering foundation is genuinely solid — real auth, a real
database with security rules, a shared business-logic core with 527
passing tests, two working clients (iOS + web), and a clean
deployment pipeline. What's missing is the entire "putting software
in front of strangers" layer: no human has ever completed a real
session, there's no privacy policy or terms, no crash/error
reporting, and the app isn't on the App Store. That's not a
criticism — it's the normal state of a pre-launch app that's been
built but not yet *used*. The honest next step is to get it into the
hands of 3-5 real skiers, not to keep building.

## What I verified this session

| Method | What it covered | Confidence |
|--------|-----------------|------------|
| Jest (core) — `npm test --workspace=packages/core` | 276 tests: parsers, validators, payload builders, capability model, wax dictionary | High — pure logic, deterministic |
| Jest (mobile) — `npm test --workspace=apps/mobile` | 251 tests: services against a Firestore mock, screen rendering, ModeContext, TabBar, coach cascade | Medium — mocks, not live Firestore |
| `npm run web:build` | All 19 web routes compile + type-check + prerender | High for "it builds", zero for "it works" |
| `xcodebuild` (iOS simulator) | The RN app + native NFOCR pod compile and link | High for "it compiles", zero for "it runs correctly" |
| `vercel --prod` | Web deploys + serves at nordicfleet-web.vercel.app | High for "it's live" |
| Code review | Read every file I touched | Medium |

**Not verified — needs a human:** every actual end-to-end user flow.
See "What's untested by any human" below.

## Feature inventory

| Feature | Status | Platform |
|---------|--------|----------|
| Email/password auth (sign up, sign in, sign out) | Works (code+deploy verified) | both |
| Forgot password | Works | both |
| Personal fleet — view skis | Works | both |
| Add ski | Works | both |
| Edit ski | Works | both |
| Retire / unretire ski | Works | both |
| Spreadsheet import (paste → preview → save) | Works, real-data fixture tested | web |
| Log a wax (binder/kick/glide, wax dictionary) | Works (code-level) | both |
| Log a test (conditions + ratings) | Works (code-level) | both |
| Edit profile (weight/height/team/location) | Works | both |
| Coach acceptance (request → approve/decline) | Works (code+mock tested) | both |
| Coach views athlete fleet | Works | both |
| Coach views athlete ski detail | Works (fixed this session) | both |
| Compose message (coach → athlete, ski attach) | Works | both |
| Read messages (athlete inbox + detail) | Works | both |
| Race-day advisory — compose | Works | iOS only |
| Race-day advisory — read (structured render) | Works | both |
| Personal / Coaching mode toggle | Works (this session, code+test) | both |
| Become / stop coaching (with athlete cascade) | Works (code+mock tested) | both |
| Ski-sticker OCR scan | Partial — compiles, never field-tested | iOS only |
| Share ski / share fleet | Works | iOS only |
| Delete account (App Store 5.1.1(v)) | Works | iOS only |
| Change password | Works | iOS only |
| Location tagging on test logs | Manual label only; no geolocation | iOS (label), web (label→notes) |

"Works" here means: builds, has passing tests and/or was exercised in
code review, and has no known bug. It does **not** mean a human
confirmed it behaves correctly in the real app. Read the next two
sections before trusting any "Works".

## What's genuinely solid

- **The data layer.** `packages/core` is platform-free business logic
  (validation, payload shaping, parsers, the capability model) with
  276 deterministic tests. Both clients import the same builders, so
  an iOS-written ski and a web-written ski are byte-identical in
  Firestore. This is the strongest part of the codebase.
- **Auth.** Real Firebase Authentication, wired on both platforms,
  verified working on the deployed web app in a prior session
  (sign-in reaches /home; password reset sends a real email).
- **Firestore security rules.** Coach/athlete read boundaries are
  enforced by rules, not just the UI — a coach can only read an
  athlete's data via the linked-coach rule.
- **The spreadsheet importer.** Tested against a real, messy user
  paste (33 rows, section headers, missing columns) → 30/30 rows
  parse. This is the one feature with verification against actual
  user data.
- **Test discipline.** 527 tests total, written alongside the code,
  all green. Build pipeline (lint/test/web build/iOS build) is clean.

## What's untested by any human

This is the big one. **No person who isn't the developer has used
this app.** Specifically:

- No human has completed a full add-ski → log-wax → log-test flow on
  a real device and confirmed the data looks right afterward.
- No coach has used coaching mode in real conditions — toggled to
  coaching, approved a real athlete, browsed their fleet, sent a real
  message, and had the athlete receive it.
- The OCR sticker scan has **never been pointed at a real ski
  sticker by a human.** It compiles and the parser has unit tests
  against synthesized text, but nobody has stood in a wax room and
  scanned their actual skis. Real-world accuracy is unknown — could
  be 80%, could be 40%.
- No athlete has pasted their own spreadsheet (other than the one
  fixture) and judged whether the import "got it right."
- Nobody has used the app over multiple sessions to see whether the
  mode toggle, the unread badges, and the persistence actually feel
  right in daily use.
- The web app has been verified to *build and deploy*, but the
  multi-user coach/athlete flow has not been driven end-to-end
  through two real browser sessions by a human this session.

## Known bugs and rough edges

| Item | Severity | Notes |
|------|----------|-------|
| OCR accuracy unmeasured | Medium | Could disappoint users who expect it to "just work." Set expectations or hide it until field-tested. |
| Wax-log form gets tall with 3+ skis selected | Low | No collapsing; cramped on small screens. |
| Test-log location is a text label folded into notes | Low | No browser/native geolocation yet; documented intentional deferral. |
| Coaching-mode iOS tabs are Athletes + Profile only | Low | Pending requests live inside the dashboard, not a separate tab (NOTES.md). Intentional, but less than the full spec. |
| Migration is migrate-on-read | Low | A user who never logs in again keeps a doc without `isCoach`. Harmless (readers fall back to `role`), but the field never backfills for dormant accounts. |
| No optimistic UI / offline affordances on web | Low | Web relies on live Firestore; flaky connections show stale/empty states. |
| Message inbox is one-way (coach→athlete) | By design | Athletes can't reply. Fine for now; note it's not a chat. |

## Critical gaps for launch

### Legal / compliance
- **Privacy policy: MISSING.** Required by Apple, Google, GDPR, CCPA.
  The app collects email + personal stats (weight/height) — a privacy
  policy is non-negotiable for any public release.
- **Terms of service: MISSING.**
- **Account deletion: EXISTS on iOS** (Profile → Danger zone, App
  Store 5.1.1(v) compliant). **Missing on web** — acceptable since
  web isn't shipping to an app store, but worth adding for GDPR
  "right to erasure."
- **GDPR/CCPA data export: MISSING.** No "download my data" path.
- **Apple privacy nutrition labels: NOT PREPARED.** Needed before App
  Store submission.

### Infrastructure
- **Apple Developer Program ($99/yr): unknown / likely not enrolled.**
  Required to ship to TestFlight or the App Store. Blocker for any
  iOS distribution beyond a locally-built simulator/device install.
- **Crash reporting: NONE.** No Crashlytics / Sentry. A crash in the
  field is invisible to the developer.
- **Analytics: effectively none.** `@react-native-firebase/analytics`
  is installed but there's no event instrumentation — you can't tell
  what features get used.
- **Error monitoring: NONE.** No Sentry or equivalent on web or iOS.
  Errors are swallowed or logged to a console nobody watches.
- **Firestore backup / disaster recovery: NOT CONFIGURED.** No
  scheduled exports. A bad write or rules mistake could lose data
  with no restore path.
- **Rate limiting / abuse protection: NONE** beyond Firebase defaults.

### Product
- **Onboarding: MINIMAL.** New users get the "do you coach a team?"
  question, then land in an empty fleet. No guided first-ski, no
  explanation of wax/test logging, no sample data.
- **Empty states: PRESENT but basic.** Most lists have a "nothing
  here yet" card; few guide the user to the next action.
- **Has anyone who isn't the developer used it: NO.** This is the
  single most important gap.

## Honest recommendation

**Stop building features. Get 5 real users.**

You have far more app than you have validation. The codebase is in
good shape — well-tested, cleanly structured, deployed. But every
"Works" in the inventory above is a hypothesis until a real skier
proves it. The highest-value thing you can do next is *not* another
feature; it's:

1. Install the iOS build on your own phone (and 2-3 teammates' phones
   via TestFlight or a direct device build) and actually use it for a
   week — log your real waxes, scan your real stickers, track your
   real fleet.
2. Watch where it breaks, feels slow, or confuses. That list will be
   more valuable than anything in the backlog.
3. Only then decide what to build next.

The OCR especially needs this: it's the flashiest feature and the
most likely to disappoint, because nobody has measured how it does on
real stickers in real light. Either field-test it hard or set
expectations honestly in the UI.

If you want a public launch, the legal + infra checklist below is
real work (days, not hours) and none of it is started.

## If pursuing launch, the ordered checklist

Rough estimates assume focused solo work.

1. **Get real users first (1-2 weeks, mostly waiting).** TestFlight
   build to 3-5 skiers; collect feedback. This reorders everything
   below.
2. **Write a privacy policy + terms of service (1 day).** Use a
   generator (Termly, iubenda) as a starting point; the app's data
   collection is simple. Host them as web pages, link from both apps.
3. **Enroll in the Apple Developer Program (1 hour + ~2 day approval +
   $99).** Prerequisite for TestFlight and the App Store.
4. **Add crash + error reporting (1 day).** Sentry on web + iOS, or
   Firebase Crashlytics on iOS. Without this you're flying blind in
   production.
5. **Instrument basic analytics (half day).** Log the key events
   (signup, add ski, log wax, log test, OCR scan, send message) so
   you can see what's actually used.
6. **Field-test + tune OCR (2-3 days).** Scan 50+ real stickers,
   measure accuracy, adjust the parser or the UI's confidence
   messaging. Decide whether it's launch-quality.
7. **Onboarding pass (2-3 days).** First-run guidance, maybe optional
   sample data, clearer empty states pointing to the next action.
8. **Privacy nutrition labels + App Store assets (1-2 days).**
   Screenshots, description, keywords, the data-collection
   questionnaire.
9. **Firestore backup automation (half day).** Scheduled exports to a
   GCS bucket.
10. **Account deletion + data export on web (1 day).** GDPR
    completeness.
11. **Accessibility + small-screen polish pass (1-2 days).** The tall
    wax form, contrast, dynamic type, screen-reader labels.
12. **App Store review submission + iteration (1-2 weeks including
    rejections).** First submissions usually bounce; budget for it.

Realistic calendar time from today to a credible public launch:
**4-8 weeks** of part-time work, gated mostly on real-user feedback
and App Store review, not on writing code.
