# Public Sharing Design

_2026-05-30. Design only. Public sharing was deliberately NOT shipped this
pass: it requires new Firestore rules for unauthenticated reads of a public
collection, and there is no emulator rules-test harness, so shipping it would
be insecure-partial. This document is the buildable plan._

## Goal

Share a fleet, a ski, or a wax-test result via a public link that needs no
login, shows only the fields the owner chose, can expire, and can be revoked.
Links point at the live marketing site (`shareUrl()` in the URL configs
already returns `https://marketing-black-eight.vercel.app/share/<type>/<id>`).

## Data model: `publicShares/{shareId}` (top-level)

```
{
  type: 'fleet' | 'ski' | 'test',
  ownerUid: string,
  ownerName: string,          // denormalized display name / team name
  status: 'active' | 'revoked',
  createdAt: serverTimestamp,
  expiresAt: timestamp | null,    // null = until revoked
  options: {                      // what the owner chose to include
    comments: boolean,            // include user notes/comments
  },
  // Denormalized PUBLIC snapshot of ONLY the allowed fields. Never contains
  // email, uid (beyond ownerUid which is not secret), wax/test history on a
  // ski/fleet share, or anything not selected.
  data: {
    // ski:   { name, brand, model, technique, type, grind, flex, comments? }
    // fleet: { ownerName, skis: [ { name, brand, model, type, comments? } ] }
    // test:  { name, testType, combinations:[...], winnerLabel, conditions }
  }
}
```

**Live vs snapshot:** marketing is a client-side Next app reading Firebase with
the public web key, so it can only read what the rules allow, and rules cannot
filter document FIELDS. Therefore the share doc stores a **denormalized public
snapshot** of just the allowed fields. It is refreshed when the owner
re-shares or edits the source. (Truly live data would require a server route
using Firebase Admin, which needs admin credentials in Vercel; documented as a
later upgrade. Do not claim "live" until then.)

## Firestore rules (add; MUST be emulator-tested before deploy)

```
match /publicShares/{shareId} {
  // Public read ONLY of active, unexpired shares. Timestamps can be compared
  // to request.time, so expiry is enforceable in-rule.
  allow read: if resource.data.status == 'active'
    && (resource.data.expiresAt == null || resource.data.expiresAt > request.time);

  // Owner creates their own share; status must start 'active'; data shape
  // validated; no foreign ownerUid.
  allow create: if request.auth != null
    && request.auth.uid == request.resource.data.ownerUid
    && request.resource.data.status == 'active'
    && request.resource.data.type in ['fleet','ski','test'];

  // Owner can update their own share (refresh snapshot) or revoke it.
  allow update: if request.auth != null
    && request.auth.uid == resource.data.ownerUid;

  // Owner lists their own shares (Manage shared links).
  // (list is covered by read; add an ownerUid query + a rule that allows
  //  read when request.auth.uid == resource.data.ownerUid as well.)
  allow delete: if false;   // revoke via status, keep an audit trail
}
```

Key safety properties: no unauthenticated **write**; unauthenticated **read**
only of active+unexpired shares; private collections (`users/**`) are never
touched by the public page; the snapshot contains only owner-selected public
fields, so even a readable share cannot leak private data.

## Marketing routes (public, no auth)

- `/share/fleet/[shareId]`, `/share/ski/[shareId]`, `/share/test/[shareId]`
- States: loading, not-found, expired/revoked (CTA), valid.
- CTA: "Create your own NordicFleet" -> `${APP_URL}/signup`, "Open the app".
- Reads `publicShares/{id}` with the marketing Firebase client; renders only
  `data`. No wax/test history on ski/fleet shares.

## Mobile UX

- Replace screenshot share with a share-options modal:
  - duration: 24h / 7d / 30d / until revoked
  - include: comments (ski/fleet); test shares include result + winner
  - create/update the `publicShares` doc, then native Share the `shareUrl()`.
- Settings -> "Manage shared links": list owner's active shares, copy/share
  URL, show expiry, revoke (set status 'revoked').

## Core (pure, testable now without rules)

- `buildPublicShare({type, owner, options, source})` -> share doc fields +
  sanitized `data` (drops email/uid/history; respects `options.comments`).
- `isShareViewable(share, now)` -> status active && not expired.
- `expiresAtFor(duration, now)`.
- Tests: sanitization excludes wax/test history and email; expiry math; revoke.

## Phased implementation

1. Core builder + sanitizer + tests (no rules, safe to land first).
2. Emulator rules tests for `publicShares`; then add the rules.
3. Marketing `/share/*` routes.
4. Mobile share modal + Manage shared links.
5. (Later) Firebase Admin server route for truly live data.

Do not ship steps 2 to 4 until step 2's rules tests pass.
