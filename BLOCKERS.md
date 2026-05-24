# Blockers

Items requiring user action before the app will run.

## **⛔ Hard blocker: native build incompatibility (Xcode 26.5 + RN 0.73 + Firebase 11)**

This is the only thing preventing the app from booting. Everything else (JS, tests, lint, pods install) is clean.

**Symptom:** `npm run ios` fails during native compilation. Two compounding issues:

1. **gRPC-Core 1.62.5 (shipped with Firebase iOS 10.20.0)** has a `Traits::template CallSeqFactory(...)` construct in `src/core/lib/promise/detail/basic_seq.h:103` that Xcode 26.5's clang 17 rejects with `-Wmissing-template-arg-list-after-template-kw`.

2. **BoringSSL-GRPC's podspec** leaks a literal `-GCC_WARN_INHIBIT_ALL_WARNINGS` into OTHER_CFLAGS, which clang 17 parses as a (nonexistent) `-G` option.

**What I tried (cleaning up between each attempt):**
| Attempt | Approach | Failure |
|---|---|---|
| 1 | Suppress `-Wmissing-template-arg-list-after-template-kw` for gRPC-Core via post_install | BoringSSL-GRPC's `-GCC_WARN_INHIBIT_ALL_WARNINGS` clang flag now fatal |
| 2 | Also strip the BoringSSL flag in post_install | Then `Headers/Private/grpc/gRPC-Core.modulemap not found` (gRPC-C++ target's module-map path mismatches its actual location) |
| 3 | Pin `$FirebaseSDKVersion = '11.0.0'` to get fixed gRPC | RNFB 18.9.0 caps nanopb at 2.x, Firebase 11.0 needs nanopb 3.x. Unresolvable peer constraint |
| 4 | Bump @react-native-firebase/* to 21.14.0 (which supports Firebase iOS 11.x) | Pod install OK; build fails with `FirebaseAuth-Swift.h file not found` |
| 5 | Add `:modular_headers => true` for FirebaseAuth/Firestore/Analytics/Core/CoreInternal/GoogleUtilities | Build still fails: Swift compilation of FirebaseFirestore can't resolve `FirebaseCore`, `FirebaseFirestoreInternal`, `FirebaseCoreExtension` modules |

**Root cause:** Firebase iOS 11 ships Firebase Auth and Firestore as Swift modules with explicit module dependencies. The way Cocoapods 1.16.2 generates module maps under RN 0.73's Podfile setup doesn't expose those internal Swift modules consistently. This is a known stack-incompatibility issue documented in [several invertase/react-native-firebase issues](https://github.com/invertase/react-native-firebase/issues).

**Code state after my attempts:** I reverted everything back to the brief's intended versions — `@react-native-firebase/*` at `^18.9.0`, Podfile unchanged, no modular_headers overrides. `pod install` exits cleanly. `npm test` and `npm run lint` both pass.

**Recommended fixes for the user (pick one):**

A. **Downgrade Xcode to 15.4** (the version RN 0.73 was tested against). Apple still hosts it; download from the developer portal. This is the lowest-risk option — keeps everything else as-is.

B. **Upgrade React Native to ≥ 0.76 and Firebase to ≥ 21.x.** RN 0.76 is the first version with Xcode 26 + Firebase iOS 11 compatibility tested by both the RN core and react-native-firebase teams. This is the right long-term move but it's a substantial migration (New Architecture by default, Hermes config changes, RN/Codegen surface area changes). Out of scope for this overnight rewrite.

C. **Workaround: build via a Docker image with Xcode 15.4 and `xcrun` from there.** Painful.

If you go with A: after installing Xcode 15.4, `sudo xcode-select -s /Applications/Xcode_15.4.app`, then `cd ios && rm -rf Pods Podfile.lock && bundle exec pod install`, then `npm run ios`. Should boot to the Welcome screen.

## Environment (already handled by the cleanup session)

These are no longer blockers but documenting for posterity:

- **Node 26 → 20.20.2.** `brew unlink node && brew install node@20 && brew link --overwrite --force node@20`. Confirmed working.
- **Ruby on rbenv was broken.** rbenv-managed Ruby 3.1.4's socket extension is missing (incomplete install). Switched to Homebrew Ruby 3.3.11 via `PATH=/opt/homebrew/opt/ruby@3.3/bin`. Cocoapods 1.16.2 runs cleanly there.
- **CocoaPods 1.16.2 installed via Bundler** (Gemfile.lock regenerated under bundler 2.7.x). Pods install cleanly with RNFB 18.9.0.

## Firebase (still required for the app to function once it builds)

1. **Enable Email/Password auth** in the Firebase console for project `nordicfleet-11e67`:
   - Authentication → Sign-in method → Email/Password → Enable.

2. **Create the Firestore database** (production mode) in the Firebase console:
   - Firestore Database → Create database → Production mode → pick a region (us-central1 is fine).

3. **Install the Firebase CLI and deploy security rules** (file `firestore.rules` is at the project root):
   ```
   npm install -g firebase-tools
   firebase login
   firebase use nordicfleet-11e67
   firebase deploy --only firestore:rules
   ```
   (firebase CLI is not currently installed on this machine — I checked with `which firebase`.)
   Alternatively, paste `firestore.rules` into the Firebase console under Firestore → Rules → Publish.
