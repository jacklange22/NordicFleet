import {Container, Eyebrow} from '@/components/ui';
import {Reveal} from '@/components/Reveal';
import {EmailCapture} from '@/components/EmailCapture';

export const metadata = {
  title: 'About',
  description:
    'Why we built NordicFleet: a practical logbook for skiers and coaches who want better ski, wax, and testing records.',
};

export default function AboutPage() {
  return (
    <>
      <Container className="pt-16 pb-8">
        <div className="max-w-3xl">
          <Reveal>
            <Eyebrow>About</Eyebrow>
          </Reveal>
          <Reveal
            as="h1"
            delay={60}
            className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight">
            Built for cold mornings and fast skis
          </Reveal>
        </div>
      </Container>

      <Container className="pb-10">
        <div className="max-w-3xl space-y-6 text-text-secondary leading-relaxed text-lg">
          <Reveal as="p">
            Nordic racing runs on details that are easy to forget. Which grind
            was fast in wet snow. What you layered under the topcoat at -8.
            Which ski felt alive on the climbs last winter. By the next race,
            half of it has evaporated, or it&apos;s on a strip of tape at the
            bottom of a wax box.
          </Reveal>
          <Reveal as="p" delay={60}>
            NordicFleet started as a simple idea: keep all of it in one place,
            on the phone that&apos;s already in your pocket. Your fleet, your
            logs, your tests. Then make the testing itself rigorous, not a
            vague memory of &quot;I think the blue was faster,&quot; but a
            bracket that produces a winner you can stand behind.
          </Reveal>
          <Reveal as="p" delay={120}>
            We care about two things above features: that the data is honest,
            and that it&apos;s yours. The wax dictionary suggests but never
            blocks, if you mixed something nobody sells, type it in and test
            it. And your fleet is private to you and the coach you choose to
            share it with. Nothing more.
          </Reveal>
        </div>
      </Container>

      <Container className="py-16">
        <Reveal className="rounded-3xl border border-border bg-surface p-10 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Come ski with us
          </h2>
          <p className="mt-3 text-text-secondary max-w-xl mx-auto">
            We&apos;re a small team shipping fast. Tell us what your wax room
            needs.
          </p>
          <div className="mt-7 max-w-md mx-auto">
            <EmailCapture source="about-cta" />
          </div>
        </Reveal>
      </Container>
    </>
  );
}
