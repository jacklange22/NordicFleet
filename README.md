# NordicFleet

Cross-country ski fleet tracker. Athletes log waxes + tests on iOS;
coaches see their athletes' fleets read-only; everyone gets a web
preview at `apps/web`.

Native iOS app (React Native 0.76) + Next.js 16 web preview + shared
`@nordicfleet/core` business-logic package, organized as an npm
workspaces monorepo.

## Quick start

```bash
npm install                       # installs all workspaces
npm test                          # core + mobile test suites
npm run lint                      # both workspaces

# iOS app
cd apps/mobile/ios
PATH="/opt/homebrew/opt/ruby@3.3/bin:$PATH" \
  LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 \
  bundle install
PATH="/opt/homebrew/opt/ruby@3.3/bin:$PATH" \
  LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 \
  bundle exec pod install
cd ../..
npm run ios

# Web preview
cp apps/web/.env.local.example apps/web/.env.local   # fill in Firebase config
npm run web:dev                                       # http://localhost:3000
npm run web:build                                     # production build
```

First-time setup requires Xcode 26.5 (iOS) and a Firebase project
(see `BLOCKERS.md`).

## Layout

```
nordicfleet/
├── apps/
│   ├── mobile/                  React Native 0.76 iOS app
│   │   ├── App.tsx              ErrorBoundary > AuthProvider > Stack
│   │   ├── ios/                 Podfile, *.xcworkspace
│   │   └── src/
│   │       ├── context/         AuthContext
│   │       ├── components/ui/   atoms (Card, Button, Input, Pill,
│   │       │                    Header, TabBar, StatCard, Avatar,
│   │       │                    EmptyState, ListItem, SectionHeader,
│   │       │                    WaxPicker, …)
│   │       ├── components/share/SkiShareCard, FleetShareCard
│   │       ├── hooks/           useSkis, useProfile, useDashboardStats
│   │       ├── screens/         Welcome, Login, Signup, ForgotPassword,
│   │       │                    RoleSelect, Home, AddSki, SkiInfo,
│   │       │                    WaxLog, TestingLog, Profile,
│   │       │                    CoachDashboard, AthleteDetail,
│   │       │                    Messages, MessageDetail
│   │       ├── services/        skiService, waxLogService,
│   │       │                    testLogService, userService,
│   │       │                    coachRequestService, messageService,
│   │       │                    locationService, shareService, seed
│   │       └── theme/           design tokens
│   └── web/                     Next.js 16 web preview
│       └── src/
│           ├── app/             /, /login, /signup, /home, /coach,
│           │                    /profile, /ski/[id]
│           ├── components/      Card, Button, Pill, StatCard,
│           │                    SignedInGuard, SiteHeader
│           └── lib/             firebase.js (lazy init), firestore.js
├── packages/
│   └── core/                    @nordicfleet/core — shared logic
│       └── src/
│           ├── types/           JSDoc typedefs + runtime enums
│           ├── validation/      pure validators
│           ├── constants/       skiBrands, snowTypes, surfaceTypes,
│           │                    binderTypes, waxDictionary, seedData
│           └── services/        payload builders
├── scripts/                     verify-*.sh against live Firestore
├── firestore.rules              shared security rules
├── firebase.json
├── verification-screenshots/    gitignored
└── *.md                         BLOCKERS / MORNING_REPORT / NOTES /
                                 LAUNCH_READINESS / DEVICE_INSTALL /
                                 MANUAL_VERIFICATION
```

## What's in `@nordicfleet/core`

Pure JS — no React Native, no Firebase SDK dependencies. Both
`apps/mobile` and `apps/web` import from here.

- **types/** — JSDoc typedefs for Profile / Ski / WaxLog / TestLog /
  Message / CoachRequest / Wax; runtime enums for SKI_TECHNIQUES,
  SKI_TYPES, COACH_REQUEST_STATUSES, WAX_TYPES.
- **validation/** — `isValidEmail`, `validatePassword`,
  `validateSkiInput`, `validateWaxLogInput`, `validateTestLogInput`.
- **constants/** — ski brands, snow types, surface types, binder
  types, seed data JSON, curated wax dictionary (~60 entries from
  Swix / Toko / Star / Vauhti / Rode / Holmenkol / Briko-Maplus)
  with `searchWaxes` / `getWaxById` helpers.
- **services/** — payload builders called before any Firestore
  write: `buildSkiCreatePayload`, `buildSkiUpdatePayload`,
  `buildWaxLogCreatePayload`, `buildTestLogCreatePayload`,
  `buildCoachRequestCreatePayload`, `buildCoachRequestStatusPayload`,
  `buildMessageCreatePayload`, `buildMarkReadPayload`.

83 jest specs, all green.

## Firebase setup

The project is `nordicfleet-11e67`. Required console state:
1. Email/Password auth enabled.
2. Firestore database created in production mode.
3. `firestore.rules` deployed (see `BLOCKERS.md` for the command).
4. A Web app registered in Project Settings → General → Your apps
   (the values populate `apps/web/.env.local`).

Run `./scripts/verify-flows.sh`, `./scripts/verify-data-integrity.sh`,
`./scripts/verify-coach-pairing.sh`, and `./scripts/verify-seed.sh`
to confirm the data layer end to end.

## Documentation

- **`DEVICE_INSTALL.md`** — get the iOS app on your iPhone via a free
  Apple ID in ~15 minutes.
- **`MANUAL_VERIFICATION.md`** — UI walkthrough checklist.
- **`MORNING_REPORT.md`** — latest-session summary on top.
- **`LAUNCH_READINESS.md`** — honest shipping assessment.
- **`NOTES.md`** — design decisions and trade-offs.
- **`BLOCKERS.md`** — items requiring user action.
