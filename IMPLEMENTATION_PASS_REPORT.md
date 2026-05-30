# Implementation Pass Report (2026-05-30)

Build tag: **`2026-05-30 · implementation-pass-1`**
Branch: **`claude-rewrite`** (10 commits ahead of `origin/claude-rewrite`). NOT
merged to main.

A feature-implementation pass toward a pitchable private beta. The disciplined
through-line: **security-sensitive features are gated on a Firestore rules
test harness**, and that harness is blocked on the local toolchain, so every
rule-changing feature shipped only its pure-core, fully-tested half and left
the rules + collections deferred. Nothing untested touches Firestore rules.

## Gate results (all green)

| Check | Result |
| --- | --- |
| `@nordicfleet/core` tests | **394 passed** (28 suites) |
| `@nordicfleet/mobile` tests | **345 passed**, 1 skipped (58 suites) |
| `@nordicfleet/web` tests | none (jest `--passWithNoTests`) |
| Web build (`next build`) | **green** (18 routes) |
| iOS JS bundle (Metro, prod) | **green** (2.4 MB; validates new screens + nav + core) |
| Lint (all workspaces) | **0 errors** (5 pre-existing mobile warnings, none in touched files) |

Net new automated tests this pass: ~70 (core + mobile). Baseline at pass start
was core 341 / mobile 309+1skip.

iOS: no native/iOS code changed this pass (JS only), so a full `xcodebuild`
was not re-run; the production Metro bundle exercises the entire JS graph that
the changes touch. The user's local `NordicFleet.xcscheme` edit was left
untouched, as were signing, the keychain entitlement, and all native fixes.

## What shipped (per phase, with commits)

- **Phase 1 - Rules harness** (`b6383b0`): `firestore-tests/` emulator
  regression suite locking the CURRENT rules, plus `npm run test:rules`. It is
  **BLOCKED**: firebase-tools needs JDK 21, only JDK 11 is installed. Documented
  in `FIRESTORE_RULES_TESTING_PLAN.md`. This blocker is what gates Phases 6/7/9
  rule work.
- **Phase 2 - Unified messaging** (`2385d45`): one chronological list of sent +
  received messages, direction-tagged; unread dot only on received-unread; the
  sender now sees their own sent messages. `subscribeMessagesForUser` merges two
  Firestore queries client-side. Badge + mark-read were already correct.
- **Phase 3 - History screens** (`6a6495c`): WaxHistory + TestHistory across the
  whole fleet (live `subscribeAllWaxLogs` / `subscribeAllTestLogs`), reached by
  tapping the Last wax / Tests logged dashboard figures. The StatCard component
  stays a non-interactive figure (issue #1 lock preserved); the Pressable
  wrapper provides an honest, labelled button with a chevron.
- **Phase 4 - Edit logs** (`edee21e`): EditWaxLog + EditTestLog reuse the create
  forms (WaxEntryCard / TestEntryCard). `updateWaxLog` / `updateTestLog`
  preserve skiId + original date + createdAt and bump updatedAt. Coach
  read-only views keep log rows non-editable.
- **Phase 5 - Unit preferences** (`6a8b400`): weight kg/lb, height cm/in on the
  profile; stored metric, converted via a new tested `@nordicfleet/core`
  `bodyMetrics` module. Defaults kg/cm, so existing profiles are unchanged.
- **Phase 8 - Sticker foundation** (`193d3d4`): `stickerMetrics` (per-brand
  field/unit/flex-code descriptors) + `stickerRegistry` (brand-refiner registry
  + `parseSticker` + `overallConfidence`). Decodes Madshus/Rossignol hardness
  codes to a low-confidence flex. scanSki uses the new entry, backward-compatibly.
- **Phase 11 - Feedback + Phase 6 invite core** (`317757a`): a Settings Feedback
  section (Send beta feedback / Report a problem) opening a mail draft with
  build tag + platform, via core `buildFeedbackEmail`/`buildFeedbackMailto`;
  recipient centralized + env-overridable (`FEEDBACK_EMAIL`), no
  nordicfleet.com. Plus core `inviteOperations` (parseEmailList + invite link /
  email / mailto builders), no fake "sent".
- **Phase 7 - Coach permission core** (`0d8edfe`): view/comment/edit ladder
  (default view) + capability helpers + `fleetSuggestions` payload builder +
  sanitizer (scalars only) + applySuggestedChanges. No rules wiring.
- **Phase 12 + 9 - Docs** (`3710ab5`): `PITCH_DEMO_SCRIPT.md`,
  `NEXT_FEATURE_BACKLOG.md`, QA additions in `MANUAL_BETA_TEST_SCRIPT.md`, and
  status notes in the coach/sharing design docs.
- **Phase 10 - Web parity** (`5226596`): unit preferences on the web profile
  (reusing the same core helpers); web "Report a problem" links (profile +
  error boundary) centralized through `FEEDBACK_EMAIL`, removing the last
  hardcoded `support@nordicfleet.com` mailtos. Web build green.

## Deferred (and why) - see `NEXT_FEATURE_BACKLOG.md`

All blocked on the **rules harness (P0)**:
- Coach invite collection + rules + UI (core landed).
- Athlete-granted coach permissions + `fleetSuggestions` collection + rules +
  UI, and the `edit` tier (core landed).
- Public share pages (`publicShares` + rules + marketing routes).

Ready but out of scope this pass (no rules needed):
- Web parity for unified messaging + log-edit screens.
- Deeper per-brand sticker parsers; surfacing `overallConfidence` in scan UI.
- Editable log date; delete-a-log; real error sink (Sentry/Crashlytics).

## Safety posture / invariants preserved

- **No Firestore rules changed or deployed.** No new collections written.
- **No dependencies upgraded.** No new runtime deps added (clipboard avoided;
  mailto via Linking, share via existing react-native-share).
- **No tests skipped or deleted.** The `StatCard` non-interactive lock and the
  no-nordicfleet.com guard are enforced by tests.
- **No faked email send.** Invite + feedback only open drafts the user sends.
- **No em dashes** in new user-facing copy (guarded for invite/feedback text).
- Preserved: iOS signing, keychain entitlement, mode-switch crash fix, Wax
  Truck fix, legal URL defaults, security headers, privacy tone, build-tag
  scheme, and the user's Xcode scheme edit.

## Merge recommendation

Safe to keep on `claude-rewrite` and push. **Do not merge to main** yet: this
is a feature pass, not a release, and the security-sensitive features are
deliberately half-built (tested core, deferred rules). There are **no
security-risk partials** on the branch - nothing ships a rule or an
unauthenticated path. Before a main merge, unblock the rules harness (P0 in the
backlog: install JDK 21 or pin firebase-tools@13) so the deferred features can
land with their rules tested.
