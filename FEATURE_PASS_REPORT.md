# Feature / Security / Polish Pass Report

_Branch `claude-rewrite` · 2026-05-30 · evidence in
`debug/feature-pass-20260530-*/`._

## 1. What landed (tested + committed)

| Area | Change | Commit |
|---|---|---|
| URLs | Repaired broken app links; centralized live Vercel URL config in web + marketing; CTAs point at the live app | `7cb3dae` |
| Copy | Removed every em dash from user-facing app source; rewrote cheesy/venue copy; added a guard script | `1ac1248` |
| Privacy | Rewrote the privacy policy with accurate language (coach access, sharing, aggregated analytics, admin access) | `9db662f` |
| Security | SECURITY_AUDIT.md + baseline security headers on web + marketing | `27c9d83` |
| Scan | Renamed "base sticker" to "ski sticker"; STICKER_PARSING_PLAN.md | `795d5bf` |
| Design | PUBLIC_SHARING_DESIGN.md + COACH_FEATURES_DESIGN.md (deferred features, buildable) | `63e49f6` |

## 2. What was deferred (and why)

Honest: this brief was ~15 phases. The security-sensitive feature builds were
**designed, not shipped**, because they add new Firestore rules and there is
**no emulator rules-test harness** (and the rule is "do not deploy rules
without tests; do not ship insecure partial"). Adding deps for an emulator was
out of scope ("do not upgrade dependencies unless absolutely required").

- **Coach invites (Phase 5)** and **coach permissions + suggestions
  (Phase 6)**: designed in `COACH_FEATURES_DESIGN.md`. Note: coaches are
  **already read-only** on athlete data in the live rules, so the unsafe
  default the user worried about does not exist today.
- **Public share links (Phase 12)**: designed in `PUBLIC_SHARING_DESIGN.md`.
- **Messaging unification (7)**, **history screens (8)**, **edit wax/test logs
  (9)**, **units (10)**: not started this pass (no rules risk, just time).
  Edit-ski already shipped in a prior pass.

## 3. Security audit summary

`SECURITY_AUDIT.md`. The model is reasonably tight: users own their data,
coaches are **read-only** on linked athletes, messages are two-party only,
public marketing signups are write-only and shape-validated. Top findings
(none are broken access control): no App Check; coach profiles readable by any
signed-in user; no rate limiting on public signups; no automated rules tests;
verify account-deletion removes all subcollections. **Firestore rules were not
changed** (cannot emulator-test). Safe wins applied: security headers
(HSTS, nosniff, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy).
CSP deferred to avoid breaking Firebase sign-in.

## 4. Privacy policy changes

Accurate, not overclaimed: added "What coaches can see" (read-only),
"Sharing links" (only chosen fields, expirable/revocable), "Analytics and
product development" (aggregated or de-identified, explicitly NOT claiming full
anonymity because data is account-linked), and "Administrator access" (honest
that authorized admins can access account data for support/security/abuse/
debugging, least-privilege goal). No em dashes.

## 5. Coach invite flow

Designed (`COACH_FEATURES_DESIGN.md` Part A): `athleteInvites` collection,
owner-only rules, `${APP_URL}/signup?invite=<token>` links, email-list parser
(comma/space/newline) as a testable core piece. UI offers "copy invite links"
and "open email draft"; it does NOT claim "sent" (no email provider wired).

## 6. Coach permission model

Designed (Part B): per-coach `view` / `comment` / `edit`, default **view**;
a `fleetSuggestions` flow where the coach proposes and the **athlete (owner)**
applies accepted changes, so the owner-only write rule stays intact for view/
comment. `edit` is gated behind explicit athlete grant (or shipped as "coming
soon").

## 7. Messaging status

Deferred (no change). The prior deferral stands; behavior is unchanged.

## 8. History / edit status

Edit-ski shipped earlier (`56bb7c0`). History screens and edit wax/test logs
deferred this pass.

## 9. Units status

Deferred (bounded, no rules; time).

## 10. Sticker scanning status

Renamed to "ski sticker". The existing generic parser (per-field confidence,
brand/model match, human confirm) stands. Brand-aware parsing is designed in
`STICKER_PARSING_PLAN.md`; it needs labeled sample photos per brand before
brand parsers can be written and tested (no overfitting without samples).

## 11. Public sharing status

Designed only (`PUBLIC_SHARING_DESIGN.md`). Not shipped: needs new
unauthenticated-read rules + an emulator test harness. The share invite copy +
`shareUrl()` config foundation are in place.

## 12. Tests / builds

`em-dash guard OK` · `lint 0 errors` · `mobile 309 +1 skipped` · `core 341` ·
`web:build OK` · `marketing build OK` · `react-native bundle OK` ·
`build-ios-simulator.sh -> BUILD SUCCEEDED`. Logs in
`debug/feature-pass-20260530-*/`.

## 13. Firestore rules status

**Unchanged. Not deployed.** No safe automated test harness exists for them
this pass. New rules for invites/permissions/sharing are specified in the
design docs and must be emulator-tested before any deploy.

## 14. Deployment status

Code changed in **web and marketing** (URLs, copy, privacy, headers). The live
sites still serve the previous build until redeployed. To apply: redeploy each
(push to `main` if Vercel auto-deploys main, or `vercel --prod` from
`apps/web` and `apps/marketing`). After deploy, re-verify the marketing CTA now
points to `nordicfleet-web.vercel.app` and security headers are present
(`curl -I`). Not deployed by this pass.

## 15. Manual phone test checklist

Reinstall, confirm Settings build tag `feature-pass-1`, then: mode switching
(no crash) · create a Wax Truck test of each type (no crash) · edit a ski ·
Privacy/Terms open the marketing pages · marketing "Open the app" CTA reaches
the web app (after web/marketing redeploy) · delete account shows two
confirmations.

## 16. Known risks

- Web/marketing copy + URL + header changes are **not live until redeployed**.
- The big coach/sharing features are **design-only**; their rules are
  unwritten/untested.
- Support emails (`support@nordicfleet.com`, `privacy@nordicfleet.com`) assume
  an email setup that may not exist yet; verify forwarding or swap addresses.
- No App Check yet (see audit).

## 17. Next prompt recommendation

Pick ONE feature to ship end-to-end with tests, in this order of value/safety:
1. Stand up the **Firebase emulator + `@firebase/rules-unit-testing`** (one-time
   infra) so any rules can be tested. Everything below depends on it.
2. **Coach permissions + suggestions** (highest coach value; `view`/`comment`
   first, owner applies changes).
3. **Public sharing** (core sanitizer + rules tests + marketing routes).
4. Then messaging unification, history screens, edit logs, units.
Also: redeploy web + marketing, and enable App Check.

## Safe to merge to main?

**Not yet, recommend NO for now.** The gate is green and nothing here is
unsafe, but: (a) the web/marketing changes need a **redeploy + live re-verify**
first, (b) the working tree carries the user's uncommitted Release `xcscheme`
change, and (c) merging would trigger an unattended production deploy. Merge
after a redeploy + a quick on-device confirm. Clean fast-forward command is in
the final summary.
