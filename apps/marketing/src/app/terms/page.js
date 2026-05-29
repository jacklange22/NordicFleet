import {LegalLayout, LegalSection} from '@/components/ui';

export const metadata = {
  title: 'Terms of Service',
  description: 'The terms that govern your use of NordicFleet.',
};

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" updated="May 29, 2026">
      <p className="text-text-secondary leading-relaxed">
        These Terms of Service (&quot;Terms&quot;) govern your access to and
        use of NordicFleet&apos;s applications and website (the
        &quot;Service&quot;). By creating an account or using the Service you
        agree to these Terms. If you do not agree, do not use the Service.
      </p>

      <LegalSection heading="Eligibility & accounts">
        <p>
          You must be at least 13 years old to use the Service. You are
          responsible for your account credentials and for activity that
          happens under your account. Keep your login secure and notify us of
          any unauthorized use.
        </p>
      </LegalSection>

      <LegalSection heading="Your content">
        <p>
          You retain ownership of the content you create — your skis, logs,
          tests, and messages. You grant us a limited license to store,
          process, and display that content solely to operate the Service for
          you (and for a coach you have explicitly linked, where applicable).
          You are responsible for the content you submit and for having the
          right to submit it.
        </p>
      </LegalSection>

      <LegalSection heading="Acceptable use">
        <p>You agree not to:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            Access another user&apos;s data without authorization, or attempt
            to circumvent the Service&apos;s privacy and security controls.
          </li>
          <li>
            Upload unlawful, infringing, or harmful content, or use the
            Service to harass others.
          </li>
          <li>
            Interfere with or disrupt the Service, or probe it for
            vulnerabilities except through a responsible disclosure to us.
          </li>
          <li>
            Reverse engineer or resell the Service except as permitted by
            law.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="Coaching relationships">
        <p>
          When an athlete links a coach, the coach gains read-only access to
          that athlete&apos;s equipment and logs, and the coach may send
          advisories and messages to the athlete. Either party may end the
          link at any time. We are not responsible for the content of
          advice exchanged between coaches and athletes.
        </p>
      </LegalSection>

      <LegalSection heading="No guarantee of results">
        <p>
          NordicFleet helps you record and test, but waxing and ski
          performance depend on conditions outside our control. The Service
          is provided for informational purposes and does not guarantee any
          competitive outcome. Decisions you make based on the Service are
          your own.
        </p>
      </LegalSection>

      <LegalSection heading="Availability & changes">
        <p>
          The Service is offered on an &quot;as is&quot; and &quot;as
          available&quot; basis while in active development. We may add,
          change, or remove features, and we may suspend or discontinue the
          Service. We will give reasonable notice of material changes where
          we can.
        </p>
      </LegalSection>

      <LegalSection heading="Disclaimers & limitation of liability">
        <p>
          To the maximum extent permitted by law, the Service is provided
          without warranties of any kind, express or implied. To the maximum
          extent permitted by law, NordicFleet will not be liable for any
          indirect, incidental, or consequential damages, or for any loss of
          data, arising from your use of the Service.
        </p>
      </LegalSection>

      <LegalSection heading="Termination">
        <p>
          You may stop using the Service and delete your account at any time.
          We may suspend or terminate access if you violate these Terms or to
          protect the Service and its users.
        </p>
      </LegalSection>

      <LegalSection heading="Changes to these Terms">
        <p>
          We may update these Terms as the Service evolves. When we make
          material changes we will update the date above and, where
          appropriate, notify you in the app. Continued use after changes
          take effect constitutes acceptance.
        </p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>
          Questions about these Terms? Email us at{' '}
          <a className="text-red hover:underline" href="mailto:support@nordicfleet.com">
            support@nordicfleet.com
          </a>
          .
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
