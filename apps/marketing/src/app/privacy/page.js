import {LegalLayout, LegalSection} from '@/components/ui';

export const metadata = {
  title: 'Privacy Policy',
  description: 'How NordicFleet collects, uses, and protects your data.',
};

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" updated="May 30, 2026">
      <p className="text-text-secondary leading-relaxed">
        This Privacy Policy explains what information NordicFleet
        (&quot;NordicFleet,&quot; &quot;we,&quot; &quot;us&quot;) collects
        when you use our mobile and web applications and this website
        (together, the &quot;Service&quot;), how we use it, and the choices
        you have. We try to keep this plain and honest. By using the Service
        you agree to the practices described here.
      </p>

      <LegalSection heading="Information we collect">
        <p>We collect the following categories of information:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Account information.</strong> When you create an account
            we collect your email address and authentication credentials,
            which are handled by our authentication provider (Google
            Firebase). We do not store your password.
          </li>
          <li>
            <strong>Profile information.</strong> A display name and whether
            you use the Service as a coach, plus optional details you choose
            to add (for example weight or height).
          </li>
          <li>
            <strong>Content you create.</strong> Your skis, wax logs, test
            logs, wax tests, conditions, locations you type in, and messages
            or advisories you send or receive.
          </li>
          <li>
            <strong>Marketing signups.</strong> If you submit your email on
            our website, we store that email and the page it came from so we
            can contact you about access.
          </li>
          <li>
            <strong>Technical data.</strong> Standard log and device data
            generated when the app talks to our backend (for example error
            reports and timestamps). We do not build advertising profiles.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="How we use information">
        <ul className="list-disc pl-5 space-y-2">
          <li>To provide and operate the Service and your account.</li>
          <li>
            To sync your content across your devices and, where you have
            linked a coach, to make the relevant content available to that
            coach.
          </li>
          <li>To diagnose problems, prevent abuse, and improve the Service.</li>
          <li>
            To contact you about your account or, if you opted in, about
            access and product updates.
          </li>
        </ul>
        <p>
          We do not sell your personal information, and we do not use your
          ski, wax, or test content for advertising. We use your account data
          to provide the Service to you.
        </p>
      </LegalSection>

      <LegalSection heading="What coaches can see">
        <p>
          Your fleet and logs are private by default. They are visible only to
          you unless you explicitly link a coach. When you link a coach, that
          coach can view your skis, wax logs, and test logs and send you
          advisories. Coach access is read-only: a coach cannot edit your
          equipment or logs. Coach profiles are visible to signed-in users so
          that athletes can find their coach by email. You can end a coaching
          link at any time, which removes that coach&apos;s access going
          forward.
        </p>
      </LegalSection>

      <LegalSection heading="Sharing links">
        <p>
          If we offer public share links, a link shows only the specific
          information you choose to include for that share (for example a
          ski&apos;s make and model, or a test result). It does not expose your
          account, your email, or data you did not select. You control how long
          a share link works and can revoke it. Until you create a share link,
          nothing about your fleet is public.
        </p>
      </LegalSection>

      <LegalSection heading="Analytics and product development">
        <p>
          We may analyze how the Service is used to fix problems and decide
          what to build. When we develop analytics or product features from
          usage, our goal is to work with aggregated or de-identified data
          (data combined across many users, or with direct identifiers
          removed) rather than your individual account records. We are not
          claiming this data is fully anonymous: because the Service is tied to
          your account, some data is account-linked, and re-identification can
          be possible in principle. We do not sell this data.
        </p>
      </LegalSection>

      <LegalSection heading="Administrator access">
        <p>
          We want to be straight with you: the Service is not architected so
          that we are technically unable to see your data. Authorized members
          of our team (system administrators) can access account-level data
          when it is genuinely needed, for example to provide support you
          request, to investigate a security issue or abuse, or to debug a
          problem. We aim to limit this to the people and situations that
          require it (a least-privilege goal), and we do not browse user data
          for unrelated reasons.
        </p>
      </LegalSection>

      <LegalSection heading="Service providers">
        <p>
          We use Google Firebase (authentication, Cloud Firestore database,
          and hosting) and Vercel (website hosting) to run the Service. These
          providers process data on our behalf under their own security and
          privacy commitments. Data is stored on their infrastructure, which
          may be located in the United States and other regions.
        </p>
      </LegalSection>

      <LegalSection heading="Data retention, export, and deletion">
        <p>
          We keep your content for as long as your account is active. You can
          edit or delete individual records in the app, and you can export all
          of your data from within the app as a JSON file. You can delete your
          account, which removes your profile and associated content from our
          active database. Provider backups and logs may persist for a limited
          period before being overwritten.
        </p>
      </LegalSection>

      <LegalSection heading="Your rights and choices">
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Access and export.</strong> Export your data from within
            the app as a JSON file.
          </li>
          <li>
            <strong>Correction.</strong> Edit your profile and content at any
            time.
          </li>
          <li>
            <strong>Deletion.</strong> Delete your account and content from the
            app&apos;s settings.
          </li>
          <li>
            <strong>Marketing.</strong> Unsubscribe from any product email we
            send.
          </li>
        </ul>
        <p>
          Depending on where you live, you may have additional rights under
          laws such as the GDPR or CCPA. To exercise any right, contact us at
          the address below.
        </p>
      </LegalSection>

      <LegalSection heading="Children">
        <p>
          The Service is not directed to children under 13, and we do not
          knowingly collect personal information from them. If you believe a
          child has provided us information, contact us and we will remove it.
        </p>
      </LegalSection>

      <LegalSection heading="Security">
        <p>
          We rely on industry-standard measures including encryption in transit
          and authentication for every request. Access to your data is enforced
          by per-user security rules: you can reach your own records, a linked
          coach can read (not write) the athlete data shared with them, and
          public website submissions cannot be read back from the client. We
          aim for least privilege across the system. No system is perfectly
          secure, but we work to protect your data and to limit who can see it.
        </p>
      </LegalSection>

      <LegalSection heading="Changes to this policy">
        <p>
          We may update this Policy as the Service evolves. When we make
          material changes we will update the date above and, where
          appropriate, notify you in the app.
        </p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>
          Questions or requests? Email us at{' '}
          <a className="text-red hover:underline" href="mailto:privacy@nordicfleet.com">
            privacy@nordicfleet.com
          </a>
          .
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
