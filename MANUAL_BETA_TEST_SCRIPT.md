# NordicFleet — Manual Beta Test Script (operator)

For **you** (developer/operator) to run before inviting the 5 beta users.
This is the human pass the automated suite can't do. Budget ~60–90 minutes
across both platforms. Detailed per-screen expectations for the older flows
live in `MANUAL_VERIFICATION.md`; this script is the beta superset and adds
the never-human-tested flows (Wax Truck, web data export/delete, coach
messaging end-to-end) flagged High/Med risk in `BETA_READINESS_REPORT.md`.

Goal: confirm the core loop works for a real person on a real client, and
catch anything embarrassing before strangers see it.

## 0. Setup

- **Deploy first.** Make sure the latest web build is live (see
  `DEPLOYMENT_READINESS.md`) — the Wax Truck pages, geolocation, and
  data-export/delete from recent sessions are not on the deployed URL until
  you redeploy.
- **Test accounts** (use a domain you control, e.g. `@nordicfleet.test`):
  - `op-athlete@…` — primary athlete.
  - `op-coach@…` — coach.
  - `op-throwaway@…` — for the destructive delete-account test.
- iOS: build/install on the booted simulator **and**, if possible, one real
  device (`npm run ios` / TestFlight).
- Have the Firebase console open (Auth → Users, Firestore → data) to
  confirm writes land.

## 1. iOS smoke (simulator + one real device if possible)

- [ ] Cold launch → Welcome renders (no red box).
- [ ] **Sign up** `op-athlete` → answers "coach a team?" → lands on Home.
- [ ] Confirm in Firebase: `users/{uid}` doc created.
- [ ] **Add 5 skis** (vary technique/type). Each lands in the fleet list.
- [ ] **Log a wax** on one ski — include a **free-text wax** not in the
      dictionary; confirm it saves.
- [ ] **Log a test** with conditions + ratings. (If you wired geolocation,
      confirm the permission prompt.)
- [ ] **Ski detail** shows the wax + test history you just created.
- [ ] **Sign out** → **sign in** again (this is the keychain-fix flow —
      must NOT show "Sign-in failed"). Lands on Home.
- [ ] **Export my data** (Profile) → share sheet → open the JSON, confirm
      your skis/logs are present and there are **no surprises** (it's the
      user's data, but eyeball it).

## 2. Web smoke (deployed URL, the least-tested client)

- [ ] **Sign up** a fresh athlete → Home.
- [ ] **Add a ski** via the form.
- [ ] **Import**: paste a small spreadsheet (3–5 rows) → preview → fix a
      column mapping → save. Confirm rows land and section/technique
      inheritance survives the re-map.
- [ ] **Log wax** + **log test** (try "Use my location" on the test).
- [ ] **Ski detail/history** renders.
- [ ] Force a render error in dev (temporary `throw` in a screen) and
      confirm the **error.js recovery UI** appears instead of a blank page;
      remove the throw. (Optional but proves observability.)
- [ ] **Export my data** → JSON downloads.
- [ ] **Delete account** with `op-throwaway` → confirm it's gone from Auth
      + Firestore.

## 3. Coach ↔ athlete pairing (two accounts, BOTH platforms)

- [ ] As `op-athlete`: Profile → add coach by `op-coach`'s email (or the
      coach-request flow). 
- [ ] As `op-coach`: enable **Coaching mode**; accept the request if
      pending; the athlete appears in the dashboard.
- [ ] Coach opens the athlete → sees their fleet (read-only).
- [ ] Coach **sends a message / advisory** (iOS has the advisory composer;
      web has messaging).
- [ ] As `op-athlete`: the **unread badge** appears; open and read it.
- [ ] As `op-coach`: **disable** coaching → confirm you snap back to
      personal and the athlete is unlinked (athlete's `coachId` cleared).

## 4. Wax Truck (newest, highest-risk — run end to end on BOTH platforms)

- [ ] In Wax Truck mode, **create a test**: name it, set fleet size, add
      3–5 wax combinations using the category selector. Type at least one
      **wax/structure that exists nowhere in the dictionary** — it must be
      accepted (never blocked).
- [ ] Confirm the **bracket generates** (byes handled for odd counts).
- [ ] **Arrange** (reorder) seeds.
- [ ] **Run** it: pick winners head-to-head until a champion is set.
- [ ] Enter a couple of **performance numbers**; save.
- [ ] Reopen the test → state persisted (status, winner, numbers).
- [ ] (iOS) From results, **send winner as advisory** to a linked athlete.

## 5. Data export / delete (compliance)

- [ ] Export on iOS and web both produce a JSON file.
- [ ] Delete account removes Auth user + Firestore docs (verify in console).
- [ ] Privacy/Terms links in Profile open the marketing pages.

## What to capture

- Screenshots/recordings of: empty Home, a filled ski detail, the Wax
  Truck bracket mid-run + results, the coach dashboard, an error recovery
  screen. (Simulator: `xcrun simctl io booted screenshot <name>.png`.)
- A short screen recording of the full add-ski → log-wax → log-test → ski
  detail loop on each platform. This is your "it actually works" artifact.

## Bugs to log immediately (stop-the-beta class)

- Sign-in/sign-up fails on either platform.
- A write doesn't persist (not in Firebase after the action).
- A coach can see an athlete they're **not** linked to (security).
- Wax Truck loses a test or can't reach a winner.
- App crashes / white-screens with no recovery.
- Data export leaks another user's data, or delete leaves data behind.

Log each as: platform · flow · steps · expected · actual · screenshot.
Anything in the stop-the-beta list blocks inviting users until fixed.
