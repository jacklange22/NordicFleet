// Public-facing URLs.
//
// We do NOT own nordicfleet.com yet, so the defaults point at the live
// Vercel deployments. Override with env vars once the real domains have DNS.
//   - marketing (public site, legal, share pages)
//   - app       (web sign-up / login)

export const MARKETING_URL =
  process.env.NORDICFLEET_MARKETING_URL ||
  'https://marketing-black-eight.vercel.app';

export const APP_URL =
  process.env.NORDICFLEET_APP_URL || 'https://nordicfleet-web.vercel.app';

/** Build a marketing-site URL, e.g. legalUrl('/privacy'). */
export const legalUrl = path => `${MARKETING_URL}${path}`;

/** Public share URL for a share id, e.g. shareUrl('ski', 'abc'). */
export const shareUrl = (type, shareId) =>
  `${MARKETING_URL}/share/${type}/${shareId}`;
