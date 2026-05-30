import Link from 'next/link';
import {Container, Eyebrow, FeatureCard} from '@/components/ui';
import {Reveal} from '@/components/Reveal';
import {EmailCapture} from '@/components/EmailCapture';
import {APP_URL} from '@/lib/urls';

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 hero-glow pointer-events-none" />
        <Container className="relative pt-20 pb-20 sm:pt-28 sm:pb-28 text-center">
          <Reveal>
            <Eyebrow>For nordic racers &amp; coaches</Eyebrow>
          </Reveal>
          <Reveal
            as="h1"
            delay={60}
            className="mt-5 text-5xl sm:text-6xl font-bold tracking-tight leading-[1.05] max-w-3xl mx-auto">
            <span className="text-gradient">Stop guessing.</span>
            <br />
            Know what&apos;s fast.
          </Reveal>
          <Reveal
            as="p"
            delay={120}
            className="mt-6 text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
            NordicFleet is the logbook for your skis and wax. Track your
            fleet, record every condition, and run head-to-head wax tests
            that finally settle the argument about what to put on race day.
          </Reveal>
          <Reveal
            delay={180}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={APP_URL}
              className="inline-flex items-center justify-center h-12 px-7 rounded-full bg-red text-white font-semibold hover:bg-red-pressed transition-colors">
              Open the app
            </a>
            <Link
              href="/features"
              className="inline-flex items-center justify-center h-12 px-7 rounded-full border border-border-strong text-white font-semibold hover:bg-surface transition-colors">
              See how it works
            </Link>
          </Reveal>
          <Reveal delay={240} className="mt-6 text-text-tertiary text-sm">
            Free to start · iPhone &amp; web · your data stays yours
          </Reveal>
        </Container>
      </section>

      {/* The three things */}
      <Container className="py-12">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              icon: '🎿',
              title: 'Your fleet, organized',
              body: 'Every ski with its grind, flex, and history in one place. Scan a base sticker or import a spreadsheet to get started in minutes.',
            },
            {
              icon: '🧪',
              title: 'Logs that remember',
              body: 'Capture snow, temperature, humidity, and how each ski felt. The conditions you forget by next week are the ones that win races.',
            },
            {
              icon: '🏁',
              title: 'Wax tests that decide',
              body: 'Bracket your wax combinations head-to-head and let the results pick the winner — no more "I think the blue was faster."',
            },
          ].map((f, i) => (
            <Reveal key={f.title} delay={i * 80}>
              <FeatureCard icon={f.icon} title={f.title}>
                {f.body}
              </FeatureCard>
            </Reveal>
          ))}
        </div>
      </Container>

      {/* Wax Truck spotlight */}
      <section className="py-20">
        <Container>
          <div className="rounded-3xl border border-border bg-gradient-to-b from-surface to-bg p-8 sm:p-14">
            <div className="grid gap-10 md:grid-cols-2 md:items-center">
              <div>
                <Eyebrow color="waxtruck">The Wax Truck</Eyebrow>
                <Reveal
                  as="h2"
                  className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight">
                  Run the bracket. Trust the result.
                </Reveal>
                <Reveal
                  as="p"
                  delay={80}
                  className="mt-4 text-text-secondary leading-relaxed">
                  Build your candidate waxes — paraffin, topcoat, structure,
                  anything you can name — and NordicFleet seeds them into a
                  single-elimination bracket. Test two skis at a time, pick
                  the faster one, and advance. When the dust settles you have
                  a winner you can defend, plus the conditions it won in.
                </Reveal>
                <ul className="mt-6 space-y-3">
                  {[
                    'Any wax, any brand — type in what you actually have',
                    'Byes handled automatically for odd fleet sizes',
                    'Record glide-out numbers alongside the head-to-heads',
                    'Send the winner straight to your athletes',
                  ].map(item => (
                    <li
                      key={item}
                      className="flex items-start gap-3 text-sm text-text-secondary">
                      <span className="text-waxtruck mt-0.5">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <Reveal delay={120}>
                <BracketMock />
              </Reveal>
            </div>
          </div>
        </Container>
      </section>

      {/* Coaches teaser */}
      <Container className="py-12">
        <div className="grid gap-5 md:grid-cols-2">
          <Reveal>
            <div className="rounded-2xl border border-border bg-surface p-8 h-full">
              <Eyebrow color="waxtruck">For athletes</Eyebrow>
              <h3 className="mt-3 text-2xl font-semibold">
                One source of truth for your skis
              </h3>
              <p className="mt-3 text-text-secondary leading-relaxed">
                Stop scribbling on tape and losing it in your bag. Keep your
                whole quiver, your wax history, and your test results in your
                pocket.
              </p>
            </div>
          </Reveal>
          <Reveal delay={80}>
            <div className="rounded-2xl border border-border bg-surface p-8 h-full">
              <Eyebrow>For coaches</Eyebrow>
              <h3 className="mt-3 text-2xl font-semibold">
                See your whole team at a glance
              </h3>
              <p className="mt-3 text-text-secondary leading-relaxed">
                Link your athletes, review their fleets, and send race-day
                advisories with the exact wax call — informed by the tests
                you ran that morning.
              </p>
              <Link
                href="/coaches"
                className="inline-block mt-5 text-coaching text-sm font-semibold hover:underline">
                More for coaches →
              </Link>
            </div>
          </Reveal>
        </div>
      </Container>

      {/* Final CTA */}
      <section className="py-20">
        <Container>
          <Reveal className="rounded-3xl border border-border bg-surface p-10 sm:p-14 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Get on the list
            </h2>
            <p className="mt-4 text-text-secondary max-w-xl mx-auto">
              NordicFleet is rolling out to teams and clubs. Leave your email
              and we&apos;ll let you know when the next round of access opens.
            </p>
            <div className="mt-8 max-w-md mx-auto">
              <EmailCapture source="home-cta" />
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}

// A small static bracket illustration — pure CSS, no data.
function BracketMock() {
  const Row = ({label, win}) => (
    <div
      className={
        'flex items-center justify-between rounded-lg border px-3 py-2 text-xs ' +
        (win
          ? 'border-waxtruck/60 bg-waxtruck/[0.08] text-white'
          : 'border-border bg-bg text-text-secondary')
      }>
      <span className="truncate">{label}</span>
      {win && <span className="text-waxtruck">✓</span>}
    </div>
  );
  return (
    <div className="rounded-2xl border border-border bg-bg/60 p-5">
      <div className="grid grid-cols-3 gap-4 items-center">
        <div className="space-y-3">
          <Row label="HF6 + Cera F" win />
          <Row label="LF7 cold" />
          <Row label="HF8 + FC10" win />
          <Row label="Marathon" />
        </div>
        <div className="space-y-8 pt-3">
          <Row label="HF6 + Cera F" win />
          <Row label="HF8 + FC10" />
        </div>
        <div className="flex items-center">
          <Row label="HF6 + Cera F" win />
        </div>
      </div>
      <p className="text-text-tertiary text-[11px] mt-4 text-center">
        Illustrative bracket
      </p>
    </div>
  );
}
