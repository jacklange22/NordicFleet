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

This coach-collaboration pass ADDS (and emulator-tests) more rules:

- **`athleteInvites` get-by-token** for athlete acceptance (single-doc get by
  unguessable token id; LIST stays coach-only - no enumeration). _[if Phase 2
  ships]_
- **`users/{uid}.coachPermission`** read/write boundary (athlete sets own;
  coach cannot set their own; coach can read). _[Phase 3]_
- **`fleetSuggestions`** (comment-coach create; athlete accept/reject; sanitized
  fields). _[Phase 4]_

See `COACH_COLLABORATION_REPORT.md` (end of this pass) for the final inventory
and the exact test count.

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
