// Central public URLs for the web app.
//
// We do not own nordicfleet.com yet, so the defaults point at the live
// Vercel deployments. Override with env vars in the Vercel project once the
// real domains have DNS.

export const MARKETING_URL =
  process.env.NEXT_PUBLIC_MARKETING_URL ||
  'https://marketing-black-eight.vercel.app';

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || 'https://nordicfleet-web.vercel.app';

export const legalUrl = path => `${MARKETING_URL}${path}`;
