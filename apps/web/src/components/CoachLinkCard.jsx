'use client';

// Athlete-side coach link card. States it covers:
//   - no coach + no outgoing request    → "Add a coach" button
//   - outgoing request pending          → "Request pending to {email}"
//                                         + Cancel button
//   - outgoing request accepted (i.e.
//     athlete is currently linked)      → "Coached by {email}"
//                                         + End button
//   - outgoing request declined         → "Declined" with Dismiss
//
// The "athlete sync" cross-doc write - when status flips to accepted
// or ended, write users/{uid}.coachId - is handled by
// syncCoachIdFromRequests, which we wire to the subscription
// callback.

import {useEffect, useMemo, useState} from 'react';
import {useAuth} from '@/app/providers';
import {Card} from './Card';
import {Button} from './Button';
import {Modal} from './Modal';
import {FormInput} from './forms/FormInput';
import {useToast} from './Toast';
import {
  subscribeOutgoingRequestsForAthlete,
  syncCoachIdFromRequests,
  requestCoach,
  cancelCoachRequest,
  endCoachRequest,
} from '@/lib/firestore';

export function CoachLinkCard({profile}) {
  const {user} = useAuth();
  const toast = useToast();
  const [requests, setRequests] = useState([]);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    if (!user) return undefined;
    const unsub = subscribeOutgoingRequestsForAthlete(user.uid, list => {
      setRequests(list);
      // Keep users/{uid}.coachId in sync with the most-recent accepted
      // request. Fire-and-forget - errors fall back to noop.
      syncCoachIdFromRequests(user.uid, list).catch(() => {});
    });
    return unsub;
  }, [user]);

  // Pick the most recent request relevant for the UI.
  const current = useMemo(() => {
    if (!requests.length) return null;
    const order = {pending: 0, accepted: 1, declined: 2, ended: 3, cancelled: 4};
    const sorted = [...requests].sort((a, b) => {
      const ao = order[a.status] ?? 9;
      const bo = order[b.status] ?? 9;
      if (ao !== bo) return ao - bo;
      const at = a.updatedAt?.seconds || 0;
      const bt = b.updatedAt?.seconds || 0;
      return bt - at;
    });
    return sorted[0];
  }, [requests]);

  const handleCancel = async () => {
    try {
      await cancelCoachRequest(current.id);
      toast.success({title: 'Request cancelled'});
    } catch (err) {
      toast.error({
        title: 'Cancel failed',
        body: String((err && err.message) || err),
      });
    }
  };

  const handleEnd = async () => {
    try {
      await endCoachRequest(current.id);
      toast.success({title: 'Coach link ended'});
    } catch (err) {
      toast.error({
        title: 'End link failed',
        body: String((err && err.message) || err),
      });
    }
  };

  // ── No active request → invite to add ──
  if (!current || current.status === 'ended' || current.status === 'cancelled') {
    return (
      <>
        <Card className="mb-8">
          <p className="text-text-secondary text-sm mb-4">
            Want a coach to see your fleet and send you race plans? Send a
            request - they have to accept before they can see anything.
          </p>
          <Button variant="primary" size="md" onClick={() => setAddOpen(true)}>
            Add a coach
          </Button>
        </Card>
        <AddCoachModal
          open={addOpen}
          onClose={() => setAddOpen(false)}
          athleteUid={user?.uid}
          athleteEmail={profile?.email || user?.email}
        />
      </>
    );
  }

  if (current.status === 'pending') {
    return (
      <Card className="mb-8">
        <div className="flex items-start gap-4">
          <div className="w-2 h-2 rounded-full bg-warning mt-2 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-white font-semibold">Request pending</p>
            <p className="text-text-secondary text-sm mt-1">
              We sent your request to {current.coachEmail}. They&apos;ll
              show up here as your coach once they accept.
            </p>
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            Cancel request
          </Button>
        </div>
      </Card>
    );
  }

  if (current.status === 'accepted') {
    return (
      <Card className="mb-8">
        <div className="flex items-start gap-4">
          <div className="w-2 h-2 rounded-full bg-success mt-2 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-white font-semibold">Coached by {current.coachEmail}</p>
            <p className="text-text-secondary text-sm mt-1">
              They can see your fleet, your logs, and send you race plans.
            </p>
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Button variant="ghost" size="sm" onClick={handleEnd}>
            End coach link
          </Button>
        </div>
      </Card>
    );
  }

  if (current.status === 'declined') {
    return (
      <Card className="mb-8">
        <div className="flex items-start gap-4">
          <div className="w-2 h-2 rounded-full bg-red mt-2 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-white font-semibold">Request declined</p>
            <p className="text-text-secondary text-sm mt-1">
              {current.coachEmail} declined the request. You can try a
              different coach.
            </p>
          </div>
        </div>
        <div className="flex justify-end mt-4 gap-3">
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            Dismiss
          </Button>
          <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}>
            Try a different coach
          </Button>
        </div>
        <AddCoachModal
          open={addOpen}
          onClose={() => setAddOpen(false)}
          athleteUid={user?.uid}
          athleteEmail={profile?.email || user?.email}
        />
      </Card>
    );
  }

  return null;
}

function AddCoachModal({open, onClose, athleteUid, athleteEmail}) {
  const toast = useToast();
  const [coachEmail, setCoachEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setCoachEmail('');
      setError('');
    }
  }, [open]);

  const handleSubmit = async () => {
    setError('');
    if (!coachEmail.trim()) {
      setError("Enter the coach's email.");
      return;
    }
    setSubmitting(true);
    try {
      await requestCoach(athleteUid, athleteEmail, coachEmail.trim());
      toast.success({title: 'Request sent', body: coachEmail.trim()});
      onClose();
    } catch (err) {
      const msg = (err && err.message) || String(err);
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => !submitting && onClose()}
      title="Add a coach"
      footer={
        <>
          <Button
            variant="ghost"
            size="md"
            onClick={onClose}
            disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleSubmit}
            loading={submitting}>
            Send request
          </Button>
        </>
      }>
      <p className="text-text-secondary text-sm mb-4">
        Enter your coach&apos;s email. They&apos;ll see the request on
        their dashboard and have to accept it before they can see your
        fleet.
      </p>
      <FormInput
        label="Coach email"
        type="email"
        value={coachEmail}
        onChange={setCoachEmail}
        autoComplete="email"
        autoCapitalize="none"
        placeholder="coach@example.com"
        error={error || undefined}
      />
    </Modal>
  );
}
