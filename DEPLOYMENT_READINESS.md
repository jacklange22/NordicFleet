# NordicFleet — Deployment Readiness

_Last updated: 2026-05-29 · inspected, not re-deployed this session._

Scope: what it takes to put the **web app** and **marketing site** in
front of 5 beta users, and what's a human-only step. No secrets are
printed here. iOS distribution (TestFlight/App Store) is covered in
`BLOCKERS.md` / `READINESS_AUDIT.md`, not here.

## Status at a glance

| Surface | Builds? | Linked to Vercel? | Deployed? | Blocker to beta |
|--------|---------|-------------------|-----------|-----------------|
| Web app (`apps/web`) | ✅ `web:build` clean | ✅ project `web` (`apps/web/.vercel`) | ⚠️ live, but **latest changes not redeployed this session** | Redeploy |
| Marketing (`apps/marketing`) | ✅ builds (9 routes) | ❌ not linked | ❌ never deployed | New Vercel project + env + domain |
| Firestore rules | n/a | n/a | ✅ deployed + live-verified (`scripts/verify-wax-truck.sh` 7/7) | None |

## Web app (`apps/web`)

- **Build recipe** is committed: root `vercel.json` builds from the
  monorepo root (`cd ../.. && npm run web:build`, output `.next`,
  framework nextjs). This is correct for the workspace layout.
- **Linked project:** `apps/web/.vercel/project.json` points at a project
  named **`web`** (orgId/projectId present, gitignored).
  - ⚠️ **Discrepancy to resolve:** `BLOCKERS.md` describes the canonical
    project as **`nordicfleet-web`** (where the env vars + live URL live)
    and calls `web` an orphaned earlier attempt. The local link points at
    `web`. Before deploying, confirm which project is canonical and
    `vercel link` to it so you don't deploy to the dead one. (Can't be
    determined from the repo — needs the Vercel dashboard.)
- **Env vars (required, set in Vercel, not in the repo):** the six
  `NEXT_PUBLIC_FIREBASE_*` (API_KEY, AUTH_DOMAIN, PROJECT_ID,
  STORAGE_BUCKET, MESSAGING_SENDER_ID, APP_ID). Present in local
  `apps/web/.env.local` (gitignored). Per `BLOCKERS.md` they're set on
  `nordicfleet-web`; re-verify on whichever project you deploy.
- **Not yet live:** Wax Truck pages, web test-log geolocation, web
  data-export/account-deletion, and the new error boundaries all exist in
  the repo but were committed after the last deploy. **They are not on the
  deployed URL until you redeploy.**

Deploy:
```bash
cd /Users/jacklange/NordicFleet
npx vercel link        # confirm the CANONICAL project first
npx vercel --prod      # builds via the root vercel.json recipe
```

## Marketing site (`apps/marketing`)

- Builds clean (9 static routes incl. real privacy/terms). **Not linked,
  never deployed.**
- Needs its **own** Vercel project (separate from the app):
  - Root directory: `apps/marketing`.
  - It has no special `vercel.json`; default Next.js detection works, but
    in this monorepo set the project's **Root Directory = apps/marketing**
    in Vercel and let it run `next build` there (it doesn't depend on the
    root build recipe).
  - Env: the same six `NEXT_PUBLIC_FIREBASE_*` (for the `marketingSignups`
    write) — copy from `apps/marketing/.env.local.example`. Optionally
    `NEXT_PUBLIC_APP_URL` (→ app.nordicfleet.com) and
    `NEXT_PUBLIC_MARKETING_URL`.
- The `marketingSignups` create-only rule is already deployed + verified,
  so email capture will work the moment the site is live with env vars.

Deploy:
```bash
cd apps/marketing
npx vercel link        # create a NEW project, root dir = apps/marketing
npx vercel --prod
```

## Firebase

- Project **`nordicfleet-11e67`** (CLI authed, set as current).
- `firebase.json` configures **firestore rules only** (hosting is Vercel).
- **Gap (low-risk, fixable now):** no `.firebaserc` is committed. Local
  deploys work because the CLI has an active project globally, but a fresh
  clone / CI has no default. Add one (done in this session's Phase 8 if
  safe) so `firebase deploy --only firestore:rules` is reproducible.
- Rules deploy: `firebase deploy --only firestore:rules`.

## Required secrets / env vars (summary)

| Var | Web app | Marketing | Notes |
|-----|---------|-----------|-------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` … `_APP_ID` (6) | ✅ required | ✅ required | from Firebase console; already in local `.env.local` (web) |
| `NEXT_PUBLIC_APP_URL` | optional | optional | links between sites |
| `NEXT_PUBLIC_MARKETING_URL` | used by app Profile legal links | — | defaults to nordicfleet.com |
| `NEXT_PUBLIC_SENTRY_DSN` | future (OBSERVABILITY_PLAN) | future | gates the error-report vendor |

## Domains (human-only)

- `app.nordicfleet.com` (web app) and `nordicfleet.com` (marketing) are
  **assumptions** — there's no evidence in the repo that the domain is
  purchased or DNS is pointed. Per `LAUNCH_AUDIT.md`, domain purchase +
  DNS are out of scope for automation. For a 5-user beta you can ship on
  the `*.vercel.app` URLs and skip the custom domain entirely.

## Human steps before sharing with beta users

1. Resolve the Vercel project discrepancy (`web` vs `nordicfleet-web`);
   `vercel link` to the canonical one.
2. `vercel --prod` the web app so the latest features are live.
3. Create + deploy the marketing Vercel project (or skip for a pure-app
   beta).
4. Confirm env vars on each deployed project.
5. (Optional) custom domains + DNS.
6. Run `MANUAL_BETA_TEST_SCRIPT.md` against the **deployed** URL, not
   localhost.

## Risks before sharing

- **Deploying to the wrong (orphan) Vercel project** — would serve a stale
  build. Resolve the link first.
- **Beta users hitting the OLD deployed web app** (no Wax Truck / export /
  error boundaries) if you forget to redeploy.
- **No crash/error visibility in production** until the OBSERVABILITY_PLAN
  vendor is wired — a field error is currently only in the user's console.
  For 5 known users this is acceptable (they can screenshot), but wire
  Sentry before any wider release.
