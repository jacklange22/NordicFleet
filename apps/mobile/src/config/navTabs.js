// Single source of truth for WHERE the bottom TabBar appears.
//
// The bar is part of the product's spine: it shows on browse / view / detail
// / edit screens so the app reads as one connected product instead of a pile
// of isolated screens. It is hidden only where it would clearly harm UX:
//
//   - auth + onboarding: there is no "app" to navigate yet.
//   - the full-screen camera scanner: the viewfinder owns the screen.
//   - heavy multi-step CREATE / entry flows (multi-ski wax/test logging,
//     advisory composer, wax-truck setup/runner): these have an explicit
//     Save and a Cancel (back), and a stray tab tap mid-entry would discard
//     a lot of unsaved work. Single-record EDIT screens DO show the bar, but
//     guard unsaved changes (see useUnsavedGuard).
//
// TabBar consults this so the policy lives in exactly one place; screens just
// render <TabBar /> and the bar decides whether to draw itself.

export const TABBAR_HIDDEN_ROUTES = new Set([
  // auth / onboarding
  'AuthLoading',
  'Welcome',
  'Login',
  'Signup',
  'ForgotPassword',
  'RoleSelect',
  // full-screen camera
  'ScanSki',
  // heavy multi-step create / entry flows (explicit Save + Cancel)
  'newSki',
  'WaxLog',
  'TestingLog',
  'ComposeAdvisory',
  'WaxTestSetup',
  'WaxTestRunner',
]);

/**
 * Whether the TabBar should be visible for a given route name. When the
 * route is unknown (e.g. a standalone test render with no navigator), we
 * default to showing it rather than hiding - hiding is only ever an explicit,
 * known decision.
 *
 * @param {string|undefined|null} routeName
 * @returns {boolean}
 */
export const shouldShowTabBar = routeName =>
  !(routeName && TABBAR_HIDDEN_ROUTES.has(routeName));
