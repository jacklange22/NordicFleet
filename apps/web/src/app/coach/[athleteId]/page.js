'use client';

// Coach view of a single athlete: their profile snippet + read-only
// fleet list. Each ski links to /ski/[id] but ownerUid is the athlete's
// — we surface a notice on SkiInfo, but for now this page only links
// to the ski-detail with the existing route (which reads from the
// athlete's user doc). The mobile equivalent passes ownerUid via
// route params; we omit that here because the deployed /ski/[id]
// route currently reads only from user.uid — which means a coach
// clicking a ski won't see the athlete's data. Documented as a known
// gap in MORNING_REPORT.

import {useEffect, useState} from 'react';
import Link from 'next/link';
import {useParams} from 'next/navigation';
import {useAuth} from '../../providers';
import {SignedInGuard} from '@/components/SignedInGuard';
import {SiteHeader} from '@/components/SiteHeader';
import {Card} from '@/components/Card';
import {Pill} from '@/components/Pill';
import {Button} from '@/components/Button';
import {getProfile, listSkisForAthlete} from '@/lib/firestore';

export default function AthleteDetailPage() {
  return (
    <SignedInGuard>
      <Inner />
    </SignedInGuard>
  );
}

function Inner() {
  const {user} = useAuth();
  const {athleteId} = useParams();
  const [athlete, setAthlete] = useState(null);
  const [skis, setSkis] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !athleteId) return undefined;
    let cancelled = false;
    setLoading(true);
    Promise.all([getProfile(athleteId), listSkisForAthlete(athleteId)])
      .then(([profile, list]) => {
        if (cancelled) return;
        setAthlete(profile);
        setSkis(list.filter(s => !s.retired));
      })
      .catch(() => {
        // SignedInGuard handles auth; permission errors land null/[].
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, athleteId]);

  const headerLabel =
    athlete?.displayName || athlete?.name || athlete?.email || 'Athlete';

  return (
    <div>
      <SiteHeader />
      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/coach"
            className="text-text-secondary text-sm hover:text-white">
            ← Back to dashboard
          </Link>
          <Link
            href={`/coach/${athleteId}/compose`}
            className="text-red text-sm hover:text-red-pressed">
            Compose message →
          </Link>
        </div>

        <Card className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight mb-1">
            {headerLabel}
          </h1>
          {athlete?.email && athlete.email !== headerLabel && (
            <p className="text-text-secondary text-sm">{athlete.email}</p>
          )}
          {athlete?.team && (
            <p className="text-text-tertiary text-sm mt-1">{athlete.team}</p>
          )}
          <div className="grid grid-cols-3 gap-4 border-t border-border pt-4 mt-4">
            <MiniStat
              label="Weight"
              value={athlete?.weight ? `${athlete.weight} kg` : '—'}
            />
            <MiniStat
              label="Height"
              value={athlete?.height ? `${athlete.height} cm` : '—'}
            />
            <MiniStat label="Skis" value={`${skis.length}`} />
          </div>
        </Card>

        <h2 className="text-xs uppercase tracking-wider text-text-tertiary mb-3">
          Fleet
        </h2>
        {loading && (
          <p className="text-text-tertiary text-sm py-8 text-center">
            Loading…
          </p>
        )}
        {!loading && skis.length === 0 && (
          <Card>
            <p className="text-text-tertiary text-sm italic">
              {headerLabel} hasn&apos;t added any skis yet.
            </p>
          </Card>
        )}
        <ul className="space-y-3">
          {skis.map(ski => (
            <li key={ski.id}>
              <Card>
                <h3 className="text-lg font-semibold">
                  {ski.name || 'Unnamed ski'}
                </h3>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {ski.technique && <Pill>{ski.technique}</Pill>}
                  {ski.type && <Pill>{ski.type}</Pill>}
                  {ski.grind && <Pill>{ski.grind}</Pill>}
                </div>
                {(ski.flex || ski.length) && (
                  <p className="text-text-tertiary text-xs mt-2">
                    {ski.length ? `${ski.length} cm` : ''}
                    {ski.length && ski.flex ? ' · ' : ''}
                    {ski.flex ? `${ski.flex} kg` : ''}
                  </p>
                )}
              </Card>
            </li>
          ))}
        </ul>

        <Card className="mt-6 border-dashed">
          <p className="text-sm text-text-secondary">
            Tap a ski card to see its detail on iOS for now — the ski-detail
            page on web is owner-only. Coach-side ski detail is a known gap
            for a future session.
          </p>
        </Card>
      </main>
    </div>
  );
}

function MiniStat({label, value}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-text-tertiary mb-1">
        {label}
      </div>
      <div className="text-base font-semibold text-white">{value}</div>
    </div>
  );
}
