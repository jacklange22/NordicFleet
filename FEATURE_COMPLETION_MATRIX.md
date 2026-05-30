# Feature Completion Matrix

_2026-05-30, completion pass. Status of each feature against "pitchable private
beta". Legend: **Shipped** (in app, tested), **Shipped\*** (in app + tested but
needs a deploy step to function in prod), **Core only** (tested logic, no UI/
rules), **Design** (doc only), **Deferred** (next pass)._

| Area | Status | Notes |
| --- | --- | --- |
| Bottom-nav consistency | **Shipped** | One policy (`navTabs.js`); bar on all browse/detail/edit screens, hidden on auth/scanner/heavy-create. Edit screens guard unsaved changes. |
| Edit ski | **Shipped** | Pre-fills, preserves createdAt, bumps updatedAt (set-merge), returns to detail. |
| Edit wax log | **Shipped** | Reuses create form; preserves skiId/date/createdAt, bumps updatedAt; unsaved guard. |
| Edit test log | **Shipped** | Same; preserves location too. |
| Edit security boundary | **Shipped** | Emulator rules tests: owner can update, coach cannot, unrelated denied. |
| Wax / Test history | **Shipped** | Full-fleet lists, live, reached from dashboard figures, row -> edit. |
| Unified messaging | **Shipped** | Sent + received, direction-tagged, unread = received-only. |
| Unit preferences (kg/lb, cm/in) | **Shipped** | Stored metric, converted via core; on mobile + web profile. |
| Sticker scanning foundation | **Shipped** | Brand registry + stickerMetrics + parseSticker (Madshus/Rossignol code decode) wired into scan. Deeper per-brand parsing **Deferred**. |
| Beta feedback + debug info | **Shipped** | Settings: Send feedback / Report a problem (mail draft, build+platform) + Copy debug info (PII-free). No fake send; no nordicfleet.com. |
| Coach athlete invites | **Shipped\*** | Coach UI (paste -> create links -> copy/email-draft/revoke). `athleteInvites` rules tested 18/18. **Needs `firebase deploy --only firestore:rules`** to work in prod. Athlete redemption via existing coach-request-by-email (no token lookup, no enumeration). |
| Rules test harness | **Shipped** | `npm run test:rules` green (auto-resolves keg-only JDK 21). 18 tests. |
| Coach permission model | **Core only** | view/comment/edit ladder + suggestion builder/sanitizer tested in core. UI + `fleetSuggestions`/`coachAccess` rules **Deferred**. |
| Public sharing | **Design** | `PUBLIC_SHARING_DESIGN.md`. Needs `publicShares` rules + sanitizer + marketing routes. **Deferred**. |
| Web parity | **Partial** | Unit prefs + feedback on web shipped. Unified messaging + log-edit + invite UI on web **Deferred** (`NEXT_FEATURE_BACKLOG.md`). |
| Observability (real sink) | **Deferred** | `errorReport` shaping exists; wiring Sentry/Crashlytics deferred. |

## What changed this (completion) pass

- Rules harness unblocked (JDK 21 auto-resolved); `npm run test:rules` green.
- Bottom-nav made consistent (one policy + audit doc) with edit-screen unsaved
  guards.
- Edit boundary locked with emulator update-rule tests.
- Coach invites shipped end-to-end in the app (rules tested; deploy pending).
- Copy-debug-info added for beta reporting.

## The one deploy step

The `athleteInvites` rules are tested but **not deployed**. Until
`firebase deploy --only firestore:rules` runs against the live project, the
invite-create writes are denied by default (safe-closed, not a leak). See the
completion report for the exact command and safety note.

## Top deferred (see NEXT_FEATURE_BACKLOG.md)

1. Deploy the invite rules; add athlete-side invite redemption + web invite UI.
2. Coach permissions + `fleetSuggestions` UI/rules (core landed).
3. Public sharing (rules + sanitizer + marketing routes).
4. Web parity: unified messaging + log-edit screens.
5. Deeper per-brand sticker parsing; real error sink.
