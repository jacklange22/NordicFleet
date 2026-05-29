'use client';

// Wax Truck — the coach's list of head-to-head wax tests. Mirrors the
// mobile waxTruck screen: live list newest-first, status + progress,
// and a new-test CTA. Empty state when there are none.

import {useEffect, useState} from 'react';
import Link from 'next/link';
import {bracketProgress} from '@nordicfleet/core';
import {useAuth} from '../providers';
import {SignedInGuard} from '@/components/SignedInGuard';
import {SiteHeader} from '@/components/SiteHeader';
import {Card} from '@/components/Card';
import {Button} from '@/components/Button';
import {subscribeWaxTests} from '@/lib/firestore';

const STATUS_META = {
  setup: {label: 'Setup', cls: 'text-text-tertiary border-text-tertiary'},
  running: {label: 'Running', cls: 'text-waxtruck border-waxtruck'},
  complete: {label: 'Complete', cls: 'text-success border-success'},
};

export default function WaxTruckPage() {
  return (
    <SignedInGuard>
      <Inner />
    </SignedInGuard>
  );
}

function Inner() {
  const {user} = useAuth();
  const [tests, setTests] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return undefined;
    const unsub = subscribeWaxTests(user.uid, list => {
      setTests(list);
      setLoaded(true);
    });
    return unsub;
  }, [user]);

  return (
    <div>
      <SiteHeader />
      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Wax Truck</h1>
            <p className="text-text-secondary mt-1">
              Run a bracket to find the fastest wax for today&apos;s snow.
            </p>
          </div>
          <Link href="/wax-truck/new">
            <Button variant="primary" size="md">
              New test
            </Button>
          </Link>
        </div>

        {!loaded ? (
          <p className="text-text-secondary">Loading…</p>
        ) : tests.length === 0 ? (
          <Card className="text-center py-12">
            <h2 className="text-xl font-semibold mb-2">No tests yet</h2>
            <p className="text-text-secondary max-w-prose mx-auto mb-6">
              Build your wax combinations, generate a single-elimination
              bracket, and run it head-to-head. The winner is your call for
              the day.
            </p>
            <Link href="/wax-truck/new">
              <Button variant="primary" size="md">
                Create your first test
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {tests.map(t => {
              const meta = STATUS_META[t.status] || STATUS_META.setup;
              const combos = Array.isArray(t.combinations)
                ? t.combinations.length
                : 0;
              const progress =
                t.bracket && Array.isArray(t.bracket.rounds)
                  ? bracketProgress(t.bracket)
                  : null;
              return (
                <Link key={t.id} href={`/wax-truck/${t.id}`} className="block">
                  <Card className="hover:border-border-strong transition-colors">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-lg font-semibold truncate">
                        {t.name}
                      </h3>
                      <span
                        className={`shrink-0 text-[11px] font-bold uppercase tracking-wide border rounded-full px-2.5 py-0.5 ${meta.cls}`}>
                        {meta.label}
                      </span>
                    </div>
                    <p className="text-text-secondary text-sm mt-1">
                      {combos} combination{combos === 1 ? '' : 's'}
                      {progress
                        ? progress.complete
                          ? ' · winner decided'
                          : ` · round ${progress.currentRound + 1} of ${progress.totalRounds}`
                        : ''}
                      {t.conditions?.locationLabel
                        ? ` · ${t.conditions.locationLabel}`
                        : ''}
                    </p>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
