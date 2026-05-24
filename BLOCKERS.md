# Blockers

Items requiring user action before the app will run.

## ✅ RESOLVED: native build incompatibility

> ~~Hard blocker: native build incompatibility (Xcode 26.5 + RN 0.73 + Firebase 11)~~

Resolved by the upgrade session — the stack is now RN 0.76.9 + React 18.3.1 +
@react-native-firebase/* 21.14.0 + Firebase iOS 11.11.0, and the app builds
and launches on the iPhone 17 Pro simulator under Xcode 26.5. The Welcome
screen renders end-to-end. Diagnostic chain from the failed earlier attempt
is preserved in git history at commit `fb57059` for posterity.

The new Podfile carries six `post_install` workarounds for known Xcode 26.5 +
RN 0.76 + Firebase iOS 11 quirks. They're all documented inline in
`ios/Podfile`; the summary is in the F1 commit message.

## Environment (handled by the upgrade session)

These were handled and are no longer blockers:

- **Node 20.20.2** via Homebrew (was Node 26 — incompatible with RN's lockstep
  toolchain).
- **Homebrew Ruby 3.3.11** at `/opt/homebrew/opt/ruby@3.3/bin` (the rbenv
  3.1.4 install is broken — missing socket stdlib — and Ruby 4 drops the
  kconv stdlib cocoapods needs). Set `PATH=/opt/homebrew/opt/ruby@3.3/bin:$PATH`
  in any shell that runs `bundle exec pod install`.
- **CocoaPods 1.15.2** (the Gemfile excludes 1.15.0 and 1.15.1 because of the
  RN-templated bug, and caps xcodeproj at < 1.26.0 which forces 1.15.x).
- **Node modules**: `npm install` exits clean, 1063 packages.
- **Pods**: `RCT_NEW_ARCH_ENABLED=0 bundle exec pod install` installs 97 pods
  including FirebaseAuth, FirebaseFirestore, FirebaseAnalytics 11.11.0.

## Firebase console (still required for the app to fully function)

The app builds and launches without these; you'll just hit auth errors the
moment someone tries to sign up.

1. ✅ **Enable Email/Password auth** in the Firebase console (done — the
   e2e verification script signed up a real test user against the live
   project).

2. ✅ **Create the Firestore database** (done — the same e2e script
   wrote profile/ski/log docs).

3. ✅ **Firestore security rules deployed** — the coach feature's rules
   (owner reads, coach reads of `coachId == self`, public coach
   profiles for email lookup, all writes owner-only) were deployed
   during the verify session via `firebase deploy --only firestore:rules`.
   `firebase-tools@15.18.0` is installed globally.

   If you ever need to re-deploy (e.g. after editing `firestore.rules`):
   ```
   firebase use nordicfleet-11e67
   firebase deploy --only firestore:rules
   ```
