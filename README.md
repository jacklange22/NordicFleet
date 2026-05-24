# NordicFleet

iOS-only React Native app for cross-country ski fleet tracking. Built with React Native 0.73.6, JavaScript, React Navigation 6, and Firebase (Auth + Firestore) via `@react-native-firebase/*`.

## Quick start

```bash
npm install
cd ios && bundle install && bundle exec pod install && cd ..
npm run ios
```

First-time setup requires Xcode and a Firebase project (see "Firebase setup" below).

## Project structure

```
App.tsx                  Root: ErrorBoundary > AuthProvider > NavigationContainer
src/
  context/               React Context (AuthProvider, useAuth)
  services/              Firestore + Auth service layer
    firebase.js          Shared init; explicitly enables disk persistence
    userService.js       getProfile, updateProfile, subscribeProfile, …
    skiService.js        listSkis, createSki, updateSki, deleteSki (soft), subscribeSkis, subscribeSki, …
    waxLogService.js     createWaxLog, listWaxLogsForSki, subscribeWaxLogsForSki, …
    testLogService.js    createTestLog, listTestLogsForSki, subscribeTestLogsForSki, …
    seed.js              Idempotent seedCurrentUser(uid) using seedId markers
  components/            Stateless UI atoms (Dropdown, MultiSelectDropdown, Footer, etc.)
  screens/               One file per route (Welcome, Login, Signup, Home, Profile, NewSki, SkiInfo, WaxLog, TestingLog, AuthLoading)
  seedData.json          Sample-data source for the seed function
__mocks__/               Jest mocks for @react-native-firebase/* and AsyncStorage
firestore.rules          Per-user rules; only the owning uid can read or write their docs
firebase.json            Points firestore CLI at firestore.rules
```

## How auth works

`AuthProvider` (in `src/context/AuthContext.js`) wraps `<NavigationContainer>` and listens to `auth().onAuthStateChanged`. It exposes `{ user, loading, signIn, signUp, signOut }` via `useAuth()`. `AuthLoadingScreen` is the initial route — it renders a spinner while `loading`, then `navigation.replace`s into `Home` (if `user`) or `Welcome` (if not).

Sign-up creates the user's Firestore profile doc as part of the flow. Errors are mapped to user-facing strings in `login.js` and `signup.js`.

## Data model

```
users/{uid}                              email, displayName, weight, height, team, location, createdAt, updatedAt
  /skis/{skiId}                          name, brand, model, technique, type, build, base, grind, length, flex, year, notes, retired, seedId, createdAt, updatedAt
  /waxLogs/{logId}                       skiId, date, binder, kickLayers, kickWax, glideLayers, glideWaxes[], notes, createdAt
  /testLogs/{logId}                      skiId, date, temperature, humidity, snowType, surface, glideWax, kickWax, glideRating, kickRating, stabilityRating, climbingRating, notes, createdAt
```

Firestore disk persistence is enabled at app boot in `src/services/firebase.js`, so offline writes queue locally and replay when the device reconnects.

## Tests

```bash
npm test                  # Jest, fully mocked Firebase
npm test -- --coverage    # coverage report
```

Tests use the in-memory Firestore mock in `__mocks__/@react-native-firebase/firestore.js`. Reset between tests with `firestoreMock.__resetFirestoreMock()`; seed with `__seedDoc(path, data)`.

Auth tests reset with `authMock.__resetAuthMock()` and can seed a user with `__seedUser(email, password, uid)` or directly set the current user with `__setCurrentUser({...})`.

## Firebase setup (one-time)

1. Make sure `ios/GoogleService-Info.plist` is present and the project name in `app.json`/`AppDelegate.mm` matches.
2. In the Firebase console for the project:
   - Authentication → Sign-in method → Email/Password → Enable.
   - Firestore Database → Create database → Production mode.
3. Deploy the rules:
   ```bash
   firebase deploy --only firestore:rules
   ```
   (or paste `firestore.rules` into the console under Firestore → Rules → Publish).
4. The seed button on the Profile screen (visible in `__DEV__` builds) populates the current user with sample skis. It is idempotent.

## Lint

```bash
npm run lint
```

## What's iOS-only

The `android/` directory is shipped from the React Native template but the app is never built for Android. Do not bother with Gradle.

## Notes from the rewrite

See `NOTES.md` for design decisions and `BLOCKERS.md` for any outstanding items.
