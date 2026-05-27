'use client';

import {useEffect, useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {useAuth} from '../providers';
import {SignedInGuard} from '@/components/SignedInGuard';
import {SiteHeader} from '@/components/SiteHeader';
import {Card} from '@/components/Card';
import {Pill} from '@/components/Pill';
import {StatCard} from '@/components/StatCard';
import {Button} from '@/components/Button';
import {subscribeProfile, subscribeSkis} from '@/lib/firestore';

export default function HomePage() {
  return (
    <SignedInGuard>
      <HomeInner />
    </SignedInGuard>
  );
}

function HomeInner() {
  const {user} = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [skis, setSkis] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsubP = subscribeProfile(user.uid, setProfile);
    const unsubS = subscribeSkis(user.uid, list => {
      setSkis(list.filter(s => !s.retired));
      setLoaded(true);
    });
    return () => {
      unsubP();
      unsubS();
    };
  }, [user]);

  // Coach accounts get their own dashboard; bounce them there.
  useEffect(() => {
    if (profile && profile.role === 'coach') {
      router.replace('/coach');
    }
  }, [profile, router]);

  const firstName = profile?.name?.split(/\s+/)?.[0];
  const greeting = firstName ? `Hi, ${firstName}` : 'Welcome back';

  return (
    <div>
      <SiteHeader role={profile?.role === 'coach' ? 'coach' : 'athlete'} />
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{greeting}</h1>
          <p className="text-text-secondary">How is the fleet today?</p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8">
          <StatCard value={skis.length} label="Total skis" />
          <StatCard value="—" label="Last wax" />
          <StatCard value="—" label="Tests logged" />
        </div>

        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs uppercase tracking-wider text-text-tertiary">
            Your fleet
          </h2>
          {loaded && skis.length > 0 && (
            <Link
              href="/import"
              className="text-red text-sm hover:text-red-pressed">
              + Import skis
            </Link>
          )}
        </div>

        {!loaded && (
          <p className="text-text-tertiary text-sm py-12 text-center">
            Loading…
          </p>
        )}

        {loaded && skis.length === 0 && (
          <Card>
            <h3 className="text-xl font-bold mb-2">No skis yet</h3>
            <p className="text-text-secondary text-sm mb-4">
              Start your fleet by pasting a list from a spreadsheet, or add
              them one-by-one in the iOS app.
            </p>
            <Link href="/import">
              <Button variant="primary" size="md">
                Import skis →
              </Button>
            </Link>
          </Card>
        )}

        <ul className="space-y-3">
          {skis.map(ski => (
            <li key={ski.id}>
              <Link href={`/ski/${ski.id}`}>
                <Card className="flex items-center gap-4 hover:bg-surface-elevated transition-colors cursor-pointer">
                  <span
                    className="w-1.5 self-stretch -my-5 -ml-5 rounded-l-2xl"
                    style={{
                      backgroundColor:
                        (ski.technique || '').toLowerCase() === 'skate'
                          ? '#7F1D1D'
                          : '#E53935',
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold truncate">
                      {ski.name || 'Unnamed ski'}
                    </h3>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {ski.technique && <Pill>{ski.technique}</Pill>}
                      {ski.type && <Pill>{ski.type}</Pill>}
                      {ski.grind && <Pill>{ski.grind}</Pill>}
                    </div>
                  </div>
                  <span className="text-text-tertiary">›</span>
                </Card>
              </Link>
            </li>
          ))}
        </ul>

        <Card className="mt-8 border-dashed">
          <p className="text-sm text-text-secondary">
            Logging waxes, tests, and editing individual skis still lives in
            the iOS app. The web app handles bulk imports — paste a fleet
            from a spreadsheet to skip the manual entry.
          </p>
        </Card>
      </main>
    </div>
  );
}
