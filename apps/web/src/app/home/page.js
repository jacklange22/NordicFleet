'use client';

import {useEffect, useState} from 'react';
import Link from 'next/link';
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

  // Capability model: coaches have their own fleet too. /home is the
  // personal-mode surface for everyone — no auto-bounce to /coach.
  // Coaches reach the dashboard via the mode switcher in the header.

  const firstName = profile?.name?.split(/\s+/)?.[0];
  const greeting = firstName ? `Hi, ${firstName}` : 'Welcome back';

  return (
    <div>
      <SiteHeader />
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

        {loaded && skis.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Link href="/log/wax">
              <Card className="hover:bg-surface-elevated transition-colors cursor-pointer h-full">
                <div className="text-xs uppercase tracking-wider text-text-tertiary mb-1">
                  Log
                </div>
                <div className="text-lg font-semibold">Wax a ski →</div>
                <div className="text-text-secondary text-sm mt-1">
                  Record what you ironed in today.
                </div>
              </Card>
            </Link>
            <Link href="/log/test">
              <Card className="hover:bg-surface-elevated transition-colors cursor-pointer h-full">
                <div className="text-xs uppercase tracking-wider text-text-tertiary mb-1">
                  Log
                </div>
                <div className="text-lg font-semibold">Test a ski →</div>
                <div className="text-text-secondary text-sm mt-1">
                  Rate glide / kick / stability on conditions.
                </div>
              </Card>
            </Link>
          </div>
        )}

        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs uppercase tracking-wider text-text-tertiary">
            Your fleet
          </h2>
          {loaded && skis.length > 0 && (
            <div className="flex items-center gap-4">
              <Link
                href="/ski/new"
                className="text-red text-sm hover:text-red-pressed">
                + Add ski
              </Link>
              <Link
                href="/import"
                className="text-text-secondary text-sm hover:text-white">
                Import
              </Link>
            </div>
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
              Add your first ski, or paste a whole fleet from a
              spreadsheet — both work from web.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/ski/new">
                <Button variant="primary" size="md">
                  Add a ski
                </Button>
              </Link>
              <Link href="/import">
                <Button variant="secondary" size="md">
                  Import from spreadsheet
                </Button>
              </Link>
            </div>
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

      </main>
    </div>
  );
}
