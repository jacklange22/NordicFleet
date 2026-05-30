# Website & Marketing Status

_Overnight stabilization — verified 2026-05-30. Evidence:
`debug/overnight-20260530-0046/web-marketing-http.txt`._

## Current live URLs (all reachable)

| Property | Deployed URL | Routes checked | Result |
|---|---|---|---|
| Web app | https://nordicfleet-web.vercel.app | `/ /login /signup /forgot-password /home /import /log/wax /log/test /ski/new /wax-truck /profile /messages /coach` | **13/13 → HTTP 200** |
| Marketing | https://marketing-black-eight.vercel.app | `/ /features /coaches /pricing /about /privacy /terms` | **7/7 → HTTP 200** |

Both Vercel deployments are live and every audited route resolves. Marketing
internal nav links (`/features /coaches /pricing /about /privacy /terms`) are
all present on the live homepage.

## What works (verified)

- All web-app and marketing routes return 200.
- Firestore security rules are **live and enforcing**: an unauthenticated
  `GET`/`LIST` on `/users` returns **HTTP 403** (evidence:
  `firebase-verify-readonly.txt`).
- Email capture is **wired**: `apps/marketing/src/components/EmailCapture.jsx`
  → `src/lib/signups.js` → `addDoc(collection(db,'marketingSignups'))`. Rules
  allow anonymous create + block client reads (matches `verify-wax-truck.sh`).

## ⚠️ Readiness gaps (need human action — DNS / Vercel env)

These are **not code bugs** — the code defaults to the intended *final*
domains, which are not yet wired:

1. **Marketing "Get started" CTA points to a dead domain.** The live
   marketing homepage links to **`https://app.nordicfleet.com`**
   (`apps/marketing/src/app/page.js`, `pricing/page.js`, `components/Nav.jsx`
   default `NEXT_PUBLIC_APP_URL`). That host is not yet served → clicking it
   today fails. Fix: either set `NEXT_PUBLIC_APP_URL=https://nordicfleet-web.vercel.app`
   in the marketing Vercel project **now**, or point `app.nordicfleet.com` at
   the web app (preferred, below).
2. **App legal links — FIXED (now default to the live marketing URL).** iOS
   Settings (`apps/mobile/src/config/urls.js` → `legalUrl`) and the web
   profile (`apps/web/src/app/profile/page.js`) now default to
   **`https://marketing-black-eight.vercel.app/privacy|/terms`** (no more dead
   `nordicfleet.com`), still env-overridable via `NEXT_PUBLIC_MARKETING_URL` /
   `NORDICFLEET_MARKETING_URL`. ⚠️ The **live web app** shows this only after a
   **web redeploy** (push to `main` if it auto-deploys, or `vercel --prod`
   from `apps/web`); the iOS app picks it up on the next build.
3. **Firebase env vars must be set in BOTH Vercel projects.** The code reads
   `NEXT_PUBLIC_FIREBASE_*` (6 keys) for web and marketing. Routes load (200)
   but **client Firebase init + email capture + sign-in only work if those
   keys are set in each Vercel project.** Not verifiable from outside —
   **needs a human to sign in on the live web URL and submit the marketing
   waitlist once.**

## Domain plan (Vercel = source of truth)

| Domain | Should serve | Status |
|---|---|---|
| `nordicfleet.com` | Marketing | **Not wired** (code default target) |
| `www.nordicfleet.com` | Marketing (redirect to apex) | Not wired |
| `app.nordicfleet.com` | Web app | **Not wired** (marketing CTA target) |

### Exact Vercel steps
1. Marketing Vercel project → **Settings → Domains** → add `nordicfleet.com`
   and `www.nordicfleet.com` (set `www` to redirect to apex).
2. Web-app Vercel project → **Settings → Domains** → add `app.nordicfleet.com`.
3. Vercel shows the exact DNS records to create — **use Vercel's values as the
   source of truth.** Typical shape (confirm against Vercel UI):
   - `nordicfleet.com` → `A` record → `76.76.21.21`
   - `www.nordicfleet.com` → `CNAME` → `cname.vercel-dns.com`
   - `app.nordicfleet.com` → `CNAME` → `cname.vercel-dns.com`
4. After domains verify, **unset** the interim `NEXT_PUBLIC_APP_URL` /
   `*_MARKETING_URL` overrides (or set them to the real domains) so the code
   defaults (`app.nordicfleet.com`, `nordicfleet.com`) take effect.

## Orphan-project check

- Web app is served from **`nordicfleet-web.vercel.app`** (the URL in the
  brief), not a stray `web` project. Marketing is `marketing-black-eight`.
- Root `vercel.json` builds with `cd ../.. && npm run web:build` (monorepo
  web build). Confirm in the Vercel dashboard that exactly **one** project
  targets each app and no older duplicate is auto-deploying. (Cannot be
  verified from the repo alone — **human check in the Vercel dashboard**.)

## Not changed this session

- No web/marketing **code** changed — the gaps above are Vercel-env / DNS
  config, not code. Deploying/redeploying is therefore unnecessary right now.
