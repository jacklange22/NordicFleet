import {Container, Eyebrow, FeatureCard} from '@/components/ui';
import {Reveal} from '@/components/Reveal';
import {EmailCapture} from '@/components/EmailCapture';

export const metadata = {
  title: 'For coaches',
  description:
    'Link your athletes, review their fleets, run morning wax tests, and send race-day advisories, NordicFleet for nordic coaches.',
};

const STEPS = [
  {
    n: '1',
    title: 'Athletes link to you',
    body: 'Your skiers add you by email. Once they accept, their fleet and logs are visible to you, read-only, so you are never editing their gear behind their back.',
  },
  {
    n: '2',
    title: 'Test in the morning',
    body: 'Run the Wax Truck on race morning to find the call for the day. Record the conditions it won in so the result is defensible.',
  },
  {
    n: '3',
    title: 'Send the advisory',
    body: 'Push a race-day plan to each athlete with the primary and backup skis, the winning wax, and notes on when to swap.',
  },
];

export default function CoachesPage() {
  return (
    <>
      <Container className="pt-16 pb-8 text-center">
        <Reveal>
          <Eyebrow>For coaches</Eyebrow>
        </Reveal>
        <Reveal
          as="h1"
          delay={60}
          className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight max-w-3xl mx-auto">
          Run the wax room without the spreadsheet chaos
        </Reveal>
        <Reveal
          as="p"
          delay={120}
          className="mt-5 text-lg text-text-secondary max-w-2xl mx-auto">
          NordicFleet gives coaches one place to see every athlete&apos;s
          equipment, test the day&apos;s wax, and get the call into the right
          hands before the gun.
        </Reveal>
      </Container>

      <Container className="py-10">
        <div className="grid gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 80}>
              <div className="rounded-2xl border border-border bg-surface p-6 h-full">
                <div className="w-10 h-10 rounded-full bg-coaching/[0.12] border border-coaching/40 text-coaching font-bold flex items-center justify-center mb-4">
                  {s.n}
                </div>
                <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  {s.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>

      <Container className="py-10">
        <div className="grid gap-5 md:grid-cols-3">
          <Reveal>
            <FeatureCard icon="👥" title="The whole roster">
              A single dashboard of your linked athletes, searchable, with
              each skier&apos;s active fleet a tap away.
            </FeatureCard>
          </Reveal>
          <Reveal delay={70}>
            <FeatureCard icon="🏁" title="Three modes, one app">
              Switch between your own personal fleet, coaching, and the Wax
              Truck without signing into a different account.
            </FeatureCard>
          </Reveal>
          <Reveal delay={140}>
            <FeatureCard icon="🔒" title="Privacy by default">
              Athlete logs are visible only to the athlete and their linked
              coach. Nobody sees a fleet they shouldn&apos;t.
            </FeatureCard>
          </Reveal>
        </div>
      </Container>

      <Container className="py-16">
        <Reveal className="rounded-3xl border border-border bg-surface p-10 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Bring your team
          </h2>
          <p className="mt-3 text-text-secondary max-w-xl mx-auto">
            Tell us about your club or program and we&apos;ll get you set up.
          </p>
          <div className="mt-7 max-w-md mx-auto">
            <EmailCapture source="coaches-cta" />
          </div>
        </Reveal>
      </Container>
    </>
  );
}
