/** @type {import('next').NextConfig} */

// Baseline security headers applied to every response. We intentionally do
// NOT set a strict Content-Security-Policy here yet: the app loads Firebase
// (Auth + Firestore) and Next inline runtime scripts, so a wrong CSP would
// break sign-in. CSP is tracked as a follow-up in SECURITY_AUDIT.md.
// geolocation is allowed for self because test-log location capture uses it.
const securityHeaders = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {key: 'X-Content-Type-Options', value: 'nosniff'},
  {key: 'X-Frame-Options', value: 'DENY'},
  {key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin'},
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(self)',
  },
];

const nextConfig = {
  async headers() {
    return [{source: '/:path*', headers: securityHeaders}];
  },
};

export default nextConfig;
