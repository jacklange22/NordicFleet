// Central public URLs for the marketing site.
//
// We do not own nordicfleet.com yet, so the defaults point at the live
// Vercel deployments. Override with env vars (set in the Vercel project)
// once the real domains have DNS, without touching code.

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || 'https://nordicfleet-web.vercel.app';

export const MARKETING_URL =
  process.env.NEXT_PUBLIC_MARKETING_URL ||
  'https://marketing-black-eight.vercel.app';

// Where people land from CTAs.
export const SIGNUP_URL = `${APP_URL}/signup`;
export const LOGIN_URL = `${APP_URL}/login`;
