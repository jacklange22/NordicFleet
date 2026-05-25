'use client';

import {useEffect, useState} from 'react';
import {useAuth} from '../providers';
import {SignedInGuard} from '@/components/SignedInGuard';
import {SiteHeader} from '@/components/SiteHeader';
import {Card} from '@/components/Card';
import {StatCard} from '@/components/StatCard';
import {subscribeProfile, subscribeAthletesForCoach} from '@/lib/firestore';

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
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsubP = subscribeProfile(user.uid, setProfile);
    const unsubA = subscribeAthletesForCoach(user.uid, list => {
      setAthletes(list);
      setLoaded(true);
    });
    return () => {
      unsubP();
      unsubA();
    };
  }, [user]);

  return (
    <div>
      <SiteHeader role="coach" />
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">My athletes</h1>
          <p className="text-text-secondary">
            {profile?.email && `Signed in as ${profile.email}`}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8">
          <StatCard value={athletes.length} label="Athletes" />
          <StatCard value="—" label="Total skis" />
          <StatCard value="—" label="Tests / wk" />
        </div>

        {!loaded && (
          <p className="text-text-tertiary text-sm py-12 text-center">
            Loading…
          </p>
        )}

        {loaded && athletes.length === 0 && (
          <Card>
            <h3 className="text-xl font-bold mb-2">No athletes yet</h3>
            <p className="text-text-secondary text-sm">
              Share your account email with athletes so they can request you
              as their coach during signup. Coach acceptance happens in the
              iOS app for now.
            </p>
          </Card>
        )}

        <ul className="space-y-3">
          {athletes.map(a => (
            <li key={a.uid}>
              <Card>
                <h3 className="text-lg font-semibold">
                  {a.displayName || a.email || 'Athlete'}
                </h3>
                {a.email && a.email !== a.displayName && (
                  <p className="text-text-secondary text-sm mt-1">{a.email}</p>
                )}
                {a.team && (
                  <p className="text-text-tertiary text-sm mt-1">{a.team}</p>
                )}
              </Card>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
