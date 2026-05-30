# Phone Freeze — Debug Steps

_Why this doc exists: the iOS app freezes on a real iPhone, but the code is
loop-free under static analysis and the full test + build gate is green.
This is the exact procedure to pin the freeze on the device, plus the
clean-reinstall that fixes the most common cause (a stale on-device JS
bundle)._

Last updated: 2026-05-30. Branch `claude-rewrite`.

---

## TL;DR

1. **Clean-reinstall first** (section 2). A stale/cached JS bundle is the #1
   cause of a "frozen" RN app after code changes, and it's free to rule out.
2. If it still freezes, **read the `[freeze-trace]` logs** (section 3) and
   match the **last line printed** against the decision tree (section 4).
3. Report the last `[freeze-trace]` line + any `JetsamEvent` — that pins it.

---

## 1. What was already checked (so you don't repeat it)

Static analysis of the boot path found **no infinite render/effect loop**:

- **Entry / providers** — `index.js`, `App.tsx`, `AuthContext`, `ModeContext`
  reviewed. The auth listener and profile subscription each fire-and-settle;
  no setState-in-render; the global error handler is installed.
- **ModeContext backfill** — `backfillCoachCapability` writes a boolean
  `isCoach`, which clears `needsCoachBackfill`, so it self-terminates after
  one write (no snapshot→write→snapshot loop).
- **Navigation** — the only `navigation.reset` calls (TabBar mode switch,
  Settings sign-out/delete) are one-shot user actions, never in an effect.
- **Mode switching** — `switchMode` no-ops when `next === mode`, so a tap
  can't loop.

Two hardening fixes + full boot tracing were added (committed) — see
sections 3 and 5.

The **keychain entitlement** (`keychain-access-groups`) and the device
**signing config** (`DEVELOPMENT_TEAM`, `CODE_SIGN_ENTITLEMENTS`) are intact
in `project.pbxproj` — the sign-in fix is preserved.

---

## 2. Clean reinstall (do this first)

A frozen RN app most often = the device is running a stale or half-built JS
bundle. Reset everything:

```bash
# 0. Delete the app from the iPhone (long-press → Remove App → Delete App).

# 1. Kill any running Metro, then start it with a cleared cache.
#    Leave this running in its own terminal.
cd /Users/jacklange/NordicFleet/apps/mobile
watchman watch-del-all 2>/dev/null || true
npm start -- --reset-cache        # (react-native start --reset-cache)

# 2. In a SECOND terminal: clean the iOS build folder + derived data.
cd /Users/jacklange/NordicFleet/apps/mobile/ios
rm -rf ~/Library/Developer/Xcode/DerivedData/NordicFleet-*
xcodebuild clean -workspace NordicFleet.xcworkspace -scheme NordicFleet

# 3. Reinstall on the device from Xcode:
#    - Open NordicFleet.xcworkspace in Xcode.
#    - Select your iPhone as the run destination.
#    - Product → Run (⌘R).
```

> In Xcode: **Product → Clean Build Folder (⇧⌘K)** is the GUI equivalent of
> step 2's `xcodebuild clean`.

If the app boots normally after this, the freeze was a stale bundle — done.

---

## 3. Read the boot trace

Every boot stage now logs a line tagged **`[freeze-trace]`** (Debug builds
only — `__DEV__`; never ships in Release; silenced under Jest). A healthy
cold start prints, in order:

```
[freeze-trace] js-bundle-loaded
[freeze-trace] app-mounted
[freeze-trace] auth-resolved { signedIn: true }
[freeze-trace] mode-restore { stored: 'coaching' }      # or null/personal
[freeze-trace] profile-snapshot { hasProfile: true, isCoach: true }
[freeze-trace] navigator-ready
[freeze-trace] boot-decision { target: 'CoachDashboard' }
[freeze-trace] route CoachDashboard
```

**The freeze is at the stage AFTER the last line you see.**

### Where the logs appear

- **Debug build connected to Metro** → the Metro terminal (the `npm start`
  window). This is the easiest place to watch `console.log`.
- **Xcode** → the debug console at the bottom while the app runs on the
  device (Product → Run).
- **No Metro / detached** → macOS **Console.app**: connect the iPhone, select
  it in the sidebar, and filter the search box by `freeze-trace` (or
  `NordicFleet`). CLI equivalent:
  ```bash
  # Needs libimobiledevice: brew install libimobiledevice
  idevicesyslog | grep -iE "freeze-trace|NordicFleet|Jetsam"
  ```

---

## 4. Decision tree (match the LAST `[freeze-trace]` line)

| Last line seen | Most likely cause | Next step |
|---|---|---|
| _(nothing)_ | JS bundle never loaded — stale/failed bundle, or Metro unreachable | Redo section 2; confirm the device can reach the Metro host/port |
| `js-bundle-loaded` but no `app-mounted` | A provider throws during first render | Check Xcode console for a red-box / JS exception; ErrorBoundary should show "Something went wrong" |
| `app-mounted` but no `auth-resolved` (>5s) | Firebase Auth init / keychain | Verify `GoogleService-Info.plist` is in the target and `keychain-access-groups` entitlement is present |
| `auth-resolved` but no `profile-snapshot` and no `boot-decision` (>12s) | Firestore profile read is hanging (offline w/o cache, Firestore stall) | The new **12s boot timeout** now routes to Home so it can't sit frozen — if it STILL hangs on the splash, the timeout isn't firing: capture full logs |
| `boot-decision` but no `navigator-ready` / `route` | Navigation/container problem | Confirm the target route exists in `App.tsx`; capture logs |
| `route X` then frozen | Screen **X** is the culprit | Inspect screen X; reproduce by navigating there from a known-good screen |
| `mode-switch` / `route` **repeating rapidly** | A loop (should not happen) | Capture ~20 lines; the repeated pair names the loop |

---

## 5. What changed to make a freeze less likely / louder

All committed on `claude-rewrite`:

- **Boot timeout** (`AuthLoadingScreen.js`): the one-time profile fetch now
  races a 12s timeout. A hung Firestore read falls through to **Home**
  instead of sitting frozen on the splash. `useProfile` on Home backfills the
  doc when it finally arrives.
- **Mode persistence race** (`ModeContext.js`): the "snap back to personal"
  guard now waits until the profile has actually loaded. Before, on a real
  device, AsyncStorage restored the mode before the Firestore profile
  resolved, so `isCoach` was still `false` and a **coach's persisted mode was
  clobbered to personal every cold start** (and the stored value overwritten).
  Corrupt/legacy stored mode values are now cleared instead of re-read.
- **Boot tracing** (`devTrace.js` + call sites): the `[freeze-trace]` lines
  above. **Temporary** — remove `devTrace.js` and its imports once the freeze
  is understood. They are `__DEV__`-only and silenced under Jest, so they do
  not affect Release builds or test output.

---

## 6. Memory / JetsamEvent

A `JetsamEvent` means iOS killed/suspended a process under memory pressure.
If NordicFleet is **not** the largest process in the report, the app was
likely a victim of system-wide pressure, not the leaker — reboot the phone
and retry. To inspect:

- **Settings → Privacy & Security → Analytics & Improvements → Analytics
  Data** → look for `JetsamEvent-*`. Open it and check `largestProcess` and
  the per-process `rpages` (resident pages × 16KB = bytes).
- If **NordicFleet** is the largest process and climbing, capture an
  **Allocations** / memory graph in Xcode Instruments while reproducing.

Firestore persistence is enabled with `CACHE_SIZE_UNLIMITED`
(`apps/mobile/src/services/firebase.js`). If memory growth is tied to the
local cache, lowering `cacheSizeBytes` is the lever — but only pursue this if
Instruments shows the cache as the culprit.

---

## 7. Confirm the latest UX commits are in the phone build

The phone build bundles the current **working tree**, so:

```bash
cd /Users/jacklange/NordicFleet
git rev-parse --abbrev-ref HEAD     # claude-rewrite
git log --oneline -12               # confirm the 11 UX commits + the freeze-fix commit
git status --short                  # only project.pbxproj (device signing) expected
```

- **Debug build** (Metro): Metro serves the live JS from the working tree, so
  a clean reinstall + `--reset-cache` (section 2) guarantees the latest code.
- **Release / archive build**: the JS bundle is baked at build time —
  **rebuild** to embed the latest commits. A device running an older archived
  build will NOT have these fixes regardless of git state.

Spot-check on-device that the UX changes are present: bottom nav reads
**"Ski"** (not "Add"); Profile has a **gear → Settings**; ski cards show
**brand · model** under the name.
