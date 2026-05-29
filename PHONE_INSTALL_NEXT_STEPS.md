# NordicFleet — Phone Install Next Steps

_Last updated: 2026-05-29. Short + exact. Do the Xcode steps in §6._

## 1. What this session completed

- Removed junk (`apps/mobile/.gitignore` + stray `apps/mobile/.vercel/` — both were untracked/ignored accidental Vercel cruft).
- Verified the gate: lint 0 errors, mobile 261 tests + core 334 tests pass, web build clean.
- iOS **simulator** build: **PASSED** (`** BUILD SUCCEEDED **`).
- Deployed the **web app** and the **marketing site** to Vercel (URLs below).
- Added two helper scripts (`scripts/build-ios-simulator.sh`, `scripts/open-ios-workspace.sh`).
- Confirmed Firebase project + rules are current (no rules change needed).

## 2. Web app — DEPLOYED ✅

**https://nordicfleet-web.vercel.app** (Vercel project `nordicfleet-web`)

All routes verified serving (HTTP 200): `/`, `/login`, `/signup`, `/home`, `/import`, `/wax-truck`, `/profile`. It auto-deploys when you push to `main`. (The local `apps/web` link was corrected to point at `nordicfleet-web`, not the orphaned `web` project.)

## 3. Marketing site — DEPLOYED ✅

**https://marketing-black-eight.vercel.app** (new Vercel project `marketing`)

All routes verified serving (HTTP 200): `/`, `/features`, `/coaches`, `/pricing`, `/about`, `/privacy`, `/terms`. The 6 `NEXT_PUBLIC_FIREBASE_*` env vars were set (same `nordicfleet-11e67` project) so email capture works. Custom domain (nordicfleet.com) not configured — optional, do later in the Vercel dashboard.

## 4. iOS simulator build — PASSED ✅

```bash
./scripts/build-ios-simulator.sh          # or "iPhone 16", etc.
```

## 5. Physical device signing — BLOCKED (needs you, ~2 min in Xcode)

Root cause: the Xcode project has **no `DEVELOPMENT_TEAM`** and there is **no Apple signing identity in your local keychain** (`security find-identity` → 0 valid identities). I can't set a real team — only you can, by signing into Xcode with your Apple ID. Everything else is ready:
- Bundle ID `com.NordicFleet.app` ✓
- `GoogleService-Info.plist` bundle ID matches (`com.NordicFleet.app`, project `nordicfleet-11e67`) ✓
- Keychain entitlement present (the earlier sign-in fix) ✓
- Automatic signing (Xcode default) ✓

## 6. Exact Xcode steps (do these)

1. Open the workspace (NOT the .xcodeproj):
   ```bash
   ./scripts/open-ios-workspace.sh
   # or: open apps/mobile/ios/NordicFleet.xcworkspace
   ```
2. In the left sidebar, select the **NordicFleet** project → **NordicFleet** target.
3. **Signing & Capabilities** tab.
4. Check **Automatically manage signing**.
5. **Team** dropdown → if empty, click **Add an Account…**, sign in with your Apple ID, then pick your **Personal Team** (free Apple ID works).
   - If Xcode shows a signing error, it usually offers a "Try Again"/"Fix" — let it.
6. Plug in your iPhone via USB; trust the computer if prompted.
7. On the iPhone: **Settings → Privacy & Security → Developer Mode → On**, then restart the phone.
8. In Xcode's top device selector, choose **your iPhone**.
9. Press **▶ Run**.
10. First launch: the app won't open — on the iPhone go **Settings → General → VPN & Device Management → [your Apple ID] → Trust**. Then tap the app again.

Note: a free Apple ID re-signs every 7 days (the app stops opening until you Run from Xcode again). For longer installs / TestFlight you need the paid Apple Developer Program ($99/yr).

## 7. If Xcode forces a bundle ID change

Only if Xcode says `com.NordicFleet.app` is unavailable for your team:
1. Let Xcode set a unique bundle ID (e.g. `com.<yourname>.nordicfleet`).
2. Firebase console → Project `nordicfleet-11e67` → Add app → iOS → enter the **new** bundle ID → download the replacement `GoogleService-Info.plist`.
3. Replace the file at `apps/mobile/ios/NordicFleet/GoogleService-Info.plist`.
4. Update `keychain-access-groups` in `apps/mobile/ios/NordicFleet/NordicFleet.entitlements` to the new id (`$(AppIdentifierPrefix)<new-bundle-id>`).
5. Rebuild. (Avoid this if you can — keeping `com.NordicFleet.app` means no Firebase changes.)

## 8. Real-phone smoke test (once it runs)

- [ ] Sign up (new account)
- [ ] Sign out
- [ ] Sign in (the keychain fix — must NOT show "Sign-in failed")
- [ ] Add a ski
- [ ] Scan a real base sticker (OCR — never field-tested; note accuracy)
- [ ] Log a wax (try a free-text wax not in the list)
- [ ] Log a test
- [ ] View the ski's history
- [ ] Export my data (Profile)
- [ ] (optional, throwaway account) Delete account

## 9. Honest status

The app is **ready to run on your iPhone except for the one human step**: selecting a signing Team in Xcode (§6). I did **not** and cannot install it on your phone — that requires you + Xcode + the physical device. The simulator build passes, both web surfaces are live, and the repo is pushed.
