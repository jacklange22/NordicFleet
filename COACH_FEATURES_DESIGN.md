# Coach Features Design (invites + permissions + suggestions)

_2026-05-30. Design only. These features add new Firestore collections and
rules. They were NOT shipped this pass because there is no emulator
rules-test harness and rules must not be deployed untested. This is the
buildable plan. Pure/core pieces (email parsing, permission constants,
suggestion payloads) can land first with unit tests, ahead of any rules._

## Current baseline (important)

The live rules already make a linked coach **read-only** on an athlete's
skis/waxLogs/testLogs (`allow write: if isOwner(uid)`). So "coaches do not get
edit access by default" is already true. The work below ADDS a graduated
permission and a suggestion flow; the `edit` tier is the only thing that would
loosen the owner-only write, and only when the athlete explicitly grants it.

---

## Part A: Athlete invites (Phase 5)

### Collection `athleteInvites/{inviteId}`
```
{ coachUid, coachName, email, token, createdAt, expiresAt,
  status: 'pending' | 'accepted' | 'revoked' }
```

### Invite URL
`${APP_URL}/signup?invite=<token>` (web app, current Vercel URL). The web app
already exists; the marketing `/invite/<token>` route is optional later.

### Rules (emulator-test before deploy)
```
match /athleteInvites/{id} {
  allow read, list: if request.auth != null
    && request.auth.uid == resource.data.coachUid;          // coach sees own
  allow create: if request.auth != null
    && request.auth.uid == request.resource.data.coachUid
    && request.resource.data.status == 'pending';
  allow update: if request.auth != null
    && request.auth.uid == resource.data.coachUid;          // revoke
  allow delete: if false;
}
```
Redemption (athlete -> coach link) reuses the existing `coachRequests` flow:
the token resolves to the coach, then a normal coachRequest is created. No
public listing of invites.

### Core (testable now)
- `parseEmailList(text)` -> `{valid: [...], invalid: [...]}` handling commas,
  spaces, and newlines.
- `makeInviteToken()` and `buildInvitePayload({coachUid, coachName, email})`.
- Tests: parser splits/validates; token generated; payload shape.

### UI (coach)
Paste emails, optional message, "Create invites", copy all links, share via
native share/mailto, list invites with status, revoke. **Do not say "sent"**:
without an email provider we offer "Copy invite links" and "Open email draft".
A real automated send needs an email provider (Resend/Postmark/SendGrid) wired
to a Cloud Function; documented as the follow-up.

---

## Part B: Athlete-controlled coach permissions + suggestions (Phase 6)

### Permission level (athlete sets per coach)
Store on the coach link: `permission: 'view' | 'comment' | 'edit'`, default
**`view`**. Likely home: the `coachRequests` doc (already the link record) or a
`users/{athleteUid}/coachAccess/{coachUid}` doc the athlete owns.

- `view`: coach reads fleet + history (today's behavior).
- `comment`: coach may also create **suggestions** (below); cannot edit data.
- `edit`: coach may directly update allowed athlete docs. Gate this behind an
  explicit athlete grant; if it feels too risky for v1, ship `view` + `comment`
  and show `edit` as "coming soon".

### Collection `fleetSuggestions/{id}`
```
{ coachUid, athleteUid, targetType: 'ski'|'waxLog'|'testLog',
  targetId, suggestedChanges: {field: value}, comment,
  status: 'pending'|'accepted'|'rejected', createdAt }
```

### Rules (emulator-test before deploy)
```
match /fleetSuggestions/{id} {
  allow read, list: if request.auth != null
    && (request.auth.uid == resource.data.athleteUid
        || request.auth.uid == resource.data.coachUid);
  // Coach creates a suggestion only for an athlete who granted comment|edit.
  allow create: if request.auth != null
    && request.auth.uid == request.resource.data.coachUid
    && request.resource.data.status == 'pending'
    && coachHasAtLeastComment(request.resource.data.athleteUid, request.auth.uid);
  // Athlete accepts/rejects their own suggestions.
  allow update: if request.auth != null
    && request.auth.uid == resource.data.athleteUid
    && request.resource.data.status in ['accepted','rejected'];
  allow delete: if false;
}
```
`coachHasAtLeastComment(...)` reads the athlete's coachAccess doc. The actual
DATA mutation on accept is done by the **athlete** (owner write), not the
coach, so the owner-only write rule on skis/waxLogs/testLogs stays intact for
`view`/`comment`. Only the `edit` tier would add a coach-write rule, guarded by
`coachHasEdit(...)`.

### UI
- Athlete: "Manage coach access" with View / Comment / Edit per coach +
  Remove; a Suggestions inbox to accept/reject (accept applies the change via
  the athlete's own write).
- Coach: on an athlete's ski/log, "Suggest a change" (only if comment|edit);
  a list of their pending/accepted/rejected suggestions.
- The UI must clearly label a suggestion as a suggestion, never a silent edit.

### Tests
- default permission is `view` (not edit).
- `view` coach cannot create a suggestion; `comment` can; neither can write
  athlete data directly.
- athlete accept applies the change; reject does not.
- non-linked coach cannot read/suggest.
- emulator rules tests for all of the above.

## Phasing

1. Core: email parser, invite token/payload, permission constants, suggestion
   payload builder + sanitizer. Unit-tested. (Safe to land first.)
2. Emulator rules tests, then the `athleteInvites` + `fleetSuggestions` +
   coachAccess rules.
3. Coach invite UI (copy/share links).
4. Athlete "Manage coach access" + Suggestions inbox; coach "Suggest a change".
5. Optional: automated invite email via provider + Cloud Function.
6. Optional, last: the `edit` tier (coach direct write), behind explicit grant.
