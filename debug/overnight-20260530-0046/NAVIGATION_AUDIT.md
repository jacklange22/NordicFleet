# NordicFleet iOS — Navigation / Interaction Audit

Date: 2026-05-30
Scope: every interactive element across `apps/mobile/src/screens/*.js` plus
`apps/mobile/src/components/ui/TabBar.js`. UI primitives
(`StatCard`, `Card`, `ListItem`, `Pill`, `Button`, `Header`, `SectionHeader`,
`EmptyState`, `SkiSelector`) were read to determine which props make an element
tappable. This is a read-only audit — no code was modified.

Registered routes (from `apps/mobile/App.tsx`, lines 99-141):
`AuthLoading, Welcome, Signup, Login, ForgotPassword, Home, Profile, Settings,
TestingLog, WaxLog, SkiInfo, newSki, ScanSki, RoleSelect, CoachDashboard,
AthleteDetail, Messages, MessageDetail, ComposeAdvisory, WaxTruck,
WaxTestSetup, WaxTestRunner`.

---

## Summary verdict

- Screens audited: **22** (+ TabBar).
- Distinct interactive elements / element-families audited: **~120**.
- Navigation targets used in code: **20 distinct** — every one is a registered
  route. **Zero navigations to unregistered routes.**
- Silent no-ops (interactive-looking but no action): **0**.
- Destructive actions found: **6** — all gated with a confirmation
  (Alert with cancel + destructive, and delete-account additionally a reauth
  modal).
- External links: **3** (2 https legal links + 1 mailto) — all correct and
  non-suspicious.
- Disabled gating on submit/critical buttons: present everywhere it should be.

### Issues found: 1 (minor, label/accessibility only)

1. **coachDashboard.js:229-241** — the header gear icon has
   `accessibilityLabel="Settings"` but its `onPress` navigates to **`Profile`**,
   not `Settings`. The icon is `settings-outline`. This is a label/destination
   mismatch (VoiceOver announces "Settings", but it opens the Profile screen).
   It is **not** a broken-navigation bug — `Profile` is a valid route and the
   Profile screen itself has a working gear → `Settings`. Severity: low
   (cosmetic / a11y wording). See "Issues found" below for detail.

All six previously-reported items were re-confirmed and are in their expected
(correct) state — see "Previously-reported items" section.

---

## Previously-reported items — current state

| Item | Expected | Actual | Verdict |
|---|---|---|---|
| Home stat cards (Total skis / Last wax / Tests logged) | Non-tappable plain View | `StatCard` is a pure `View` with no `onPress` prop at all (StatCard.js:16-41); wrapped only in plain `<View style={styles.statsCell}>` (homescreen.js:239-251) | OK — not tappable |
| Profile stat cards (Skis / Wax logs / Tests) | Non-tappable | Plain `View` wrappers (profile.js:423-433); StatCard has no onPress | OK |
| CoachDashboard stat cards (Athletes / Total skis / Tests/wk) | Non-tappable | Plain `View` (coachDashboard.js:153-163) | OK |
| AthleteDetail stat cards (Skis / Last wax / Tests) | Non-tappable | Plain `View` (athleteDetail.js:190-200) | OK |
| SkiInfo stat cards (Times waxed / Tests logged) | Non-tappable | Plain `View` (skiInfo.js:364-378) | OK |
| Profile "Settings" gear → 'Settings' | navigate('Settings') | `onPress={() => navigation.navigate('Settings')}` (profile.js:392) | OK |
| Bottom nav label for newSki tab reads "Ski" | "Ski" not "Add" | `{key:'add', label:'Ski', ... route:'newSki'}` (TabBar.js:55) | OK — label is "Ski" |
| Mode switcher (My Fleet / Coaching / Wax Truck) | Present, only for coaches | Rendered when `isCoach` (TabBar.js:145-168); switches mode + `navigation.reset` to mode home (TabBar.js:116-133) | OK |
| Delete account two-step flow | Alert → reauth modal | Step 1 destructive Alert (settings.js:136-154) → step 2 password reauth modal (settings.js:162-209, 376-430) | OK |
| Read-only vs interactive chips under wax/test steps | ghost = read-only, outline/solid = tappable | ghost Pills render plain `View` (no onPress); selector Pills pass onPress. Confirmed in testinglog.js:90-105, waxinglog.js:175-190 (comment documents intent) | OK |

---

## Per-screen tables

Legend: **OK?** = Y (correct) / N (issue). Routes verified against the
registered list above.

### TabBar.js (rendered on Home, Profile, WaxLog, TestingLog, Messages, CoachDashboard, WaxTruck, SkiInfo)

| Element | Action / Destination | OK? | Notes |
|---|---|---|---|
| Tab buttons (Pressable, role="tab") L177-200 | `navigation.navigate(tab.route)` when not active | Y | All routes (Home, newSki, WaxLog, TestingLog, Messages, Profile, CoachDashboard, WaxTruck) registered. No-op when already active (intended). |
| ModeSegment "My Fleet" L150 | `switchMode('personal')` → reset to Home | Y | Accent `colors.red`. |
| ModeSegment "Coaching" L156 | `switchMode('coaching')` → reset to CoachDashboard | Y | `colors.coaching` exists (theme). |
| ModeSegment "Wax Truck" L162 | `switchMode('waxtruck')` → reset to WaxTruck | Y | `colors.waxtruck` exists. |
| newSki tab label | — | Y | Label string is "Ski" (L55). |

### homescreen.js

| Element | Action / Destination | OK? | Notes |
|---|---|---|---|
| Avatar (Pressable) L315 | navigate('Profile') | Y | aLabel "Open profile". |
| 3× StatCard | none | Y | Non-tappable by design. |
| SectionHeader "Filter/Hide" action L256 | toggles `filtersOpen` | Y | Label flips correctly. |
| FilterChips technique/type Pills L135-163 | toggle filter state | Y | In-screen filter, no nav. |
| Active-filter pills "{x} ×" L283-296 | clear that filter | Y | Label communicates removal. |
| SkiCard (Card onPress) L230 | navigate('SkiInfo', {skiId}) | Y | aLabel `Open {title}`. |
| EmptyState CTA "Add a ski" L348 | navigate('newSki') | Y | |
| Ghost pills on SkiCard (technique/type/grind) | none | Y | Read-only (no onPress). |

### profile.js

| Element | Action / Destination | OK? | Notes |
|---|---|---|---|
| Header gear (Pressable) L391 | navigate('Settings') | Y | aLabel "Settings" — correct here. |
| 3× StatCard | none | Y | Non-tappable. |
| Personal-info ListItems (Weight/Height/Team/Location) L441 | openEdit → modal | Y | "Edit" affordance. |
| Coaching `Switch` L474 | enableCoaching / disableCoaching | Y | `disabled={coachingBusy}`. **disableCoaching is destructive → confirmed (see Destructive section).** |
| "Add/Change coach" ListItem L516,564,579 | openCoachModal | Y | |
| "Remove coach" ListItem L528 | handleRemoveCoach | Y | **Destructive → Alert (see below).** |
| "Request pending → Cancel" ListItem L542 | handleCancelRequest | Y | **Destructive → Alert (see below).** |
| "Share my fleet" ListItem L597 | handleShareFleet | Y | Share sheet; subtitle shows "Preparing image…". |
| Edit modal Cancel/Save L641-657 | close / updateProfile | Y | |
| Coach modal Cancel/Save L701-719 | close / submitCoach | Y | Save `loading`, Cancel `disabled` while submitting; input `editable={!coachSubmitting}`. |

### settings.js

| Element | Action / Destination | OK? | Notes |
|---|---|---|---|
| "Change password" ListItem L223 | open pw modal | Y | |
| "Sign out" ListItem L234 | handleSignOut | Y | **Destructive → Alert (see below).** |
| "Export my data" ListItem L251 | handleExportData | Y | subtitle "Preparing export…". |
| "Privacy Policy" ListItem L260 | `Linking.openURL(${base}/privacy)` | Y | base = `NORDICFLEET_MARKETING_URL` or `https://nordicfleet.com`. /privacy returns 200 on marketing site. |
| "Terms of Service" ListItem L269 | `Linking.openURL(${base}/terms)` | Y | /terms returns 200. |
| "Report a problem" ListItem L277 | `Linking.openURL('mailto:support@nordicfleet.com?subject=...')` | Y | Correct mailto. |
| "Delete account" ListItem L299 | handleDeleteAccountTap | Y | **Destructive → 2-step Alert + reauth (see below).** |
| Pw modal Cancel/Update L345-368 | close / handlePasswordSubmit | Y | Update `loading`, Cancel `disabled` while submitting. |
| Delete modal Cancel/"Delete forever" L406-425 | close / submitDeleteAccount | Y | danger variant, `loading`, input `editable={!deleteSubmitting}`. |

### skiInfo.js

| Element | Action / Destination | OK? | Notes |
|---|---|---|---|
| Header share button (Pressable) L276 | handleShare | Y | `disabled={sharing}`; hidden in coach view (`!isCoachView`). |
| 2× StatCard | none | Y | Non-tappable. |
| Hero / history pills (ghost) & ListItems (no onPress) | none | Y | Read-only history rows. |
| TabBar | — | Y | Only rendered when `!isCoachView`. |

### newSki.js

| Element | Action / Destination | OK? | Notes |
|---|---|---|---|
| Header "Save" (Pressable) L145 | handleSubmit | Y | `disabled={!isValid || submitting}` + dimmed style. |
| "Scan the sticker" Card L168 | navigate('ScanSki') | Y | Only when `isOCRAvailable()`. |
| Brand Pills + "Other" L211-225 | select brand / toggle custom | Y | Form input. |
| ChipGroup Technique/Type L253,261 | set field | Y | Form input. |
| Bottom "Save ski" Button L333 | handleSubmit | Y | `disabled={!isValid}`, `loading`. |
| (on success) | replace('SkiInfo', {skiId}) | Y | |

### scanSki.js

| Element | Action / Destination | OK? | Notes |
|---|---|---|---|
| Header Back (Pressable) L249 | goBack | Y | |
| EmptyState "Add manually" CTA L269 (OCR unavailable) | replace('newSki') | Y | |
| "Take photo" Button L286 | launchCamera | Y | |
| "Choose from library" Button L295 | launchImageLibrary | Y | |
| "Retake" link L343 / "Try a different photo" L449 | handleRetake (→ idle) | Y | |
| ChipRow Technique/Type L383,393 | set field | Y | Form input. |
| "Save ski" Button L438 | handleSave | Y | `disabled={!isValid}`, `loading`. |
| (on success) | replace('SkiInfo', {skiId}) | Y | |

### waxinglog.js

| Element | Action / Destination | OK? | Notes |
|---|---|---|---|
| Header "Save" (Pressable) L428 | handleSave | Y | `disabled={!canSave || submitting}`. |
| EmptyState "Add a ski" CTA L459 | navigate('newSki') | Y | |
| SkiSelector chips / Select all / Clear L469-477 | toggle / selectAll / clearAll | Y | (SkiSelector.js wires all three.) |
| Ghost pills (technique/type) L178-189 | none | Y | Read-only — comment documents intent (L173). |
| Binder Pills L198 | setBinder | Y | Form input. |
| Stepper -/+ (kick/glide layers) L63-87 | onChange | Y | `disabled` at min/max bounds. |
| Accordion card header (Pressable) L159 | toggle expand | Y | Only in accordion mode (≥3 skis). |
| WaxPicker (kick/glide) | open picker | Y | |
| Bottom "Save wax log" Button L511 | handleSave | Y | `disabled={!canSave}`, `loading`. |
| (on success) | navigate('SkiInfo'\|'Home') | Y | Single ski → SkiInfo; multi → Home. |

### testinglog.js

| Element | Action / Destination | OK? | Notes |
|---|---|---|---|
| Header "Save" (Pressable) L299 | handleSubmit | Y | `disabled={!canSave || submitting}`. |
| EmptyState "Add a ski" CTA L329 | navigate('newSki') | Y | |
| Snow/Surface Pills L371,385 | togglePill | Y | Form input. |
| "Use current location" Pill L437 | captureLocation | Y | Label flips to "Locating…". |
| "Remove location" (Pressable) L412 | clearLocation | Y | |
| SkiSelector chips/actions L453 | toggle/selectAll/clearAll | Y | |
| RatingPicker dots 1-10 (Pressable) L59 | onChange(n) | Y | Form input. |
| Ghost pills (technique/type) L93-104 | none | Y | Read-only. |
| Bottom "Save test log" Button L488 | handleSubmit | Y | `disabled={!canSave}`, `loading`. |
| (on success) | navigate('Home') | Y | |

### coachDashboard.js

| Element | Action / Destination | OK? | Notes |
|---|---|---|---|
| Header gear (Pressable) L229 | navigate('Profile') | **N** | **aLabel="Settings" but goes to Profile.** See Issues. Route is valid; label/destination mismatch only. |
| 3× StatCard (Athletes / Total skis / Tests/wk) | none | Y | Non-tappable. ("—" placeholders for skis/tests are display-only.) |
| Pending request "Decline" Button L183 | handleRespond(id,false) | Y | `disabled={respondingId===id}`. |
| Pending request "Accept" Button L194 | handleRespond(id,true) | Y | `loading={respondingId===id}`. |
| AthleteCard (Card onPress) L39 | navigate('AthleteDetail', {athleteUid,…}) | Y | aLabel `Open {name}`. |
| EmptyState (no CTA) L259 | — | Y | Informational only. |

### athleteDetail.js

| Element | Action / Destination | OK? | Notes |
|---|---|---|---|
| Header "Send message" (Pressable) L242 | open msg modal | Y | aLabel "Send message". |
| 3× StatCard | none | Y | Non-tappable. |
| "Send a race-day plan" Card L203 | navigate('ComposeAdvisory', {athleteUid,athleteName}) | Y | |
| SkiRow (Card onPress) L39 | navigate('SkiInfo', {skiId, ownerUid:athleteUid}) | Y | Opens athlete's ski in coach view. |
| Attach-ski Pills in modal L318 | toggleMsgSki | Y | Form input. |
| Modal Cancel/Send L333-352 | close / submitMessage | Y | Cancel `disabled`, Send `loading` while submitting. |

### messages.js

| Element | Action / Destination | OK? | Notes |
|---|---|---|---|
| MessageRow (Card onPress) L51 | navigate('MessageDetail', {messageId}) | Y | aLabel `Open message: {subject}`. |
| EmptyState (no CTA) | — | Y | |

### messageDetail.js

| Element | Action / Destination | OK? | Notes |
|---|---|---|---|
| Attached-ski ListItem L143 | navigate('SkiInfo', {skiId}) when ski loaded, else `undefined` | Y | onPress only attached once ski is loaded — avoids a no-op tap. |
| AdvisoryView ski rec Card (RecCard) L299 | onOpenSki → navigate('SkiInfo') when ski loaded, else undefined | Y | Same loaded-guard pattern. Chevron only shown when `onPress` exists (L344). |
| ConditionTile / rolePill / ghost Pills | none | Y | Read-only display. |
| No back button shown | Header default back chevron | Y | `Header` auto-renders back when `canGoBack` (Header.js:44). |

### composeAdvisory.js

| Element | Action / Destination | OK? | Notes |
|---|---|---|---|
| Header Back (Pressable) L210 | goBack | Y | |
| Header "Send" (Pressable) L219 | handleSend | Y | `disabled={!isValid || submitting}` + dimmed. |
| Snow-type Pills L269 | setSnowType | Y | Form input. |
| "New snow" Switch L319 | setNewSnow | Y | |
| SkiPickerRow (Pressable) L417 | cycleSki (off→primary→backup→off) | Y | "Tap to cycle" label documents it; intentionally interactive. |
| Bottom "Send advisory" Button L389 | handleSend | Y | `disabled={!isValid}`, `loading`. |
| (on success) | goBack | Y | |

### waxTruck.js

| Element | Action / Destination | OK? | Notes |
|---|---|---|---|
| Header "New wax test" (Pressable) L116 | navigate('WaxTestSetup') | Y | |
| Test row (Pressable wrapping Card) L65 | navigate('WaxTestRunner', {testId}) | Y | aLabel `Open {name}`. |
| Status pill (View) | none | Y | Display-only. |
| EmptyState "New wax test" CTA L139 | navigate('WaxTestSetup') | Y | |
| ListFooter "New wax test" Button L153 | navigate('WaxTestSetup') | Y | |

### waxTestSetup.js

| Element | Action / Destination | OK? | Notes |
|---|---|---|---|
| Header "Create" (Pressable) L241 | handleCreate | Y | `disabled={!isValid || submitting}`. |
| Snow/Surface/Fleet Pills L312,330,352 | set field | Y | Form input. |
| Category chips (Pressable) L494 | onChange({category}) | Y | Layer category selector. |
| "Add layer" (Pressable) L456 | addLayer | Y | |
| "Remove layer" (Pressable) L535 | removeLayer | Y | Shown only when >1 layer. |
| Combination "trash" (Pressable) L435 | removeCombination | Y | Shown only when canRemove (>2). Note: removes one un-started combination from the in-progress form, not a persisted record — Alert not required. |
| "Add combination" Button L386 | addCombination | Y | `disabled={combinations.length >= fleetNum}`. |
| WaxPicker (per layer) L523 | open picker | Y | |
| Bottom "Create & generate bracket" Button L399 | handleCreate | Y | `disabled={!isValid}`, `loading`. |
| (on success) | replace('WaxTestRunner', {testId}) | Y | |

### waxTestRunner.js

| Element | Action / Destination | OK? | Notes |
|---|---|---|---|
| Error-state "Back" Button L268 | goBack | Y | |
| Arranger up/down arrows (Pressable) L400,413 | onMove | Y | `disabled` at first/last index. |
| "Start test" Button L430 | onStart → status running | Y | |
| CompetitorButton (Pressable) L485 | pickWinner | Y | aLabel `{label} wins`. |
| Performance "Save numbers" Button L351 | savePerf | Y | |
| "Send winner as advisory" Button L527 | onSendAdvisory → opens AthletePicker | Y | `disabled={athleteCount === 0}` with explanatory hint. |
| AthletePicker row (Pressable) L584 | sendToAthlete → navigate('ComposeAdvisory', {prefill}) | Y | |
| AthletePicker "Close" (Pressable) L572 | onClose | Y | |
| "Delete test" Button L367 | confirmDelete | Y | **Destructive → Alert (see below).** |
| BracketOverview slots | none | Y | Read-only. |

### roleSelect.js (registered as `RoleSelect`; component name OnboardingScreen)

| Element | Action / Destination | OK? | Notes |
|---|---|---|---|
| "Do you coach a team?" Switch L109 | setCoachesTeam | Y | |
| Coach-email Input L120 | setCoachEmail | Y | `editable={!submitting}`. |
| "Continue to my fleet" Button L139 | finish → replace('Home') | Y | `loading={submitting}`. |

### login.js

| Element | Action / Destination | OK? | Notes |
|---|---|---|---|
| "Forgot password?" Button L114 | navigate('ForgotPassword') | Y | |
| "Sign in" Button L126 | handleLogin → replace('Home') | Y | `loading={submitting}`. |
| "Create one" Button L136 | navigate('Signup') | Y | |

### signup.js

| Element | Action / Destination | OK? | Notes |
|---|---|---|---|
| "Sign up" Button L124 | handleSignup → replace('RoleSelect') | Y | `loading={submitting}`. |
| "Sign in" Button L134 | navigate('Login') | Y | |

### forgotPassword.js

| Element | Action / Destination | OK? | Notes |
|---|---|---|---|
| "Send reset link" Button L128 | handleSubmit | Y | `loading={submitting}`. |
| "Back to sign in" Button L92,139 | goBack or navigate('Login') | Y | Falls back to Login if no back history. |

### welcome.js

| Element | Action / Destination | OK? | Notes |
|---|---|---|---|
| "Get started" Button L51 | navigate('Signup') | Y | |
| "I already have an account" Button L61 | navigate('Login') | Y | |

### AuthLoadingScreen.js (no user-facing controls)

| Element | Action / Destination | OK? | Notes |
|---|---|---|---|
| Boot routing (effect) L25-82 | replace → Welcome / Home / CoachDashboard / WaxTruck | Y | All targets registered; 12s timeout falls through to Home. |

---

## Issues found

Exactly **one** issue, and it is a label/accessibility mismatch — not a broken
navigation, not a no-op, not a missing confirmation, not a bad URL.

### 1. coachDashboard header gear: accessibilityLabel says "Settings" but navigates to Profile

- File: `apps/mobile/src/screens/coachDashboard.js`, lines 229-241.
- Code:
  ```js
  right={
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Settings"          // L231
      onPress={() => navigation.navigate('Profile')}   // L232
      ...>
      <Ionicons name="settings-outline" ... />          // L235
    </Pressable>
  }
  ```
- Problem: VoiceOver announces "Settings", and the icon is the gear
  (`settings-outline`), but tapping it opens the **Profile** screen, not the
  **Settings** screen. (Settings is then reachable via the gear inside Profile.)
- Why it is low severity, not "broken navigation":
  - `Profile` is a registered route and the navigation succeeds.
  - For contrast, the equivalent gear on `profile.js:391` correctly labels and
    navigates to `Settings`, and the gear on `waxTruck.js`/`messages.js` headers
    are different actions. The coachDashboard gear is the odd one out in that its
    label implies Settings while it behaves as a Profile shortcut.
- Suggested fix (not applied): either change `accessibilityLabel` to
  `"Profile"` (if a Profile shortcut is intended), or change `onPress` to
  `navigation.navigate('Settings')` (if Settings was intended). Given coaches
  have no other path to their own Profile from this tab and the Profile screen
  hosts the Settings gear, relabeling to "Profile" is the lower-risk change.

No other issues:
- **Navigation to nonexistent routes:** none. All 20 distinct
  navigate/replace/reset targets are in the registered route list, as are all
  TabBar `route` values and the `MODE_HOME` reset targets (Home / CoachDashboard
  / WaxTruck).
- **Silent no-ops:** none. Every Pressable/Button/Card/ListItem/Pill with an
  interactive appearance has a handler. The only "conditionally inert" cases are
  intentional and correct: attached-ski rows in `messageDetail.js` (onPress is
  `undefined` until the ski document loads, L153-158 and L261) and tab buttons
  that no-op when already on that tab (TabBar.js:183).
- **Wrong labels:** none besides issue #1.
- **Wrong / suspicious URLs:** none (see External links below).
- **Missing disabled gating:** none. Every submit/save/create header action and
  primary button is gated (`disabled={!isValid|!canSave || submitting}` and/or
  `loading={submitting}`), and steppers/arrows/add-buttons are gated at their
  bounds.

---

## Destructive actions — confirmation check

All six destructive actions require an explicit confirmation before the
irreversible step. None fire immediately on tap.

| Action | File:line | Confirmation | Cancel + destructive styling |
|---|---|---|---|
| Delete account | settings.js:136-209 | **Two-step:** Alert "Delete your account?" (Cancel + destructive "Continue", L138-153) → password reauth Modal "This is permanent" requiring `reauthenticateWithCredential` before `deleteAccount()` (L162-209, modal L376-430) | Yes — Alert has `style:'cancel'` + `style:'destructive'`; modal "Delete forever" is `variant="danger"`, gated `loading`, input `editable={!deleteSubmitting}` |
| Sign out | settings.js:76-92 | Alert "Sign out?" before `signOut()` + reset to Welcome | Yes — Cancel `style:'cancel'`, "Sign out" `style:'destructive'` |
| Remove coach | profile.js:288-313 | Alert "Remove coach?" before `removeCoach(uid)` | Yes — Cancel + destructive "Remove" |
| Cancel coach request | profile.js:258-286 | Alert "Cancel request?" before `cancelRequest(id)` | Yes — "Keep" `style:'cancel'`, "Cancel request" `style:'destructive'` |
| Stop coaching (disable capability) | profile.js:333-371 | Alert "Stop coaching?" (spells out athletes unlinked) before `setCoachCapability(uid,false)` | Yes — Cancel + destructive "Stop coaching"; triggered from the coaching Switch's off path |
| Delete wax test | waxTestRunner.js:223-248 | Alert "Delete this test?" before `deleteWaxTest()` + goBack | Yes — Cancel + destructive "Delete" |

Notes:
- "Retire ski" — no retire/delete-ski control exists in any screen (skis are
  read with a `retired` filter in athleteDetail/composeAdvisory, but there is no
  UI action to retire a ski). Nothing to confirm; not a gap in the audited
  surface.
- `removeCombination` / `removeLayer` (waxTestSetup.js) and `clearLocation`
  (testinglog.js) operate on un-persisted, in-progress form state (a draft test
  being built, a not-yet-saved location) and are trivially reversible by
  re-adding — confirmation is not warranted and none is expected.

---

## External links (Linking.openURL)

All in `settings.js`; all correct and non-suspicious.

| Label | URL | File:line |
|---|---|---|
| Privacy Policy | `${base}/privacy` where `base = process.env.NORDICFLEET_MARKETING_URL ?? 'https://nordicfleet.com'` | settings.js:49-52, 260 |
| Terms of Service | `${base}/terms` (same base) | settings.js:269 |
| Report a problem | `mailto:support@nordicfleet.com?subject=NordicFleet%20issue%20report` | settings.js:277-282 |

- The default base is the app's own apex domain (`nordicfleet.com`); `/privacy`
  and `/terms` both return HTTP 200 on the project marketing site
  (per `web-marketing-http.txt`). No third-party, shortener, or look-alike host.
- The mailto target is the project's own support address with a fixed,
  benign subject. Both `openURL` calls are wrapped in `.catch(() => {})`.

---

## Methodology / what "tappable" means here

Determined from the primitives:
- `StatCard` (StatCard.js): a plain `View` with **no `onPress` prop** — can
  never be tappable. Every stat card in the app is therefore non-interactive.
- `Card` (Card.js): renders a `Pressable` only when `onPress` is passed, else a
  `View`.
- `ListItem` (ListItem.js): `Pressable` only when `onPress` passed; chevron
  shows when `onPress && !right` unless `chevron` is set explicitly.
- `Pill` (Pill.js): `Pressable` only when `onPress` passed; otherwise a plain
  `View` — this is what makes "ghost" attribute pills read-only and selector
  pills interactive.
- `Button` (Button.js): always a `Pressable`; `disabled` and `loading` both
  collapse into `isDisabled` which sets `disabled` on the Pressable and dims it.
- `Header` (Header.js): auto-renders a back chevron when `canGoBack()`; `left`/
  `right` are caller-supplied.

Every screen's interactive elements were traced to a concrete handler and, where
the handler navigates, the destination string was checked against the registered
route list and the full set was cross-verified via grep
(`navigation.(navigate|replace|reset|push)` + TabBar `route:` + `MODE_HOME`).
