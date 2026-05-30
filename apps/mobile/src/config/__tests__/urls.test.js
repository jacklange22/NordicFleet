import {MARKETING_URL, APP_URL, legalUrl, shareUrl} from '../urls';

// We don't own nordicfleet.com yet — defaults must point at the live Vercel
// deployments so legal + share links actually work (Phase 3 / Phase 8).
describe('public URLs config', () => {
  it('defaults marketing + app to the live Vercel URLs (not nordicfleet.com)', () => {
    expect(MARKETING_URL).toBe('https://marketing-black-eight.vercel.app');
    expect(APP_URL).toBe('https://nordicfleet-web.vercel.app');
    expect(MARKETING_URL).not.toMatch(/nordicfleet\.com/);
  });

  it('legalUrl builds a marketing-site path', () => {
    expect(legalUrl('/privacy')).toBe(
      'https://marketing-black-eight.vercel.app/privacy',
    );
    expect(legalUrl('/terms')).toBe(
      'https://marketing-black-eight.vercel.app/terms',
    );
  });

  it('shareUrl builds a public share path by type + id', () => {
    expect(shareUrl('ski', 'abc123')).toBe(
      'https://marketing-black-eight.vercel.app/share/ski/abc123',
    );
    expect(shareUrl('fleet', 'f1')).toBe(
      'https://marketing-black-eight.vercel.app/share/fleet/f1',
    );
  });
});
