# Coach Collaboration Pass Report (2026-05-30)

Build tag: **`2026-05-30 · coach-collab-pass-1`**
Branch: **`claude-rewrite`** (pushed; NOT merged to main).

## 1. What shipped

The coach collaboration workflow, end to end and rules-tested:

- **Athlete-controlled coach permissions.** Profile -> My coach: View only /
  Can suggest (Edit shown as "coming soon", not enabled). Default view. Stored
  as `coachPermission` on the athlete's own user doc, so a coach can never
  raise their own access. removeCoach clears it.
- **Fleet suggestions.** A coach with comment permission taps "Suggest a
  change" on an athlete's ski; the athlete sees it in a Coach suggestions
  inbox and Accepts (applied immediately) or Rejects. The coach never writes
  the athlete's data directly - accept applies through the athlete's own
  owner-write update service.
- **Edit-screen draft autosave.** The destructive "Discard changes?" prompt is
  replaced by local draft autosave: leaving an edit screen via a tab keeps the
  work, re-opening restores it ("Draft restored." + Discard), Save clears it.
- **Polished invite copy** ("Your coach would like to use NordicFleet to help
  you organize your skis, wax notes, and testing.").
- **Sticker dataset structure** (`data/sticker-examples/`, Salomon/Fischer/
  Madshus) with capture guidelines + a label schema.
- **Rules deployment status** documented (`RULES_DEPLOYMENT_STATUS.md`).

## 2. What was deferred

- **Athlete invite ACCEPTANCE flow** (Phase 2): the web `?invite=` signup
  handling + an accept screen + the secure get-by-token rule. The coach side
  (create/copy/email-draft/revoke) shipped earlier; the athlete redemption is
  the remaining half. Designed (see backlog) but not built this pass.
- **Public sharing** (Phase 6): unchanged, still design-only.
- **Web parity** for the new coach features.

## 3. Rules tests + deployment status

- `npm run test:rules` = **27/27** green (3 new coach-permission boundary
  tests, 6 new fleetSuggestions tests, on top of the existing 18).
- Firebase CLI authenticated; default project `nordicfleet-11e67`.

## 4. Do Firestore rules need deploying? YES (one new collection)

The agent did NOT deploy (production action). Tested but undeployed:

- `fleetSuggestions` (NEW this pass) - suggestion create/accept/reject denied
  until deployed.
- `athleteInvites` (from the prior pass) - invite writes denied until deployed.

`coachPermission` needs NO deploy (it rides existing user-doc rules). Run:

```
firebase deploy --only firestore:rules
```

Both are additive and safe-closed until then (no leak). See
`RULES_DEPLOYMENT_STATUS.md`.

## 5. Coach invite status

Coach side **shipped** (create links, Copy link, Email draft, Revoke; polished
copy). Athlete acceptance **deferred** (Phase 2). Invite writes need the rules
deploy. The secure redemption design (single-doc `get` by unguessable token
id, no LIST = no enumeration) is captured for the next pass.

## 6. Coach permissions status

**Shipped + rules-tested.** view/comment ladder, default view, athlete-set,
coach-read-only. Edit tier intentionally disabled (no coach-write rule shipped).

## 7. Suggestions status

**Shipped + rules-tested.** Coach create (comment+), athlete accept (applies
immediately through owner-write) / reject, sanitized scalar-only changes,
double-protected by the update services' known-field payloads. Coach UI on a
ski in coach view; athlete inbox from Profile.

## 8. Bottom nav / draft status

Bottom nav stays consistent (prior pass) and is present on the edit screens;
the edit screens now **autosave a local draft** instead of warning on leave
(restored on return, cleared on save). Scanner/camera + auth + heavy create
flows hide the nav. See `NAVIGATION_CONSISTENCY_AUDIT.md`.

## 9. Public sharing status

**Deferred** (design-only, `PUBLIC_SHARING_DESIGN.md`). User decisions recorded
for when it is built: anyone-with-link until expiry, **default 7 days**, fleet
share may show athlete + team name.

## 10. Sticker dataset instructions

`data/sticker-examples/README.md`: 10-20 images/brand (50+ total, 100+ ideal),
JPG preferred, one sticker per image, no glare, full frame, original res, with
matching JSON labels (schema included). Priority: Salomon, Fischer, Madshus.
Photos are NOT committed (large, may carry serials).

## 11. Tests / builds (full gate, all green)

| Check | Result |
| --- | --- |
| Firestore rules (emulator) | **27 passed** |
| `@nordicfleet/core` tests | **401 passed** |
| `@nordicfleet/mobile` tests | **380 passed**, 1 skipped |
| Web build (`next build`) | **green** |
| iOS JS bundle (dev, Metro) | **green** (9.9 MB) |
| Lint (all workspaces) | **0 errors** |

## 12. Phone checklist (this build)

- Settings footer reads **`Build · 2026-05-30 · coach-collab-pass-1`**.
- Athlete: Profile -> My coach shows View only / Can suggest; set "Can suggest".
- Coach (linked to that athlete, comment granted): open the athlete's ski ->
  "Suggest a change" (light-bulb) -> propose a flex/grind + note -> send.
- Athlete: Profile -> Coach suggestions -> Accept applies the change to the
  ski; Reject leaves it. (These persist only after the rules deploy.)
- Edit a wax/test log, tap a tab, come back -> "Draft restored.".

## Safe to merge main?

**Not yet.** Gate is green and there are no insecure partials (the one new rule
is additive, tested, safe-closed until deployed). But suggestions/invites are
not live until `firebase deploy --only firestore:rules`, and invite acceptance
+ public sharing are deferred. Merge once the rules are deployed and the phone
checklist passes, or once you adopt this branch as the baseline.
