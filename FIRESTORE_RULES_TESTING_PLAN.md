# Firestore Rules Testing: Harness (UNBLOCKED)

_2026-05-30, completion pass: the JDK blocker is RESOLVED. `npm run test:rules`
passes (11/11 on the current rules). JDK 21 (Homebrew `openjdk@21`, 21.0.11) is
installed but keg-only, so it is not on the default PATH; the `test:rules`
script now prepends `$(brew --prefix openjdk@21)/bin` automatically, so the
harness "just works" with no manual `JAVA_HOME` setup. The original blocker
write-up is kept below for history._

## Status: WORKING

- `npm run test:rules` boots the Firestore emulator and runs the suite green.
- Rule-gated features may now ship **provided each new rule has emulator
  tests** added to `firestore-tests/` first.
- If `brew` or `openjdk@21` is absent, the script falls back to system Java and
  fails with the JDK-version error below - install via `brew install
  openjdk@21` (no symlink or profile edit needed).

---

_Original blocker write-up (historical):_

## What is ready

- `@firebase/rules-unit-testing@^5.0.1` added as a dev dependency (the one
  package the brief permits for this).
- `firestore-tests/rules.test.js`: regression tests for the CURRENT rules
  (unauth cannot read users; owner read/write own; cross-user denied; linked
  coach can READ but NOT WRITE athlete skis/waxLogs/testLogs; messages
  readable only by sender/recipient; marketingSignups anon-create-only,
  no client read, extra-keys rejected).
- `firestore-tests/jest.config.js` and the `npm run test:rules` script, which
  wraps the suite in `firebase emulators:exec --only firestore`.
- `firebase.json` now has an `emulators.firestore` block (port 8080).

When the blocker below is resolved, `npm run test:rules` should pass with no
other changes.

## The exact blocker

```
Error: firebase-tools no longer supports Java version before 21.
Please install a JDK at version 21 or above to get a compatible runtime.
```

- Installed firebase-tools: **15.18.0** (global) which requires **JDK 21+**.
- Installed Java: **Amazon Corretto 11** (`/usr/libexec/java_home -V` shows
  only 11.0.27). No JDK 21 on the machine.

Installing a JDK, or pinning a different firebase-tools version, is a
system/dependency change beyond the scope allowed for this pass ("only add the
standard Firebase rules unit testing package; do not upgrade dependencies").
So the emulator could not be run here.

## Fix (pick one), then `npm run test:rules`

1. **Install JDK 21+** (recommended):
   ```
   brew install openjdk@21
   sudo ln -sfn /opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk \
     /Library/Java/JavaVirtualMachines/openjdk-21.jdk
   export JAVA_HOME=$(/usr/libexec/java_home -v 21)
   npm run test:rules
   ```
2. **Or** pin a JDK-11-compatible emulator CLI locally (no global change):
   `npm i -D firebase-tools@13` and change the `test:rules` script to
   `npx firebase-tools emulators:exec ...`. (Adds a second dev dep; only do
   this if you prefer not to install JDK 21.)

## Policy consequence (followed this pass)

Because rules cannot be tested here, and the brief says **do not ship public
sharing or coach edit permissions without rules tests** and **do not weaken
Firestore rules**:

- **No Firestore rules were changed or deployed** this pass.
- Features that need NEW rules (coach invites Firestore writes, coach
  permissions/suggestions, public sharing) were **NOT shipped**. Their
  **pure/core pieces** (email-list parser, permission constants, share
  sanitizer) were implemented with unit tests, ready to wire to Firestore once
  the harness runs and the rules in `COACH_FEATURES_DESIGN.md` /
  `PUBLIC_SHARING_DESIGN.md` are added and tested.
- Features that need NO new rules (messaging, history screens, edit wax/test
  logs, unit preferences, sticker parsing foundation, feedback entry point)
  were implemented normally with tests.

## Next steps to unlock the gated features

1. Resolve the JDK blocker; confirm `npm run test:rules` passes (locks current
   rules).
2. Add the `athleteInvites`, `fleetSuggestions` + coach-permission, and
   `publicShares` rules from the design docs, each with emulator tests.
3. Then wire the mobile/marketing UI for invites, suggestions, and sharing.
