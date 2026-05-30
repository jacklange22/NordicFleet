# NordicFleet — Next Feature Backlog

_Prioritized after the 2026-05-30 implementation pass. "Blocked" means a hard
prerequisite is unmet; "Ready" means it can be picked up now. Security-
sensitive items are explicitly tagged so they are not shipped without their
gate (the Firestore rules test harness)._

## P0 - Rules harness (RESOLVED 2026-05-30 completion pass)

- `npm run test:rules` is green (18 tests). JDK 21 (`brew openjdk@21`) is
  installed but keg-only; the `test:rules` script now prepends its bin to PATH
  automatically. See `FIRESTORE_RULES_TESTING_PLAN.md`.
  - Status: **Done.** Rule-gated features may ship with emulator tests.

## P1 - Coach invites — mostly SHIPPED, one deploy step left

- Shipped this pass: core (`makeInviteToken`/`buildInvitePayload`/parse/link/
  email/mailto), `athleteInvites` rules (coach-private, no enumeration; tested
  18/18), mobile `inviteService`, and the Invite athletes coach UI (paste ->
  create links -> copy / email draft / revoke, no fake "sent").
  - **Remaining (do first):** run `firebase deploy --only firestore:rules` so
    the invite writes work in prod (tested, additive, safe-closed until then).
  - **Then:** athlete-side redemption (signup `?invite=` -> "Connect with
    coach" prefill, via the existing coach-request-by-email flow) and a web
    invite UI. Optional later: automated send via an email provider + Cloud
    Function. Design: `COACH_FEATURES_DESIGN.md` Part A.

## P1b - Athlete invite ACCEPTANCE flow — security-sensitive

- Coach invite side shipped. Remaining: web `/signup?invite=TOKEN` handling,
  an accept screen that shows who invited them + the polished copy, and a
  SECURE redemption rule: make the `athleteInvites` doc id == the token and
  allow a single-doc `get` (authed) with NO `list` for non-owners (so tokens
  cannot be enumerated), then create the coach link + set permission on accept.
  - Status: **Ready** (rules harness green; deploy the invite rules too).

## P2 - Coach permissions + suggestions — SHIPPED (deploy pending)

- Permissions: athlete-set view/comment on Profile (default view), rides the
  existing user-doc rules (no rule change). **Shipped + rules-tested.**
- Suggestions: coach "Suggest a change" -> athlete inbox -> accept/reject;
  `fleetSuggestions` rules tested. **Shipped**, but writes need
  `firebase deploy --only firestore:rules`.
- Remaining: deploy the rules; add wax/test suggestion entry points (only ski
  has a coach "Suggest" button today; the inbox already handles all types); the
  `edit` tier (coach direct write) behind an explicit grant + a coach-write
  rule. Design: `COACH_FEATURES_DESIGN.md` Part B.

## P3 - Public share pages — security-sensitive

- `publicShares` collection with public unauthenticated read of active,
  unexpired shares; owner-only writes; denormalized snapshot of only the
  owner-selected fields (no email/uid/history). Core builder + sanitizer +
  expiry math land in the SAME pass as the rules. Marketing `/share/*` routes
  already planned. Design: `PUBLIC_SHARING_DESIGN.md`.
  - Status: **Blocked on P0**.

## P4 - Web parity (Next.js app) — Ready

- Bring the new mobile features to `apps/web` where the screen already exists:
  - Body-metric **unit preferences** on the web profile, reusing the shared
    `@nordicfleet/core` `bodyMetrics` helpers (already cross-platform).
  - **Unified sent + received** messaging view + a feedback entry point.
  - Wax/Test **history** + **edit log** screens.
  - See the implementation-pass report for the assessed gap list.
  - Status: **Ready** (no rules needed for these).

## P5 - Sticker scanning, deeper — Ready

- Expand the brand-parser registry beyond Madshus/Rossignol (Fischer/Salomon/
  Atomic/One Way/Peltonen/Yoko length-dash-flex and build-word specifics).
- Surface `overallConfidence` and the per-brand `stickerMetrics` hints in the
  scan review UI. Foundation landed in `@nordicfleet/core`
  (`stickerMetrics` + `stickerRegistry` + `parseSticker`).
  - Status: **Ready**.

## P6 - Observability, for real — Ready

- The beta feedback entry point opens a mail draft today (build tag + platform
  embedded). Next: a configured `FEEDBACK_EMAIL` (or a feedback collection +
  rules), and wire `@nordicfleet/core` `errorReport` shaping to a real sink
  (Sentry/Crashlytics) behind the existing PII allow-list.
  - Status: **Ready** (email/Sentry); collection variant blocked on P0.

## P7 - Wax/Test log nice-to-haves — Ready

- Editable log **date** in the edit screens (currently preserved, not editable).
- Delete a wax/test log (owner-only; trivial rules-wise, already owner-write).
- Pull-to-refresh / pagination on the full-history screens for very long lists.
  - Status: **Ready**.

## Notes

- Everything tagged security-sensitive shares one gate: **P0**. Do not ship any
  of P1 to P3 until `npm run test:rules` is green and the specific collection's
  rules tests pass. This ordering is the whole reason the core layers were
  landed first and the rules deferred.
