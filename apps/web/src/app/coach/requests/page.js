'use client';

// Coach-side pending requests inbox. Each row → Approve / Decline.
// The athlete's client listens on its outgoing request and writes
// users/{athleteUid}.coachId once the status flips to 'accepted'.

import {useEffect, useState} from 'react';
import Link from 'next/link';
import {useAuth} from '../../providers';
import {SignedInGuard} from '@/components/SignedInGuard';
import {SiteHeader} from '@/components/SiteHeader';
import {Card} from '@/components/Card';
import {Button} from '@/components/Button';
import {useToast} from '@/components/Toast';
import {
  subscribePendingRequestsForCoach,
  respondToCoachRequest,
} from '@/lib/firestore';

export default function CoachRequestsPage() {
  return (
    <SignedInGuard>
      <Inner />
    </SignedInGuard>
  );
}

function Inner() {
  const {user} = useAuth();
  const toast = useToast();
  const [pending, setPending] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    if (!user) return undefined;
    const unsub = subscribePendingRequestsForCoach(user.uid, list => {
      setPending(list);
      setLoaded(true);
    });
    return unsub;
  }, [user]);

  const respond = async (id, accept, athleteEmail) => {
    setBusyId(id);
    try {
      await respondToCoachRequest(id, accept);
      toast.success({
        title: accept ? 'Request accepted' : 'Request declined',
        body: athleteEmail,
      });
    } catch (err) {
      toast.error({
        title: 'Update failed',
        body: String((err && err.message) || err),
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <SiteHeader />
      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-6">
          <Link
            href="/coach"
            className="text-text-secondary text-sm hover:text-white">
            ← Back to dashboard
          </Link>
        </div>
        <h1 className="text-3xl font-bold mb-2">Pending requests</h1>
        <p className="text-text-secondary mb-6">
          Athletes who&apos;ve asked you to coach them. Accept to give them
          a coach link + open their fleet for you to see.
        </p>

        {!loaded && (
          <p className="text-text-tertiary text-sm py-12 text-center">
            Loading…
          </p>
        )}

        {loaded && pending.length === 0 && (
          <Card>
            <h3 className="text-xl font-bold mb-2">No pending requests</h3>
            <p className="text-text-secondary text-sm">
              You&apos;re all caught up. New requests will show up here as
              soon as athletes send them.
            </p>
          </Card>
        )}

        <ul className="space-y-3">
          {pending.map(req => (
            <li key={req.id}>
              <Card>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold">
                      {req.athleteEmail}
                    </p>
                    <p className="text-text-secondary text-sm mt-1">
                      Wants you as their coach.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        respond(req.id, false, req.athleteEmail)
                      }
                      disabled={busyId === req.id}>
                      Decline
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() =>
                        respond(req.id, true, req.athleteEmail)
                      }
                      loading={busyId === req.id}>
                      Accept
                    </Button>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
