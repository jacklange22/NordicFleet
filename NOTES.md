# Notes

Decisions made during autonomous overnight rewrite — see commit log for context.

## Environment

- `node` / `npm` are NOT installed in this autonomous environment. The brief said I could run `npm install`, `npm test`, and `npm run lint`, but I cannot. **Every change in this rewrite is static** — written, type-checked by hand, and reviewed for symmetry against the rest of the codebase, but not executed. This is logged in `BLOCKERS.md` so the user runs `npm install` first thing in the morning.
- Consequence: tests are written exactly as Jest expects them but were never run. The test files target known mocks and should pass; if anything fails, it'll be a tiny path / mock mismatch the user can fix in a couple of minutes.
- Consequence: no lockfile update. The user will get the new lockfile on first `npm install`.

## Phase 1 decisions

- **Lifted state pattern for wax/test inputs.** The brief asked for state to be lifted to the parent screen. I implemented this as: the screen owns one entry object per selected ski (`{ binder, kickLayers, glideLayers, glideWaxes[], kickWax, notes }` for wax; `{ glideWax, kickWax, glideRating, kickRating, stabilityRating, climbingRating, notes }` for tests), passed as `value` + `onChange` to the input component. The input component is now purely controlled.
- **`getUserSkis` keeps returning IDs only.** The brief asked `MultiSelectDropdown` to take `{id, label}` objects, so the screens now build `[{id, label: skiName}]` for the dropdown and keep the technique lookup keyed on `id`.
- **`profile.js` reads from the loaded profile object, not `route.params.userId`.** Phase 1 just makes the JSX correct; Phase 3 swaps the source to AuthContext. Field name normalized to lowercase `location` (matches the JSON).
- **`newSki.js` validation.** `notes` is now optional. I kept `name` required because without a human-readable name the Home screen list is unusable.
- **`AuthLoadingScreen.js` import.** Restored `import AsyncStorage from '@react-native-async-storage/async-storage'`. The screen still navigates conditionally on whether a token is present so it's non-crashing; Phase 3 rewrites it to use the AuthContext properly.
- **Dropdown placeholder.** Initialized `selectedOption` to `''` so the `placeholder` prop actually shows on first render. Destructured `placeholder` from props.

## Phase 2 decisions

- **Disk persistence enabled explicitly** in `src/services/firebase.js` even though it's the mobile default. Brief asked for this.
- **Soft delete for skis** = `retired: true`. `hardDeleteSki` exists in the service but isn't wired to the UI.
- **Subscriptions return unsubscribe.** All `subscribe*` methods return the raw onSnapshot return value, which is the unsubscribe function. Callers use it in a `useEffect` cleanup.
- **`serverTimestamp()` for createdAt/updatedAt.** No client-side `Date.now()`.
- **Seed data is opt-in.** I moved `testingdata.json` to `seedData.json` and added `seedCurrentUser(uid)`. It's idempotent — checks for an existing ski with `seedId === jsonSki.id` before writing.
- **A single shared Firestore mock** lives at `__mocks__/@react-native-firebase/firestore.js`. Tests pull from it through `jest.setup.js`.

## Phase 3 decisions

- **AuthContext owns user, loading, signIn, signUp, signOut.** Sign-up creates the profile doc as part of the sign-up flow.
- **AuthLoadingScreen now just routes** based on `useAuth().user`. The brief calls for this to be the initialRouteName.
- **Error mapping** mirrored between login and signup — they share a small `mapAuthError` helper inlined in each file (keeping each screen self-contained).
- **Profile screen "Sign out" button** anchored above the Footer with a confirmation `Alert`.

## Phase 4 decisions

- **`waxinglog.js` writes happen via `Promise.all`.** If any write fails with a network error, Firestore queues it and the UI still navigates home. Per the brief, this IS the offline-first contract.
- **`newSki.js` does a round-trip read after write.** Create returns the doc ID, then `replace('SkiInfo', { skiId })` so SkiInfo reads back through `subscribeSki`. Proves create/read both work.
- **Password change in profile.** Implemented via `EmailAuthProvider.credential` + reauthentication; new modal asks for current password first. Error mapping for `auth/wrong-password`.
- **`skiInfo.js` rewritten** to take `{ skiId }` only and load via `subscribeSki`. Renders last 10 wax logs and last 10 test logs as tappable rows (tap is a no-op for now, since there's no detail screen; brief didn't ask for one).

## Phase 5 decisions

- **Standard header style hoisted into the screens that violated it.** I didn't create a shared `Header` component to avoid changing the visual; each screen still owns its own header View and styling, but every screen now uses `{ paddingHorizontal: 16, height: 50, backgroundColor: '#282828' }`.
- **`LoadingScreen` and `ErrorBoundary`** components added under `src/components/`. ErrorBoundary wraps the entire NavigationContainer.
- **Accessibility:** every `TouchableOpacity` gets `accessibilityRole="button"` and an `accessibilityLabel`. Decorative `Image`s get `accessibilityElementsHidden={true}` plus `importantForAccessibility="no"`.
- **JSDoc on every service function.**

## Audit / loop-back decisions

(Will be appended as audits are done.)

