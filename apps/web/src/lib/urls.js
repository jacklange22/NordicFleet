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

// Beta feedback / bug-report inbox. Empty by default on purpose: we do not
// own a support mailbox yet, so the feedback link falls back to the
// marketing site rather than mailing an address that bounces. Set
// NEXT_PUBLIC_FEEDBACK_EMAIL in the Vercel project to enable the mail draft.
export const FEEDBACK_EMAIL = process.env.NEXT_PUBLIC_FEEDBACK_EMAIL || '';

export const legalUrl = path => `${MARKETING_URL}${path}`;
