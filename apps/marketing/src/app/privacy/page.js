import {LegalLayout, LegalSection} from '@/components/ui';

export const metadata = {
  title: 'Privacy Policy',
  description: 'How NordicFleet collects, uses, and protects your data.',
};

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" updated="May 29, 2026">
      <p className="text-text-secondary leading-relaxed">
        This Privacy Policy explains what information NordicFleet
        (&quot;NordicFleet,&quot; &quot;we,&quot; &quot;us&quot;) collects
        when you use our mobile and web applications and this website
        (together, the &quot;Service&quot;), how we use it, and the choices
        you have. By using the Service you agree to the practices described
        here.
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
            to add.
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
            generated when software talks to our backend (for example, error
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
          ski, wax, or test content for advertising.
        </p>
      </LegalSection>

      <LegalSection heading="How your content is shared">
        <p>
          Your fleet and logs are private by default. They are visible only
          to you and, if you explicitly link a coach, to that coach. Coach
          access is read-only for an athlete&apos;s equipment and logs.
          Coach profiles are visible to signed-in users so athletes can find
          their coach by email. You can end a coaching link at any time.
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

      <LegalSection heading="Data retention">
        <p>
          We keep your content for as long as your account is active. You can
          delete individual records in the app. You can also delete your
          account, which removes your profile and associated content from our
          active database; backups and provider logs may persist for a
          limited period before being overwritten.
        </p>
      </LegalSection>

      <LegalSection heading="Your rights and choices">
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Access &amp; export.</strong> You can export your data
            from within the app as a JSON file.
          </li>
          <li>
            <strong>Correction.</strong> You can edit your profile and
            content at any time.
          </li>
          <li>
            <strong>Deletion.</strong> You can delete your account and
            content from the app&apos;s settings.
          </li>
          <li>
            <strong>Marketing.</strong> You can unsubscribe from any product
            email we send.
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
          We rely on industry-standard measures provided by our
          infrastructure partners, including encryption in transit and
          access controls scoped to each user. No system is perfectly secure,
          but we work to protect your data and to limit who can see it.
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
