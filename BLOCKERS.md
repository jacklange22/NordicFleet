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

## ✅ RESOLVED: Web app — Vercel deploy + env vars

> Resolved during the "Web sign-in fix" session. All six
> `NEXT_PUBLIC_FIREBASE_*` env vars are now set on the
> `nordicfleet-web` Vercel project, and `vercel.json` carries the
> monorepo-root recipe (install at /vercel/path0, build with
> `cd ../.. && npm run web:build`, output `.next` relative to the
> framework root). Production is live at
> https://nordicfleet-web.vercel.app/ with the Firebase config
> inlined and sign-in working. The forgot-password page at
> /forgot-password is also live.

If you need to re-set the env vars later (e.g. you rotate the
Firebase API key):

```bash
cd /Users/jacklange/NordicFleet
# Pull whatever's currently in Vercel (useful as a backup)
npx vercel env pull apps/web/.env.local.backup

# To replace a single var:
npx vercel env rm NEXT_PUBLIC_FIREBASE_API_KEY production --yes
printf '%s' "$NEW_VALUE" | npx vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production

# Then redeploy:
npx vercel --prod
```

There are two Vercel projects in the user's account (`web` and
`nordicfleet-web`) — `nordicfleet-web` is the canonical one with
the live URL and env vars. `web` is orphaned from an earlier
attempt and can be deleted from the dashboard at the user's
leisure (no functional impact).

## Android — debug build (partially unblocked; two environment gaps remain)

The Android project is now **correctly configured** for this monorepo, and
`./gradlew :app:assembleDebug` progresses through Gradle bootstrap, the
React Native gradle plugin compile, and project configuration. It stops at
two **environment** gaps that can't be fixed from inside the repo. Both are
machine setup, not code.

### What was fixed in the repo (committed)

1. **Monorepo node_modules resolution.** npm workspaces hoist `react-native`,
   `@react-native/*`, and `@react-native-community/*` to the **repo-root**
   `node_modules`, but the Android gradle files shipped with hard-coded
   `../node_modules/...` paths that resolve to `apps/mobile/node_modules`
   (which doesn't contain them). `settings.gradle` and `app/build.gradle`
   now resolve every package via `node --print "require.resolve(...)"` — the
   same approach the iOS Podfile already uses. The `react {}` block sets
   `reactNativeDir`, `codegenDir`, and `cliFile` to the hoisted locations.
2. **Gradle version.** Bumped the wrapper from 8.3 → 8.10.2 (AGP requires
   8.7+; 8.10.2 matches the RN 0.76 template).
3. **Google Services plugin.** Added the `com.google.gms:google-services`
   classpath, and `app/build.gradle` applies the plugin **only when
   `app/google-services.json` exists** — so the build doesn't hard-fail
   before the Firebase config file is added.

The OCR module needs **no** Android guarding: it's a local **iOS-only**
native module (`ios/NFOCR/`, Apple Vision), not an npm package, so Android
autolinking never sees it, and `ocrService.js` already returns
`NFOCR_UNAVAILABLE` on non-iOS. There is nothing Android-side to break.

### Remaining environment gaps (USER ACTION)

The captured failure log is at `scripts/logs/android-assembleDebug.log`.

1. **JDK 17 required (only JDK 11 installed).** AGP fails with:
   `Android Gradle plugin requires Java 17 to run. You are currently using
   Java 11.` Install a JDK 17 and point the build at it, e.g.:
   ```bash
   brew install openjdk@17
   export JAVA_HOME="$(/usr/libexec/java_home -v 17)"
   ```
   (or set `org.gradle.java.home` in `android/gradle.properties`).

2. **Android SDK not installed** (`ANDROID_HOME` unset, no
   `~/Library/Android/sdk`). Install the command-line tools or Android
   Studio, then create `apps/mobile/android/local.properties` with:
   ```
   sdk.dir=/Users/<you>/Library/Android/sdk
   ```
   and accept the SDK licenses (`sdkmanager --licenses`). The build needs
   `platform-34`, `build-tools;34.0.0`, and NDK `25.1.8937393`
   (see `android/build.gradle`). `local.properties` is intentionally git-
   ignored (it's machine-specific).

3. **`google-services.json` missing** (same gap as iOS' `GoogleService-Info.plist`).
   Download it from the Firebase console (Project settings → Your apps →
   Android app, package `com.nordicfleet`) and drop it at
   `apps/mobile/android/app/google-services.json`. Until then the app
   compiles but Firebase has no config at runtime.

### To finish locally

```bash
export JAVA_HOME="$(/usr/libexec/java_home -v 17)"   # after installing JDK 17
cd apps/mobile/android
printf 'sdk.dir=%s/Library/Android/sdk\n' "$HOME" > local.properties
./gradlew :app:assembleDebug
```

With JDK 17 + the SDK + `google-services.json` in place, the project is
expected to build a debug APK — the repo-side configuration work is done.
This could not be verified end-to-end in the build environment used for this
session because installing a JDK 17 and the multi-GB Android SDK was out of
scope; the progress and the exact stopping point are captured in the log
above.
