'use client';

import {useEffect, useState} from 'react';
import Link from 'next/link';
import {useAuth} from '../providers';
import {SignedInGuard} from '@/components/SignedInGuard';
import {SiteHeader} from '@/components/SiteHeader';
import {Card} from '@/components/Card';
import {StatCard} from '@/components/StatCard';
import {
  subscribeProfile,
  subscribeAthletesForCoach,
  subscribePendingRequestsForCoach,
} from '@/lib/firestore';

export default function CoachDashboardPage() {
  return (
    <SignedInGuard>
      <Inner />
    </SignedInGuard>
  );
}

function Inner() {
  const {user} = useAuth();
  const [profile, setProfile] = useState(null);
  const [athletes, setAthletes] = useState([]);
  const [pending, setPending] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsubP = subscribeProfile(user.uid, setProfile);
    const unsubA = subscribeAthletesForCoach(user.uid, list => {
      setAthletes(list);
      setLoaded(true);
    });
    const unsubR = subscribePendingRequestsForCoach(user.uid, setPending);
    return () => {
      unsubP();
      unsubA();
      unsubR();
    };
  }, [user]);

  return (
    <div>
      <SiteHeader />
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">My athletes</h1>
          <p className="text-text-secondary">
            {profile?.email && `Signed in as ${profile.email}`}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8">
          <StatCard value={athletes.length} label="Athletes" />
          <StatCard value="-" label="Total skis" />
          <StatCard value="-" label="Tests / wk" />
        </div>

        {pending.length > 0 && (
          <Link href="/coach/requests">
            <Card className="mb-6 border-red/40 bg-red/[0.04] hover:bg-red/[0.08] transition-colors cursor-pointer">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-white font-semibold">
                    {pending.length} pending request
                    {pending.length === 1 ? '' : 's'}
                  </p>
                  <p className="text-text-secondary text-sm mt-1">
                    {pending
                      .slice(0, 2)
                      .map(r => r.athleteEmail)
                      .join(', ')}
                    {pending.length > 2 ? ` + ${pending.length - 2} more` : ''}
                  </p>
                </div>
                <span className="text-red text-sm">Review →</span>
              </div>
            </Card>
          </Link>
        )}

        {!loaded && (
          <p className="text-text-tertiary text-sm py-12 text-center">
            Loading…
          </p>
        )}

        {loaded && athletes.length === 0 && pending.length === 0 && (
          <Card>
            <h3 className="text-xl font-bold mb-2">No athletes yet</h3>
            <p className="text-text-secondary text-sm">
              Share your account email with athletes - they can send you a
              coaching request from their profile, and you&apos;ll see it
              show up here.
            </p>
          </Card>
        )}

        <ul className="space-y-3">
          {athletes.map(a => (
            <li key={a.uid}>
              <Link href={`/coach/${a.uid}`}>
                <Card className="hover:bg-surface-elevated transition-colors cursor-pointer">
                  <h3 className="text-lg font-semibold">
                    {a.displayName || a.name || a.email || 'Athlete'}
                  </h3>
                  {a.email && a.email !== (a.displayName || a.name) && (
                    <p className="text-text-secondary text-sm mt-1">
                      {a.email}
                    </p>
                  )}
                  {a.team && (
                    <p className="text-text-tertiary text-sm mt-1">{a.team}</p>
                  )}
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
