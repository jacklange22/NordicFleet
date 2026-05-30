# NordicFleet — Phone Install Next Steps

_Operator quick-reference. Updated 2026-05-30 (overnight stabilization)._
_Goal: get the hardened build onto the iPhone cleanly and CONFIRM it's the
latest build. Full freeze-debug detail is in `PHONE_FREEZE_DEBUG_STEPS.md`._

## Do this — clean reinstall (fixes a stale-bundle "freeze")

```bash
# 1. On the iPhone: long-press the NordicFleet app → Remove App → Delete App.

# 2. Start Metro with a cleared cache (leave running in its own terminal):
cd /Users/jacklange/NordicFleet/apps/mobile
watchman watch-del-all 2>/dev/null || true
npm start -- --reset-cache

# 3. In a second terminal: clean the build folder + derived data:
cd /Users/jacklange/NordicFleet/apps/mobile/ios
rm -rf ~/Library/Developer/Xcode/DerivedData/NordicFleet-*
xcodebuild clean -workspace NordicFleet.xcworkspace -scheme NordicFleet

# 4. Run on the phone from Xcode:
open NordicFleet.xcworkspace
#    → select your iPhone as the destination → Product → Run (⌘R)
```

5. **Trust the developer cert** (first run only): on the iPhone,
   **Settings → General → VPN & Device Management → [your Apple ID] → Trust**,
   then tap the app again. (Developer Mode must be ON:
   Settings → Privacy & Security → Developer Mode.)

## Confirm it's the LATEST build (don't skip)

- Open the app → **Profile → ⚙ Settings** → scroll to the bottom. In a Debug
  build it shows **`DEV build · 2026-05-30 · overnight-stabilization`**
  (`src/buildInfo.js` `BUILD_TAG`). If you see an older tag or none, the phone
  is running a stale build — repeat the clean reinstall.
- Quick UX spot-check: bottom nav reads **"Ski"** (not "Add"); ski cards show
  **brand · model** under the name.

## If it still freezes — collect logs

The freeze leaves **no crash report** (confirmed: zero NordicFleet `.ips`,
not in any Jetsam event — see `debug/overnight-*/CRASH_ANALYSIS.md`), so we
need a live trace:

- Watch the **Metro terminal** (or Xcode console) during launch for
  **`[NF_BOOT]`** lines. **Report the LAST `[NF_BOOT]` line printed** — it
  pins the hang stage (decision tree in `PHONE_FREEZE_DEBUG_STEPS.md` §4).
- Or detached: `idevicesyslog | grep -iE "NF_BOOT|NordicFleet|Jetsam"`
  (needs `brew install libimobiledevice`).

## Signing / identity status (all verified this session)

| Item | Status |
|---|---|
| `DEVELOPMENT_TEAM = BW4688H3JP` | ✅ set **and committed** (Debug + Release) |
| `CODE_SIGN_ENTITLEMENTS` | ✅ set both configs |
| Keychain entitlement (`keychain-access-groups`) | ✅ intact — sign-in fix preserved |
| App bundle ID | `com.NordicFleet.app` |
| `GoogleService-Info.plist` bundle ID | ✅ matches `com.NordicFleet.app` |
| Firebase project | `nordicfleet-11e67` |

> Signing is configured in the repo — no Xcode signing step needed unless
> Xcode reports the bundle ID is unavailable for your team (then see the
> bundle-ID note below). A free Apple ID re-signs every 7 days.

## Only if Xcode says the bundle ID is unavailable

1. Let Xcode pick a unique bundle ID (e.g. `com.<you>.nordicfleet`).
2. Firebase console → project `nordicfleet-11e67` → add iOS app with the new
   bundle ID → download the replacement `GoogleService-Info.plist` → replace
   `apps/mobile/ios/NordicFleet/GoogleService-Info.plist`.
3. Update `keychain-access-groups` in `NordicFleet.entitlements` to
   `$(AppIdentifierPrefix)<new-bundle-id>`. Rebuild. (Avoid if possible.)
