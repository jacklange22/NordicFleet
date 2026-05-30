/** @type {import('next').NextConfig} */

// Baseline security headers for the public marketing site. It only records
// email signups (Firestore create), so it needs no camera, microphone, or
// geolocation. A strict Content-Security-Policy is a follow-up (see
// SECURITY_AUDIT.md) to avoid breaking the Firebase signup write.
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
    value: 'camera=(), microphone=(), geolocation=()',
  },
];

const nextConfig = {
  async headers() {
    return [{source: '/:path*', headers: securityHeaders}];
  },
};

export default nextConfig;
