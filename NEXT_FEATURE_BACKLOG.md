# NordicFleet — Next Feature Backlog

_Prioritized after the 2026-05-30 implementation pass. "Blocked" means a hard
prerequisite is unmet; "Ready" means it can be picked up now. Security-
sensitive items are explicitly tagged so they are not shipped without their
gate (the Firestore rules test harness)._

## P0 - Unblock the rules harness (gates everything security-sensitive)

- **Install JDK 21** (`brew install openjdk@21`) or pin `firebase-tools@13`
  locally, then run `npm run test:rules` green.
  - _Why first:_ the emulator rules harness exists (`firestore-tests/`) but
    fails today because firebase-tools needs JDK 21 and only JDK 11 is
    installed. Until this is green, no new Firestore rules may ship. See
    `FIRESTORE_RULES_TESTING_PLAN.md`.
  - Status: **Blocked** (toolchain).

## P1 - Coach invites (UI + rules) — security-sensitive

- Core already landed (`inviteOperations`: parse/link/email/mailto, no fake
  send). Remaining: `athleteInvites` collection + rules (emulator-test first),
  coach invite UI (paste emails, create links, **copy links / open email
  draft** — never "sent"), invite list + revoke. Redemption reuses the existing
  `coachRequests` flow. Design: `COACH_FEATURES_DESIGN.md` Part A.
  - Status: **Blocked on P0**. Optional later: automated send via an email
    provider + Cloud Function.

## P2 - Athlete-granted coach permissions + suggestions — security-sensitive

- Core already landed (`coachPermissions`: view/comment/edit ladder default
  view, `fleetSuggestions` payload + sanitizer + apply). Remaining:
  `fleetSuggestions` + `coachAccess` collections + rules (emulator-test first),
  athlete "Manage coach access" + Suggestions inbox (accept applies via the
  athlete's own write), coach "Suggest a change". Ship `view`+`comment` first;
  the `edit` tier (coach direct write) is last and behind an explicit grant.
  Design: `COACH_FEATURES_DESIGN.md` Part B.
  - Status: **Blocked on P0**.

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
