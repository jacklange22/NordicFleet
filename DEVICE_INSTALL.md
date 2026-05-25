# NordicFleet — Device install guide (free Apple ID path)

Goal: get the app running on your iPhone in about 15 minutes without
paying the $99/year Apple Developer Program fee. The free path
requires you to re-sign the app weekly (it expires after 7 days), but
everything except push notifications works.

If you eventually want to share the build with friends or submit to
the App Store, you'll need a paid Apple Developer account — but that's
a later step.

---

## Prerequisites

- **macOS** with **Xcode 26.5** installed (`xcodebuild -version` to
  confirm).
- An **Apple ID** — any normal personal account works. You do not need
  to enroll in the Developer Program.
- A **USB-C / Lightning cable** to connect your iPhone.
- The repo cloned locally, dependencies installed:
  ```bash
  cd ~/NordicFleet
  npm install
  PATH="/opt/homebrew/opt/ruby@3.3/bin:$PATH" \
    LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 \
    bundle exec pod install --project-directory=ios
  ```
  (the `PATH` + `LANG` prefixes work around CocoaPods + system-ruby
  issues on macOS 15 — they're already encoded in
  `MORNING_REPORT.md` if you want context.)

## Step 1 — Plug in your iPhone and trust the computer

1. Connect the iPhone with a USB cable.
2. The phone prompts **"Trust This Computer?"** Tap **Trust** and
   enter your passcode.
3. On the Mac, open Xcode at least once and accept any license / first
   launch prompts.

## Step 2 — Open the workspace in Xcode

```bash
open ios/NordicFleet.xcworkspace
```

**Open the `.xcworkspace`, not the `.xcodeproj`.** The workspace
includes Pods; the project alone won't build.

## Step 3 — Pick your iPhone as the destination

Top of the Xcode window, next to the play button, there's a device
picker. By default it shows a simulator (e.g. "iPhone 17 Pro"). Click
it and pick your physical iPhone (it'll be listed under "iOS Device").

If the iPhone doesn't show up:
- Make sure the cable is data-capable (not charge-only).
- On the iPhone: Settings → Developer mode → On (iOS 16+ requires
  enabling Developer Mode the first time you connect to Xcode).
- Reconnect the cable. The iPhone should reappear in the picker.

## Step 4 — Set the signing team to your Apple ID

1. In the Xcode left sidebar, click the blue **NordicFleet** project
   icon (top of the tree).
2. In the editor that appears, pick the **NordicFleet** target (left
   pane) → **Signing & Capabilities** tab.
3. Check **Automatically manage signing**.
4. **Team:** click the dropdown. If your Apple ID isn't listed, click
   **Add Account…**, sign in with your Apple ID, then come back.
   Pick **"Your Name (Personal Team)"**.

## Step 5 — Pick a unique Bundle Identifier (only if Xcode complains)

The current Bundle Identifier is `com.NordicFleet.app`. If Xcode shows
a red warning like _"Failed to register bundle identifier"_ or
_"Cannot create a iOS App Development provisioning profile"_, somebody
else has already claimed that ID on Apple's servers. Change it:

1. In the Bundle Identifier field, replace `com.NordicFleet.app` with
   something unique that includes your name or initials, e.g.
   `com.yourname.nordicfleet` or `dev.jack.nordicfleet`.
2. Xcode automatically regenerates the provisioning profile under
   your team.

You can also do this from the command line if you prefer to script
it later:
```bash
sed -i '' 's/com\.NordicFleet\.app/com.yourname.nordicfleet/g' \
  ios/NordicFleet.xcodeproj/project.pbxproj
```

## Step 6 — Build and install

1. Make sure your iPhone is unlocked and on the home screen.
2. Press **⌘R** (or click the play arrow). Xcode compiles for arm64
   device, signs with your Personal Team profile, copies to the
   iPhone, and tries to launch.

First build takes ~5 minutes (Pods + native code). Subsequent
incremental builds are seconds.

## Step 7 — Trust the developer profile on the iPhone

The first time you install an app signed by a free Personal Team,
iOS blocks it for security. Unblock it:

1. On the iPhone: **Settings → General → VPN & Device Management**.
2. Under **Developer App**, tap your Apple ID.
3. Tap **Trust "your.email@example.com"** → confirm.

Now go to the home screen and tap the NordicFleet icon. The app
launches.

## Step 8 — Sanity-check the new features

Walk through these four flows (they cover the bug fixes + new
features from the latest session):

1. **Forgot password.** Sign-in screen → tap "Forgot password?" →
   enter your email → tap Send reset link. Confirmation state appears;
   check that the reset email actually lands in your inbox.
2. **Add a coach** (bug from last session). Profile → Coach section →
   "Add a coach" → modal opens (the regression check: if nothing
   happens on tap, the wiring broke again). Type a non-existent
   email → save → red inline error.
3. **Share a single ski.** SkiInfo of any ski → share-outline icon in
   the top right → iOS share sheet → pick any sink → verify the image
   landed.
4. **Delete account** — use a throwaway email. Profile → Danger zone
   → Delete account → confirm Alert → reauth modal → Delete. Toast
   "Account deleted" → routes to Welcome. Try to sign in again — it
   fails.

The full walkthrough is in `MANUAL_VERIFICATION.md`.

## Caveats of the free Apple ID path

- **App expires after 7 days.** You'll see "Untrusted Developer" on
  launch around day 7. Re-connect to Xcode and press ⌘R again to
  re-sign. The app's data persists across re-signings (it lives in
  Firestore + iOS Keychain).
- **Max 3 apps signed at once.** Personal Team accounts have a 3-app
  limit. Delete an old sideloaded app before installing a fourth.
- **No push notifications.** Apple disables APNs for free signing.
  Not relevant for NordicFleet today (we don't send pushes).
- **No TestFlight or App Store distribution.** That's the $99/year
  Developer Program tier.

## Troubleshooting

### "Could not launch NordicFleet" on the iPhone
The developer profile got revoked or wasn't trusted yet. Repeat
**Step 7** (Settings → VPN & Device Management → Trust).

### "Codesign failed" during build
Usually means the keychain is confused about which signing
certificate to use. Open **Keychain Access** → "login" keychain →
delete every certificate starting with "Apple Development:" or "iPhone
Developer:" → in Xcode, close the project, reopen the workspace.
Xcode re-generates the cert on the next build.

### "No provisioning profile matches" / red profile warning
- Check that **Automatically manage signing** is still checked.
- Check that **Team** is set (the dropdown can blank itself after a
  Xcode update).
- Make sure the iPhone is plugged in and unlocked — Xcode can't
  request a profile from Apple without a registered device.

### "Sandbox: bash deny" / build script weirdness
This is the `react-native-vector-icons` font-copy script on stricter
sandbox modes. Quit Xcode, run a clean build from the CLI:
```bash
xcodebuild -workspace ios/NordicFleet.xcworkspace \
  -scheme NordicFleet -configuration Debug \
  -destination 'generic/platform=iOS' clean build
```
then open Xcode and ⌘R again.

### Build succeeds but the iPhone shows a blank red error screen
Metro packager isn't reachable from the device. Either:
- Run `npx react-native start` on the Mac BEFORE you press ⌘R, and
  make sure the Mac and iPhone are on the same Wi-Fi network, OR
- Build a **Release** configuration instead (Product → Scheme →
  Edit Scheme → Run → Build Configuration → Release). Release builds
  bundle the JS into the .app so Metro isn't needed.

### Persistent "Untrusted Enterprise Developer" prompts
You're hitting the 7-day expiry. There's no free workaround; you
either re-sign weekly via Xcode or pay for the Developer Program.

---

## Once the app is on your iPhone

You're done with the install. Use the app normally — all your data
syncs to Firestore. Sign in with the same email/password from any
device (simulator, another phone) to see the same fleet.

Refer back to `MORNING_REPORT.md` for what each session built, and
`LAUNCH_READINESS.md` for what's verified vs. what's still owed
before sharing the app with anyone else.
