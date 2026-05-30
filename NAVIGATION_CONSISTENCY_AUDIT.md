# Navigation Consistency Audit

_2026-05-30, completion pass. Fixes the "it feels random what is shown on each
screen" feedback by making the bottom TabBar follow ONE documented policy
instead of each screen deciding ad hoc._

## The policy (one source of truth)

`apps/mobile/src/config/navTabs.js` is the single place that decides TabBar
visibility. The `TabBar` component consults `shouldShowTabBar(routeName)` and
draws nothing on a hidden route, so screens can render `<TabBar />` freely and
the bar self-governs.

Rule: **the bottom nav shows on every authenticated browse / view / detail /
edit screen** so the app reads as one connected product. It is hidden only
where it would clearly harm UX:

- **Auth + onboarding** - there is no app to navigate into yet.
- **Full-screen camera scanner** - the viewfinder owns the screen.
- **Heavy multi-step CREATE / entry flows** - these have an explicit Save and a
  Cancel (back), and a stray tab tap mid-entry would discard a lot of unsaved
  work. (Single-record EDIT screens DO show the bar, but guard unsaved
  changes - see below.)

## Before vs after

Previously these rendered `<TabBar />` ad hoc: Home, Profile, Messages,
SkiInfo (owner only), CoachDashboard, WaxTruck, WaxHistory, TestHistory.
Settings, MessageDetail, AthleteDetail, EditWaxLog, EditTestLog had **no** bar,
and SkiInfo **hid** it in the coach view - that is the inconsistency the user
felt. Now visibility is uniform per the matrix below.

## Screen-by-screen matrix

| Route | TabBar | Why |
| --- | :---: | --- |
| Home | shown | core browse |
| SkiInfo | shown | detail (now also in coach view, was hidden) |
| WaxHistory | shown | list |
| TestHistory | shown | list |
| EditWaxLog | shown | single-record edit + unsaved guard |
| EditTestLog | shown | single-record edit + unsaved guard |
| Messages | shown | core browse |
| MessageDetail | shown | detail (was missing) |
| Profile | shown | core browse |
| Settings | shown | browse (was missing) |
| CoachDashboard | shown | core browse (coaching mode) |
| AthleteDetail | shown | detail (was missing) |
| WaxTruck | shown | core browse (wax-truck mode) |
| newSki | hidden | multi-step create form (Save / Cancel) |
| WaxLog | hidden | multi-ski create form (Save / Cancel) |
| TestingLog | hidden | multi-ski create form (Save / Cancel) |
| ComposeAdvisory | hidden | structured composer (Save / Cancel) |
| WaxTestSetup | hidden | bracket setup flow |
| WaxTestRunner | hidden | head-to-head runner flow |
| ScanSki | hidden | full-screen camera |
| AuthLoading | hidden | pre-app |
| Welcome / Login / Signup / ForgotPassword | hidden | auth |
| RoleSelect | hidden | onboarding |

## Unsaved-changes protection on edit screens

EditWaxLog / EditTestLog show the bar and **autosave a local draft**
(`src/services/draftStore.js`) instead of a destructive "Discard changes?"
prompt: every edit is saved to an in-memory draft keyed by the log id, so
leaving via a tab tap (or back) preserves the work. Re-opening the screen
restores the draft and shows "Draft restored." with a Discard action; a
successful Save clears the draft. (Drafts are in-memory: they survive
unmount/remount within a session; persisting across app restarts via
AsyncStorage is a future upgrade.) The heavy CREATE flows keep the bar hidden,
which is the simpler guarantee for a longer multi-step entry.

## Mode awareness preserved

The TabBar still renders mode-specific tabs (personal: Fleet / Ski / Wax /
Test / Messages / Profile; coaching: Athletes / Profile; wax-truck: Tests /
Profile) and the coach mode switcher. The mode-switch crash fix is intact: the
stack reset still defers to `requestAnimationFrame` and there is NO
`LayoutAnimation` (guarded by a test).

## Tests

- `src/config/__tests__/navTabs.test.js`: the visible / hidden / unknown route
  policy.
- `src/components/ui/__tests__/TabBar.test.js`: TabBar self-hides on hidden
  routes (WaxLog, Login), still renders on a visible edit route (EditWaxLog),
  all existing mode + switch + no-LayoutAnimation tests still pass.
- Edit + Settings screen tests assert the bar is present.
