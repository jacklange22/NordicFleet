# Manual UI verification checklist

The data layer is verified end-to-end by two automated scripts:

| Script | What it covers | Last run |
|---|---|---|
| `scripts/verify-flows.sh` | Happy-path REST round-trip of signup → ski → wax → test → profile-edit → sign-out / sign-in. | Re-run any time. |
| `scripts/verify-data-integrity.sh` | 22 checks: CRUD edge cases, soft / hard delete, every security-rule positive & negative path. | See `scripts/verify-data-integrity.log`. **22/22 pass.** |
| `scripts/verify-coach-pairing.sh` | 14 checks: full coach pair / unlink lifecycle, error paths for non-existent / non-coach emails. | See `scripts/verify-coach-pairing.log`. **14/14 pass.** |

The UI rendering above the data layer needs you (the human) to tap
through. Reliable programmatic taps on the simulator aren't available
here, so use this checklist on the booted simulator.

## Prerequisites

1. The latest design is built and installed on the simulator. If you
   haven't rebuilt since the Polish A1 commit:
   ```bash
   npm run ios
   ```
2. iOS Settings → Passwords → AutoFill Passwords → **on** (so you can
   verify the autofill flow in Flow 2).
3. The previous test user is signed out. If unsure, run:
   ```bash
   xcrun simctl uninstall booted com.NordicFleet.app
   npm run ios
   ```
   to start from a clean install.

Optional: screenshots of any step you want to capture go to
`verification-screenshots/<step>.png` (gitignored). Use:
```bash
xcrun simctl io booted screenshot verification-screenshots/<name>.png
```

---

## Flow 1: Signup → RoleSelect → Home

1. App opens to the **Welcome** screen.
   - NordicFleet logo, large "NordicFleet" title, subtitle ("Track and
     manage your nordic skis like a pro team.").
   - Three feature bullets with red-tinted icon badges.
   - Red "Get started" primary button at the bottom, "I already have
     an account" ghost link below it.
2. Tap **Get started**.
3. **Sign up** screen loads with floating-label inputs for Email,
   Password, Confirm Password.
4. Enter `e2e-ui-<your initials>-<timestamp>@nordicfleet.test`, a
   strong password, and confirm.
5. Tap **Sign up**.
6. **Role select** appears. Two large tappable cards: Athlete and
   Coach. Tap **Athlete**. The card border turns red and a
   checkmark-circle shows in the corner.
7. A "Link a coach (optional)" Input appears beneath. Leave it blank
   for this flow.
8. Tap **Continue**.
9. ✅ **PASS**: Lands on the **Home** dashboard. Header shows "Welcome
   back" + an Avatar. Three StatCards: Total skis = 0, Last wax = —,
   Tests logged = 0. The empty state below reads "No skis in your
   fleet yet" with a red "Add a ski" button.

---

## Flow 2: Sign in autofill (new in this session)

1. From Home, tap the **Profile** tab in the bottom TabBar.
2. Scroll to the bottom of Profile, tap the red **Sign out** ListItem.
   Confirm the alert.
3. Welcome screen. Tap **I already have an account**.
4. **Sign in** screen. Tap the **Email** field.
   - ✅ **PASS**: iOS keyboard's QuickType bar shows the saved email
     from Flow 1 (only after you saved it in Settings during signup).
5. Tap the **Password** field.
   - ✅ **PASS**: iOS offers to autofill the saved password (Face ID
     prompt on a real device; on the simulator, just tap the suggestion).
6. ✅ **PASS**: Tap **Sign in** → lands on Home with the same Avatar.

Notes:
- The Forgot password? link below the password field navigates to a
  **Reset password** screen. Try entering a non-existent email — you
  should see "No account found with that email" inline. Entering a
  valid email (use the one from Flow 1) shows the green check
  confirmation screen.

---

## Flow 3: Add a ski

1. Home → tap **+ Add ski** in the TabBar (or the Add-a-ski EmptyState
   CTA if the fleet is empty).
2. **Add ski** screen with the new sectioned form (Identity / Specs /
   Setup / Notes) and a "Save" right action in the Header (greyed out
   until valid).
3. Identity:
   - Ski name: `Test Ski 1`.
   - Brand: tap the **Fischer** pill.
   - Model: `Speedmax`.
4. Specs:
   - Technique pill: **Classic**.
   - Type pill: **Cold**.
   - Length: `200`. Flex: `90`.
5. Setup: Base `Plus`, Build `World Cup`, Grind `Universal`.
6. Tap the bottom **Save ski** button (or the right-side Save in the
   Header).
7. ✅ **PASS**: A green "Ski added" toast slides in from the top, and
   the screen transitions to **SkiInfo** for the new ski.

---

## Flow 4: SkiInfo hero detail

1. From the SkiInfo screen reached in Flow 3:
   - Header: back chevron + ski name.
   - Hero card: large ski name, technique + type outline pills, brand
     ghost pill, then a 3-column Flex / Length / Grind mini-stat row.
   - Two StatCards: "Times waxed" = 0, "Tests logged" = 0.
   - Wax history section: empty card "No wax logs yet".
   - Test history section: empty card "No tests yet".
   - Notes section: "No notes yet".
2. Tap the back chevron → return to Home → the new ski card is in the
   fleet list with a red accent bar on the left.

---

## Flow 5: Log a wax

1. Home → **Wax** tab.
2. Step 1 card "Select skis" — tap the pill for **Test Ski 1**. It
   turns solid red.
3. Step 2: a per-ski card appears with the ski name + technique pill.
   - Binder pill row: tap **VG Swix** (or another).
   - Kick layers stepper: leave at 1. Kick wax: `VR40`.
   - Glide layers stepper: set to 2. Glide layer 1: `CH8`. Glide layer
     2: `HF8`.
4. Notes: `test wax`.
5. Tap **Save wax log** (or Save in the Header).
6. ✅ **PASS**: Green "Wax logged" toast, returns to Home.
7. Tap the ski card → SkiInfo → "Times waxed" StatCard is now 1, and a
   ListItem appears under Wax history with today's date + "CH8, HF8 ·
   Kick: VR40 · Binder: VG Swix".

---

## Flow 6: Log a test

1. Home → **Test** tab.
2. Conditions card: temperature `-5`, humidity `70`, snow pill
   **Old**, surface pill **Hardpack**.
3. Select skis: tap **Test Ski 1**.
4. Ratings card appears: drag through the 1–10 numbered pills for
   Glide (set to 8) and Kick (set to 7). Selected number lights red,
   the big number in the row header echoes the value.
5. Notes: `test ride`.
6. Tap **Save test log**.
7. ✅ **PASS**: Green "Test logged" toast, returns to Home.
8. SkiInfo → "Tests logged" is now 1, Test history shows the new row
   with a red rating badge.

---

## Flow 7: Profile edit + change password

1. Profile tab.
2. Hero shows Avatar (initials or photo), name, email. The three
   StatCards row: Skis = 1, Wax logs = 1, Tests = 1.
3. Personal info Card with ListItems for Weight / Height / Team /
   Location, each with an "Edit" right action.
4. Tap the **Weight (kg)** row.
5. Modal: floating-label Input, type `72`, tap **Save**.
6. ✅ **PASS**: Modal closes, row shows "72 kg", green "Profile
   updated" toast slides in.
7. Account section → **Change password** row → opens the reauth modal
   with two password Inputs.
   - The "Current password" field is keychain-aware (autofills the
     existing password on real devices).
   - The "New password" field offers strong-password generation in
     real iOS (passwordRules attribute).
8. Optional: walk through a password change end-to-end and verify
   sign-out / sign-in still works with the new one.

---

## Flow 8: Coach flow

This needs two separate accounts, easier on the simulator if you can
reset the keychain between tries (`xcrun simctl uninstall booted
com.NordicFleet.app && npm run ios`).

### 8a. Coach side
1. Welcome → Get started → Sign up with `coach-ui-<ts>@nordicfleet.test`
   + password.
2. RoleSelect → tap **Coach** → Continue.
3. ✅ **PASS**: Lands on **My athletes** dashboard. EmptyState:
   "No athletes yet — share your account email…".
4. Sign out from Profile → Welcome.

### 8b. Athlete side
1. Sign up `athlete-ui-<ts>@nordicfleet.test`.
2. RoleSelect → Athlete → in the coach-email input, type the coach
   email from step 8a.1 → Continue.
3. ✅ **PASS**: Lands on Home with the regular athlete TabBar.

### 8c. Coach sees the new athlete
1. Sign out, sign in as the coach.
2. ✅ **PASS**: My athletes dashboard now shows one athlete card with
   the athlete's email + Avatar.
3. Tap the athlete card → **AthleteDetail** opens with the athlete's
   name in the header, an Avatar in the header right slot, "Coach
   view" subtitle, and an empty fleet state if the athlete hasn't
   added skis yet.

---

## Flow 9: Add a coach (the bug from last session, now fixed)

1. Sign in as an athlete who has NO coach linked.
2. Profile tab.
3. Scroll to the **Coach** section. The Card shows "Add a coach" with a
   plus icon.
4. Tap **Add a coach**.
   - ✅ **PASS**: a modal opens with title "Add a coach", subtitle,
     a Coach email Input, and Cancel + Save Buttons.
   - **REGRESSION INDICATOR**: if nothing happens on tap, the
     onPress wiring broke again — re-check `openCoachModal` in
     `src/screens/profile.js`.
5. Type a coach email that doesn't exist → tap **Save**.
   - ✅ **PASS**: red inline error "No coach account found with that
     email. Make sure your coach has signed up first."
6. Type a valid coach email (you'll need a real coach account in
   another session) → tap **Save**.
   - ✅ **PASS**: modal closes, a green "Coach added" toast slides in,
     the Coach section now shows the coach's Avatar + email and a
     red "Change" right-action.
7. The Card below shows a destructive **Remove coach** ListItem.
   Tap it → confirm in the Alert → the coachId is cleared and the
   "Add a coach" state returns.

## Flow 10: Delete account (App Store 5.1.1(v) compliance)

This is destructive; use a throwaway test account.

1. Sign up `del-ui-<ts>@nordicfleet.test`, add a couple of skis, log
   one wax and one test so subcollections have data.
2. Profile tab → scroll to the bottom.
3. ✅ **PASS**: a new **Danger zone** SectionHeader is visible.
   Below it: a red **Delete account** ListItem with "Permanently
   removes all your data" subtitle and a trash icon.
4. Tap **Delete account**.
   - ✅ **PASS**: Native Alert: "Delete your account? This permanently
     removes all your skis, wax logs, test logs, and profile data.
     This cannot be undone." with Cancel + "I want to delete" buttons.
5. Tap **I want to delete**.
   - ✅ **PASS**: the confirm modal opens with a password Input and
     a red Delete Button.
6. Type a wrong password → tap Delete.
   - ✅ **PASS**: red inline error "Wrong password".
7. Type the correct password → tap Delete.
   - ✅ **PASS**: green "Account deleted" toast, app routes back to
     Welcome.
8. Try to sign in with the same email/password.
   - ✅ **PASS**: "Wrong email or password" — auth user was deleted.
9. Optional: Firebase console → Authentication → Users → confirm the
   email is gone. Firestore → users/{the deleted uid} → also gone.

## Flow 11: Share a single ski

1. Sign in to any athlete account with at least one ski.
2. Home → tap a ski card → SkiInfo loads.
3. ✅ **PASS**: top-right of the Header is a `share-outline` icon
   (only visible when you own the ski; hidden in coach view).
4. Tap **Share ski**.
   - ✅ **PASS**: iOS share sheet slides up with a preview of the
     1080×1080 share card. The card shows: NordicFleet header, large
     ski name, brand/model subhead, 3×2 specs grid, "Last wax
     sessions" with up to 5 rows, "Last test sessions" with up to 5
     rows, "Tracked with NordicFleet" footer.
5. Pick Photos or Messages or Mail or save-to-files — any sink works.
6. Verify the image landed in the destination cleanly.

## Flow 12: Share my fleet

1. Athlete Profile tab.
2. In the **Account** section there's a new ListItem **Share my fleet**
   with a share-outline icon.
3. Tap it.
   - ✅ **PASS**: share sheet slides up with a multi-row card showing
     athlete name, ski/wax-log/test counts, and one row per ski
     with technique-tinted accent bars + length on the right.
4. Pick any sink and verify the image.

---

## What to do if anything fails

1. Capture a screenshot: `xcrun simctl io booted screenshot
   verification-screenshots/<step>-fail.png`.
2. Run the matching data-layer script to confirm whether the issue is
   UI-only or also at the data layer:
   - `./scripts/verify-flows.sh` for the basic CRUD path.
   - `./scripts/verify-data-integrity.sh` for edge cases & rules.
   - `./scripts/verify-coach-pairing.sh` for the coach flow.
3. Note the failure and step number in this file or as a GitHub issue.
