import Link from 'next/link';
import {Container, Eyebrow} from '@/components/ui';
import {Reveal} from '@/components/Reveal';
import {EmailCapture} from '@/components/EmailCapture';
import {APP_URL} from '@/lib/urls';

export const metadata = {
  title: 'Pricing',
  description:
    'NordicFleet pricing — start free, with team plans for coaches and clubs on the way.',
};

const PLANS = [
  {
    name: 'Skier',
    price: 'Free',
    tagline: 'Everything an individual racer needs.',
    features: [
      'Unlimited skis in your fleet',
      'Wax & test logs with conditions',
      'Base-sticker scan & spreadsheet import',
      'Run your own wax tests',
      'iPhone & web',
    ],
    cta: {label: 'Open the app', href: 'app'},
    highlight: false,
  },
  {
    name: 'Team',
    price: 'Coming soon',
    tagline: 'For coaches running a roster.',
    features: [
      'Everything in Skier',
      'Link unlimited athletes',
      'Coaching dashboard & advisories',
      'Wax Truck shared with your program',
      'Priority support',
    ],
    cta: {label: 'Join the waitlist', href: 'waitlist'},
    highlight: true,
  },
];

export default function PricingPage() {
  return (
    <>
      <Container className="pt-16 pb-8 text-center">
        <Reveal>
          <Eyebrow>Pricing</Eyebrow>
        </Reveal>
        <Reveal
          as="h1"
          delay={60}
          className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight">
          Start free. Grow when your team does.
        </Reveal>
        <Reveal
          as="p"
          delay={120}
          className="mt-5 text-lg text-text-secondary max-w-2xl mx-auto">
          The individual app is free while we build. Team plans for coaches
          and clubs are on the way — get on the list and you&apos;ll hear
          first.
        </Reveal>
      </Container>

      <Container className="py-8">
        <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
          {PLANS.map((plan, i) => (
            <Reveal key={plan.name} delay={i * 90}>
              <div
                className={
                  'rounded-3xl border p-8 h-full flex flex-col ' +
                  (plan.highlight
                    ? 'border-waxtruck/50 bg-gradient-to-b from-surface to-bg'
                    : 'border-border bg-surface')
                }>
                <div className="flex items-baseline justify-between">
                  <h2 className="text-xl font-semibold">{plan.name}</h2>
                  {plan.highlight && (
                    <span className="text-[11px] uppercase tracking-wider text-waxtruck border border-waxtruck/50 rounded-full px-2 py-0.5">
                      Soon
                    </span>
                  )}
                </div>
                <div className="mt-4 text-3xl font-bold tracking-tight">
                  {plan.price}
                </div>
                <p className="mt-2 text-text-secondary text-sm">
                  {plan.tagline}
                </p>
                <ul className="mt-6 space-y-3 flex-1">
                  {plan.features.map(f => (
                    <li
                      key={f}
                      className="flex items-start gap-3 text-sm text-text-secondary">
                      <span className="text-success mt-0.5">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  {plan.cta.href === 'app' ? (
                    <a
                      href={APP_URL}
                      className="inline-flex w-full items-center justify-center h-11 px-5 rounded-full bg-red text-white text-sm font-semibold hover:bg-red-pressed transition-colors">
                      {plan.cta.label}
                    </a>
                  ) : (
                    <Link
                      href="#waitlist"
                      className="inline-flex w-full items-center justify-center h-11 px-5 rounded-full border border-border-strong text-white text-sm font-semibold hover:bg-surface transition-colors">
                      {plan.cta.label}
                    </Link>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>

      <Container className="py-16" id="waitlist">
        <Reveal className="rounded-3xl border border-border bg-surface p-10 text-center scroll-mt-24">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Team waitlist
          </h2>
          <p className="mt-3 text-text-secondary max-w-xl mx-auto">
            Leave your email and we&apos;ll reach out when team plans open.
          </p>
          <div className="mt-7 max-w-md mx-auto">
            <EmailCapture source="pricing-waitlist" />
          </div>
        </Reveal>
      </Container>
    </>
  );
}
