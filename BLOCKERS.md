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

## Web app — Vercel deploy + env vars

The web app at `apps/web` builds locally (`npm run web:build` from the
monorepo root → ✓ all 9 routes generated). To get it deployed:

### 1. Register a web app in Firebase Console
- Firebase Console → Project settings → General → Your apps → Add app → `</>`.
- Skip "Set up Firebase Hosting" (we use Vercel).
- Copy the resulting `firebaseConfig` values.

### 2. Fill in apps/web/.env.local
```bash
cp apps/web/.env.local.example apps/web/.env.local
# Then paste in the 6 NEXT_PUBLIC_FIREBASE_* values from step 1.
```

### 3. Deploy to Vercel (from the monorepo root)
The Vercel CLI didn't complete the deploy during the platform-foundation
session due to monorepo / workspace dep resolution edge cases — you'll
need to do this manually:

```bash
cd /Users/jacklange/NordicFleet
npx vercel link            # link the project — pick "Create new"
                           #   name: nordicfleet-web
                           #   directory: apps/web

# Set the project's Root Directory + framework in the Vercel dashboard:
#   Settings → General → Root Directory → apps/web
#   Settings → General → Framework Preset → Next.js
#   Settings → Build & Output:
#     Install Command (override): cd ../.. && npm install
#     Build Command (override):   cd ../.. && npm run web:build

# Add the 6 NEXT_PUBLIC_FIREBASE_* env vars in:
#   Settings → Environment Variables  (one per variable, "Production" + "Preview")

# Finally:
npx vercel --prod          # deploys to https://nordicfleet-web.vercel.app
                           # (or whatever name you picked)
```

Alternatively, push the repo to GitHub and import via the Vercel
dashboard — auto-deploy on push is the long-term-correct workflow.

### Why the CLI deploy didn't finish in-session
`vercel deploy` from the monorepo root uploads only the files under the
"linked" directory (apps/web). The web app imports `@nordicfleet/core`
via the workspace symlink, which Vercel can't resolve in a flat upload.
The Root-Directory override + workspace-aware install/build commands
above are the canonical fix. There's a brief writeup in NOTES.md.
