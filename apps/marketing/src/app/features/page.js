import {Container, Eyebrow, FeatureCard} from '@/components/ui';
import {Reveal} from '@/components/Reveal';
import {EmailCapture} from '@/components/EmailCapture';

export const metadata = {
  title: 'Features',
  description:
    'Fleet management, condition logging, the Wax Truck testing bracket, and coaching tools, everything in NordicFleet.',
};

const GROUPS = [
  {
    eyebrow: 'Your fleet',
    title: 'Every ski, every detail',
    cards: [
      {
        icon: '🎿',
        title: 'Fleet management',
        body: 'Brand, model, grind, flex, length, and a running history for each ski. Mark skis retired without losing their records.',
      },
      {
        icon: '📷',
        title: 'Scan a base sticker',
        body: 'Point your camera at a serial sticker and let on-device text recognition pull the model details so you are not typing them by hand.',
      },
      {
        icon: '📥',
        title: 'Spreadsheet import',
        body: 'Already track your quiver in a spreadsheet? Paste it in, map the columns once, and import the whole fleet in one go.',
      },
    ],
  },
  {
    eyebrow: 'Your logs',
    title: 'The notes that win races',
    cards: [
      {
        icon: '🧪',
        title: 'Wax logs',
        body: 'Record the layers you applied with a wax dictionary that suggests real products, or type in whatever you actually used.',
      },
      {
        icon: '🌡️',
        title: 'Condition-rich test logs',
        body: 'Snow type, surface, temperature, humidity, and per-ski ratings for glide, kick, stability, and climbing.',
      },
      {
        icon: '📍',
        title: 'Location tagging',
        body: 'Tag where you tested so results from different venues never get mixed up.',
      },
    ],
  },
  {
    eyebrow: 'The Wax Truck',
    title: 'Testing that produces a decision',
    cards: [
      {
        icon: '🏁',
        title: 'Single-elimination brackets',
        body: 'Seed your wax combinations and run them two at a time. Byes are handled automatically for any fleet size.',
      },
      {
        icon: '✍️',
        title: 'Free-text everything',
        body: 'The category picker and dictionary only ever suggest. Any wax, structure, or hand-mix you can name is fair game.',
      },
      {
        icon: '📊',
        title: 'Numbers + winners',
        body: 'Pair the head-to-head result with objective readings like glide-out distance, then read the final standings.',
      },
    ],
  },
];

export default function FeaturesPage() {
  return (
    <>
      <Container className="pt-16 pb-8 text-center">
        <Reveal>
          <Eyebrow>Features</Eyebrow>
        </Reveal>
        <Reveal
          as="h1"
          delay={60}
          className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight">
          Everything you need between snow checks
        </Reveal>
        <Reveal
          as="p"
          delay={120}
          className="mt-5 text-lg text-text-secondary max-w-2xl mx-auto">
          NordicFleet covers the whole loop, organize your skis, log what
          happens on snow, and test your way to the fastest call.
        </Reveal>
      </Container>

      {GROUPS.map((group, gi) => (
        <Container key={group.title} className="py-10">
          <Reveal>
            <Eyebrow color={gi === 2 ? 'waxtruck' : 'red'}>
              {group.eyebrow}
            </Eyebrow>
            <h2 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight">
              {group.title}
            </h2>
          </Reveal>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {group.cards.map((c, i) => (
              <Reveal key={c.title} delay={i * 70}>
                <FeatureCard icon={c.icon} title={c.title}>
                  {c.body}
                </FeatureCard>
              </Reveal>
            ))}
          </div>
        </Container>
      ))}

      <Container className="py-16">
        <Reveal className="rounded-3xl border border-border bg-surface p-10 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Want in?
          </h2>
          <p className="mt-3 text-text-secondary max-w-xl mx-auto">
            We&apos;re onboarding teams in waves. Drop your email and we&apos;ll
            reach out.
          </p>
          <div className="mt-7 max-w-md mx-auto">
            <EmailCapture source="features-cta" />
          </div>
        </Reveal>
      </Container>
    </>
  );
}
