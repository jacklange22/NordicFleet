# NordicFleet — Observability Plan

_Last updated: 2026-05-29_

## TL;DR

The **dependency-free scaffolding is implemented and tested**. The actual
crash/error **vendor SDK is deferred** (it needs a native pod + an iOS
rebuild + a paid/keyed backend), and is specified precisely below so it's
a small, safe follow-up.

## What's implemented now (this session, no new dependencies)

- **PII-safe scrub, in `packages/core`** — `scrubErrorForReport(error, context)`
  shapes any error into `{name, message, code?, stack?, context, at}` and
  **enforces the privacy allow-list in code**: only
  `ALLOWED_CONTEXT_KEYS` (`platform, screen, route, component, boundary,
  isCoach, code, action`) survive; objects/arrays are dropped even on
  allowed keys. 6 tests (`packages/core/src/services/__tests__/errorReport.test.js`).
- **Web error boundaries** — `apps/web/src/app/error.js` (segment) and
  `global-error.js` (root, self-contained inline styles). Previously an
  uncaught render error showed a blank page; now the user gets a recovery
  UI ("Try again" / "Go home") and the error is funneled.
- **Web seam** — `apps/web/src/lib/reportError.js`. Scrubs + `console.error`
  in dev; gated vendor send behind `NEXT_PUBLIC_SENTRY_DSN`.
- **Mobile seam** — `apps/mobile/src/services/reportError.js`. Scrubs +
  `console.warn` in dev. `installGlobalErrorHandler()` (called from
  `index.js`) captures otherwise-unhandled JS errors and preserves the
  default handler. The existing `ErrorBoundary` now reports render errors
  through the same funnel.

Net: there is exactly **one funnel per platform** (`reportError`) and one
shared scrubber. Wiring a vendor is a one-file change per platform.

## Recommended vendor: Sentry

Reasoning: Sentry has first-class SDKs for **both** Next.js and React
Native, a generous free tier, source-map/symbolication support, and
release health. Firebase **Crashlytics** is a fine iOS-only alternative
(native crashes + the analytics package is already installed) but does
**not** cover the web app, so you'd run two systems. For a 5-user beta,
one tool across both clients (Sentry) is simpler.

### Web (Next.js) — install steps

1. `cd apps/web && npx @sentry/wizard@latest -i nextjs` (or
   `npm i @sentry/nextjs`).
2. Add `sentry.client.config.js`, `sentry.server.config.js`,
   `sentry.edge.config.js` with `dsn: process.env.NEXT_PUBLIC_SENTRY_DSN`,
   `tracesSampleRate: 0.1`, `environment: process.env.VERCEL_ENV`.
3. In `apps/web/src/lib/reportError.js`, replace the `TODO` with
   `Sentry.captureException(error, { extra: payload.context })`.
4. Keep `beforeSend` minimal — do **not** add custom PII; the scrubber
   already limits `extra`.

Env vars (set in Vercel for the `nordicfleet-web` project):
- `NEXT_PUBLIC_SENTRY_DSN` — web DSN
- `SENTRY_AUTH_TOKEN` — for source-map upload at build (build-only secret)
- `SENTRY_ORG`, `SENTRY_PROJECT`

### Mobile (React Native) — install steps

1. `cd apps/mobile && npm i @sentry/react-native`.
2. `npx @sentry/wizard@latest -i reactNative` (adds the Xcode build phase
   for source maps + dSYM upload).
3. `cd ios && RCT_NEW_ARCH_ENABLED=0 bundle exec pod install`.
4. In `App.tsx`, `Sentry.init({ dsn: <ios dsn>, environment: ... })` and
   wrap the root with `Sentry.wrap(App)`.
5. In `apps/mobile/src/services/reportError.js`, replace the `TODO` with
   `Sentry.captureException(error, { contexts: { app: payload.context } })`.

Env: the RN DSN is compiled in via `App.tsx` (read from a non-secret
config). Source-map upload uses `SENTRY_AUTH_TOKEN` at build time only.

## Privacy guardrails (already enforced)

- The scrubber's allow-list means **no skier/coach names, no message
  bodies, no free-text wax notes, no exact location, no email, no ski
  serials/inventory** can reach the vendor through `context`.
- `error.message`/`stack` are truncated. Before enabling Sentry, do one
  audit pass that no `throw new Error(...)` interpolates PII into the
  message (none do today — auth/firestore errors are codes + generic
  strings).
- Set Sentry `sendDefaultPii: false`.

## Verification path

- **Now:** `reportError` is covered indirectly by the core scrub tests;
  trigger the web boundary by throwing in a component in dev and confirm
  the recovery UI + `[reportError]` console line.
- **After Sentry:** add a temporary `throw` behind a dev-only button,
  confirm the event lands in the Sentry dashboard with **only** allow-listed
  context, then remove the button. Confirm a forced JS error on iOS
  (via `installGlobalErrorHandler`) also lands.

## Files expected to change when wiring the vendor

- web: `package.json`, `sentry.*.config.js` (new), `next.config` (Sentry
  plugin), `src/lib/reportError.js` (one line).
- mobile: `package.json`, `ios/Podfile.lock`, `App.tsx`,
  `src/services/reportError.js` (one line).
- No changes to `packages/core` (the scrubber is vendor-agnostic).

## Out of scope (intentionally)

Performance tracing dashboards, session replay, alerting rules, and uptime
monitoring — all post-beta. The goal here is "a crash in the field is not
invisible," nothing more.
