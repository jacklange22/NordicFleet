# Manual verification checklist

The data layer is verified end-to-end by `scripts/verify-flows.sh`, which
exercises Auth signup/signin, Firestore profile/ski/waxLog/testLog
create+read+update, and cross-session persistence using the same REST
APIs the React Native client uses. Run it any time with:

```
./scripts/verify-flows.sh
```

A passing run looks like the output committed in commit `Verify P2`.

The UI rendering above the data layer needs you (the human) to tap
through. The simulator is booted and the app is installed. To launch:

```
xcrun simctl launch booted com.NordicFleet.app
```

Walk through the six flows below. Each step has a clear pass/fail
criterion. If anything doesn't match the expected state, note it and
file a bug.

## Flow 1: Signup → Home (empty state)

1. App opens to the **Welcome** screen — NordicFleet logo, "Welcome"
   heading, red "Track now" button, "Already a member? Log in" link.
2. Tap **Track now**.
3. **Signup** screen loads. Three fields: Email, Password, Confirm
   Password.
4. Enter `e2e-ui-<your initials>-<timestamp>@nordicfleet.test`,
   `Test1234!`, `Test1234!`.
5. Tap **Sign up**.
6. ✅ **PASS**: lands on the Home screen with the empty-state message
   "No skis yet — tap the + to add your first."
7. (Optional) Check the Firebase console for project `nordicfleet-11e67`
   → Authentication → Users tab. New email is listed.
   Firestore Database → users/{uid} document exists with that email.

## Flow 2: Add ski → SkiInfo → Home

1. From Home, tap the **+** (newSki) icon in the footer.
2. **New Ski!** form appears.
3. Fill in:
   - Brand: Fischer (dropdown)
   - Model: Speedmax
   - Base: Plus
   - Technique: Classic (dropdown)
   - Type: cold (dropdown)
   - Build: World Cup
   - Grind: Universal
   - Length: 200
   - Name: Test Ski 1
   - Flex: 90
   - (Notes can stay empty.)
4. Tap **Save**.
5. ✅ **PASS**: navigates to **SkiInfo** screen showing "Test Ski 1" at
   the top and all field values.
6. Tap the home icon in the footer.
7. ✅ **PASS**: Home shows "Test Ski 1" in the list.

## Flow 3: Wax log creation

1. From Home, tap the wax-log icon in the footer.
2. **Waxing Log** screen.
3. Tap **Select Skis Waxed** → multi-select dropdown → tap "Test Ski 1"
   → tap **Done**.
4. Wax input panel appears for the ski. Since technique is Classic,
   you'll see binder, kick layers/wax, glide layers/waxes, notes.
5. Set kick layers to 1, kick wax "VR40", glide layers to 2, glide
   waxes "CH8" and "HF8", notes "test wax".
6. Tap **Save**.
7. ✅ **PASS**: navigates back to Home.
8. Tap "Test Ski 1" → SkiInfo → **Wax History** section.
9. ✅ **PASS**: shows one row with today's date and "CH8, HF8 + kick: VR40".

## Flow 4: Test log creation

1. From Home, tap the test-log icon (the notepad icon) in the footer.
2. **Testing Log** screen.
3. Snow → Choose one → "Old".
4. Surface → Choose one → "Hardpack".
5. **Select Skis Tested** → tap "Test Ski 1" → Done.
6. Temperature: -5. Humidity: 70.
7. Tests section: test input appears. Set glide wax "CH8", kick wax
   "VR40", glide rating 8, kick rating 7.
8. Tap **Save**.
9. ✅ **PASS**: routes back to Home.
10. Tap "Test Ski 1" → SkiInfo → **Test History**.
11. ✅ **PASS**: shows one row with today's date and "Glide 8 / Kick 7 @ -5°C".

## Flow 5: Profile edit

1. From Home, tap the round profile button (top-right of the header).
2. **Profile** screen. Email shown.
3. Tap **Edit** next to Weight (kg).
4. Modal appears with a text input.
5. Type `72`.
6. Tap **Save**.
7. ✅ **PASS**: modal closes, Weight field shows "72".

## Flow 6: Sign out → Sign in → data persists

1. Profile → red **Sign out** button at the bottom.
2. Confirm in the Alert.
3. ✅ **PASS**: routes back to Welcome.
4. Tap **Already a member? Log in**.
5. Enter the same email and password you used in Flow 1.
6. Tap **Login**.
7. ✅ **PASS**: lands on Home with "Test Ski 1" still in the list.
8. Tap "Test Ski 1" → SkiInfo → both Wax History and Test History rows
   are still there.

---

If any step fails, capture a screenshot via `xcrun simctl io booted
screenshot /tmp/<step>.png` and share it with the development thread.
