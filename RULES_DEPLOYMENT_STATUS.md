# Firestore Rules Deployment Status

_2026-05-30, coach-collaboration pass. Tracks what is in the local
`firestore.rules`, what is emulator-tested, and what still needs deploying to
the live project so app features actually work in production._

## Environment

- Firebase CLI: **authenticated** (`skierjack22@gmail.com`).
- Default project (`.firebaserc`): **`nordicfleet-11e67`**.
- Harness: `npm run test:rules` **green** (auto-resolves keg-only JDK 21).

## Policy followed

The agent does **NOT** auto-deploy. Deploying Firestore rules changes the LIVE
project used by any current beta users, so that is left to you to run
deliberately. The change is additive and tested (below), so it is safe to
deploy when you choose.

## Local rules inventory (emulator-tested)

`firestore.rules` currently contains, all covered by `firestore-tests/`:

- Existing rules (users, athlete subcollections, coachRequests, messages,
  marketingSignups) - unchanged, regression-tested.
- **Edit boundary** (added completion pass): owner can update own ski/wax/test;
  linked coach cannot; unrelated denied.
- **`athleteInvites`** (added completion pass): coach-private tracking;
  coach-only create (pending) / read / list / revoke; no enumeration.

This coach-collaboration pass LANDED (emulator-tested) more rules:

- **`coachPermission`** boundary (Phase 3): rides the EXISTING user-doc rules
  (athlete owner-write, coach/owner read) - no rule CHANGE, just new tests
  (athlete sets own; coach reads but cannot raise; unrelated denied). Nothing
  to deploy for this.
- **`coachHasComment()` + `fleetSuggestions`** (Phase 4, NEW rule): comment-
  coach create, athlete-only accept/reject, immutable parties on update, both
  parties read, no delete. NEEDS DEPLOY.
- Athlete-side invite acceptance (a `get`-by-unguessable-token read) is
  **deferred** (Phase 2 not shipped) - see the backlog.

**Total: `npm run test:rules` = 27/27.** The only NEW collection rule needing
deploy this pass is `fleetSuggestions` (plus the still-undeployed
`athleteInvites` from the prior pass).

## What needs deploying for features to work

The following app code writes to rules that are **tested but not yet deployed**;
until you deploy, those writes are denied by default (safe-closed, NOT a leak):

- Coach **Invite athletes** -> writes `athleteInvites`.
- (This pass) athlete coach-permission changes, and coach/athlete fleet
  suggestions.

## Exact command (run when ready)

```
firebase deploy --only firestore:rules
```

Safety: every rule above is additive (new collections / a new athlete-owned
field) and emulator-tested; no existing rule was weakened. After deploying,
re-run `npm run test:rules` to confirm the tested rules match what is live.
