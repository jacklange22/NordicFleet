# Security Audit

_NordicFleet, 2026-05-30. Honest snapshot, not a claim of perfection. Firebase
project nordicfleet-11e67. This audit reads the live `firestore.rules`, the
auth/role model, the web/marketing surfaces, and the mobile bundle, and lists
concrete findings plus what was hardened in this pass._

## Summary

The data model is reasonably tight: every user owns their data, coaches get
**read-only** access to linked athletes (not edit), messages are limited to
the two parties, and public marketing writes are shape-validated and
unreadable from the client. The main gaps are operational (no App Check / rate
limiting, coach profiles readable by any signed-in user, no automated rules
tests) rather than broken access control. No private athlete data is exposed
publicly today. Several safe web hardening wins were applied this pass;
Firestore rules were NOT changed (no emulator test harness exists, and the
rule is "do not deploy rules without tests").

## 1. Firestore rules (read from firestore.rules)

| Collection | Read | Write | Verdict |
|---|---|---|---|
| `users/{uid}` | owner; the athlete's linked coach; any signed-in user can read `role=='coach'` docs | owner only | OK, but coach profiles are broadly readable (finding 2) |
| `users/{uid}/skis,waxLogs,testLogs` | owner + linked coach | **owner only** | Good: coach is read-only by design |
| `users/{uid}/waxTests` | owner only | owner only | Good |
| `coachRequests` | either party | athlete creates `pending`; constrained state machine; **no client delete** | Good (audit-log style) |
| `messages` | from/to only | coach create only if currently linked; athlete may set `read`/`updatedAt` only; no delete | Good |
| `marketingSignups` | **none (client)** | anyone, strict shape (`email`,`source`,`role`,`createdAt` only) | Good, but unauthenticated + unrated (finding 5) |

**Coach edit access:** the rules already enforce coaches as **view-only** on
athlete skis/wax/test docs (`allow write: if isOwner(uid)`). This matches the
product goal ("do not give coaches full edit access by default"). A granular
per-coach view / comment / edit model is a future enhancement (see
`COACH_PERMISSIONS_DESIGN.md`); it would have to ADD a permission check, never
loosen the owner-only write.

## 2. Findings (ranked)

1. **No App Check.** Firestore is reachable by anyone with the public web API
   key (normal for Firebase), so abuse protection relies entirely on rules.
   **Recommend enabling Firebase App Check** (DeviceCheck/App Attest on iOS,
   reCAPTCHA on web) before wider launch. Medium priority.
2. **Coach profiles are readable by any authenticated user**
   (`resource.data.role == 'coach'`). This exposes a coach's profile fields
   (name, email, team) to every logged-in user, to support email lookup at
   signup. Lower-risk than it sounds (coaches are semi-public), but a tighter
   design would put only the minimum lookup fields in a separate
   `coachDirectory` doc. Medium priority.
3. **No rate limiting on `marketingSignups` (unauthenticated create).** A bot
   can spam the lead list. App Check + a Cloud Function/Firestore TTL cleanup,
   or a simple per-IP throttle at the edge, would help. Low/medium priority.
4. **No automated rules tests.** Rules are verified by live REST scripts
   (`scripts/verify-*.sh`) that create real `.test` users, not by an emulator
   unit suite. **Recommend adding `@firebase/rules-unit-testing` + the
   emulator** so rule changes can be tested before deploy. This is why rules
   were not changed in this pass. Medium priority.
5. **Account deletion completeness.** `deleteAccount` reauthenticates and
   deletes the user; verify it also removes subcollections (skis/waxLogs/
   testLogs/waxTests) and unlinks coachRequests/messages. The
   `verify-data-integrity.sh` delete section exercises this against live
   Firestore. Confirm no orphaned subcollection docs remain. Medium priority.
6. **`isCoachOf` does a `get()` per protected read.** Functionally correct;
   minor cost. Not a security issue.

## 3. Web / mobile surface

- **Mobile bundle:** contains only the **public** Firebase config
  (`GoogleService-Info.plist`) which is not a secret. No private keys, no
  service-account JSON in the app. PII logging: the `[NF_BOOT]` traces and
  `reportError` are `__DEV__`-only / PII-scrubbed (`scrubErrorForReport` in
  core). OK.
- **Web/marketing:** use `NEXT_PUBLIC_FIREBASE_*` (public by design). No
  server secrets in client code. Email signups validated by rules.
- **Public pages:** only the marketing site is unauthenticated; it reads
  nothing private (signups are write-only from the client). No public share
  pages exist yet (deferred, see `PUBLIC_SHARING_DESIGN.md`) so there is no
  unauthenticated read path into private collections.

## 4. Hardened this pass (safe wins)

- **Security headers** added to web + marketing (`next.config.mjs`):
  `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`,
  `X-Frame-Options: DENY` (clickjacking), `Referrer-Policy:
  strict-origin-when-cross-origin`, and a `Permissions-Policy` (marketing
  disables camera/mic/geolocation; the web app allows geolocation=self for
  test-log location capture).
- **Centralized public URLs** (no dead-domain links that could be
  hijacked/typosquatted later).
- **PII:** confirmed dev-only tracing + scrubbed error reports.

**Not done (deliberately):** no Content-Security-Policy yet. A correct CSP
must allow Firebase Auth/Firestore endpoints and Next's inline runtime; a
wrong one breaks sign-in. Tracked as a follow-up (start in report-only mode).

## 5. Recommended next steps (priority order)

1. Enable **Firebase App Check** (web + iOS).
2. Add **`@firebase/rules-unit-testing`** + emulator; port the `verify-*.sh`
   checks to rule unit tests; gate rule changes on them.
3. Tighten **coach profile exposure** (separate minimal `coachDirectory`).
4. Add a **report-only CSP**, then enforce once clean.
5. Add **abuse protection** for `marketingSignups` (App Check / TTL cleanup).
6. Confirm **account-deletion** removes every subcollection; add a test.
7. Consider **audit logging** (Cloud Logging) for coach reads of athlete data
   and admin access, and document who has Firebase console (admin) access.

## 6. Privacy-by-design posture

Minimize public data (only marketing signups are public, write-only). Coach
access is explicit (athlete adds coach) and read-only. Sharing, when built,
must expose only owner-selected fields via a dedicated `publicShares`
collection with strict rules (design in `PUBLIC_SHARING_DESIGN.md`). The
privacy policy language was updated to be accurate (aggregated/de-identified,
not "anonymous"; admin access acknowledged) rather than reassuring-but-false.
