'use client';

// Coach → athlete free-form message composer.
// Subject (optional), body (required), attach a subset of the athlete's
// active skis. Race-day advisory composition is deferred; this is the
// "send a quick note" path.

import {useEffect, useMemo, useState} from 'react';
import Link from 'next/link';
import {useParams, useRouter} from 'next/navigation';
import {useAuth} from '../../../providers';
import {SignedInGuard} from '@/components/SignedInGuard';
import {SiteHeader} from '@/components/SiteHeader';
import {Card} from '@/components/Card';
import {Button} from '@/components/Button';
import {FormInput} from '@/components/forms/FormInput';
import {FormTextarea} from '@/components/forms/FormTextarea';
import {FormChipMultiselect} from '@/components/forms/FormChipMultiselect';
import {useToast} from '@/components/Toast';
import {
  getProfile,
  listSkisForAthlete,
  sendMessage,
} from '@/lib/firestore';

export default function ComposeMessagePage() {
  return (
    <SignedInGuard>
      <Inner />
    </SignedInGuard>
  );
}

function Inner() {
  const {user} = useAuth();
  const router = useRouter();
  const toast = useToast();
  const {athleteId} = useParams();
  const [athlete, setAthlete] = useState(null);
  const [skis, setSkis] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [skiIds, setSkiIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !athleteId) return undefined;
    let cancelled = false;
    Promise.all([getProfile(athleteId), listSkisForAthlete(athleteId)])
      .then(([profile, list]) => {
        if (cancelled) return;
        setAthlete(profile);
        setSkis(list.filter(s => !s.retired));
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [user, athleteId]);

  const skiOptions = useMemo(
    () =>
      skis.map(s => ({
        value: s.id,
        label: s.name || 'Unnamed ski',
        sub: s.technique || '',
      })),
    [skis],
  );

  const handleSend = async () => {
    setError('');
    if (!body.trim()) {
      setError('Write something before sending.');
      return;
    }
    if (!user) {
      setError('Not signed in.');
      return;
    }
    setSubmitting(true);
    try {
      await sendMessage({
        fromUid: user.uid,
        toUid: athleteId,
        body: body.trim(),
        subject: subject.trim() || undefined,
        attachedSkiIds: skiIds,
      });
      toast.success({
        title: 'Message sent',
        body: athlete?.displayName || athlete?.email || '',
      });
      router.replace(`/coach/${athleteId}`);
    } catch (err) {
      setError(String((err && err.message) || err));
    } finally {
      setSubmitting(false);
    }
  };

  const headerLabel =
    athlete?.displayName || athlete?.name || athlete?.email || 'Athlete';

  return (
    <div>
      <SiteHeader role="coach" />
      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-6">
          <Link
            href={`/coach/${athleteId}`}
            className="text-text-secondary text-sm hover:text-white">
            ← Back to {headerLabel}
          </Link>
        </div>
        <h1 className="text-3xl font-bold mb-2">Send a message</h1>
        <p className="text-text-secondary mb-6">To {headerLabel}</p>

        <Card className="space-y-5">
          <FormInput
            label="Subject (optional)"
            value={subject}
            onChange={setSubject}
            placeholder="e.g. Tomorrow's race plan"
          />
          <FormTextarea
            label="Message"
            required
            value={body}
            onChange={setBody}
            rows={6}
            placeholder="Plain text. Markdown isn't rendered."
          />
          <FormChipMultiselect
            label="Attach skis (optional)"
            options={skiOptions}
            value={skiIds}
            onChange={setSkiIds}
            emptyMessage={
              loaded
                ? `${headerLabel} hasn't added any skis yet.`
                : 'Loading…'
            }
          />
          {error && (
            <div className="text-sm text-red bg-red/[0.05] border border-red/40 rounded-2xl p-4">
              {error}
            </div>
          )}
          <div className="flex justify-end">
            <Button
              variant="primary"
              size="md"
              onClick={handleSend}
              loading={submitting}
              disabled={!body.trim() || submitting}>
              Send
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}
