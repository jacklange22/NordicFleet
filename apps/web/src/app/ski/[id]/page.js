'use client';

import {useEffect, useState} from 'react';
import Link from 'next/link';
import {useParams} from 'next/navigation';
import {useAuth} from '../../providers';
import {SignedInGuard} from '@/components/SignedInGuard';
import {SiteHeader} from '@/components/SiteHeader';
import {Card} from '@/components/Card';
import {Pill} from '@/components/Pill';
import {StatCard} from '@/components/StatCard';
import {
  subscribeProfile,
  getSki,
  subscribeWaxLogsForSki,
  subscribeTestLogsForSki,
} from '@/lib/firestore';

function fmtDate(raw) {
  if (!raw) return '—';
  let d = null;
  if (typeof raw?.toDate === 'function') d = raw.toDate();
  else if (raw instanceof Date) d = raw;
  else if (typeof raw === 'string' || typeof raw === 'number')
    d = new Date(raw);
  if (!d || isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function SkiInfoPage() {
  return (
    <SignedInGuard>
      <Inner />
    </SignedInGuard>
  );
}

function Inner() {
  const {user} = useAuth();
  const {id: skiId} = useParams();
  const [ski, setSki] = useState(null);
  const [profile, setProfile] = useState(null);
  const [waxLogs, setWaxLogs] = useState([]);
  const [testLogs, setTestLogs] = useState([]);

  useEffect(() => {
    if (!user || !skiId) return;
    const unsubP = subscribeProfile(user.uid, setProfile);
    getSki(user.uid, skiId).then(setSki);
    const unsubW = subscribeWaxLogsForSki(user.uid, skiId, setWaxLogs);
    const unsubT = subscribeTestLogsForSki(user.uid, skiId, setTestLogs);
    return () => {
      unsubP();
      unsubW();
      unsubT();
    };
  }, [user, skiId]);

  if (!ski) {
    return (
      <div>
        <SiteHeader role={profile?.role === 'coach' ? 'coach' : 'athlete'} />
        <main className="max-w-3xl mx-auto px-6 py-8">
          <p className="text-text-tertiary">Loading ski…</p>
        </main>
      </div>
    );
  }

  return (
    <div>
      <SiteHeader role={profile?.role === 'coach' ? 'coach' : 'athlete'} />
      <main className="max-w-3xl mx-auto px-6 py-8">
        <Link href="/home" className="text-text-secondary text-sm">
          ← Back to fleet
        </Link>

        <Card className="mt-4 mb-6">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            {ski.name}
          </h1>
          {(ski.brand || ski.model) && (
            <p className="text-text-secondary mb-4">
              {[ski.brand, ski.model].filter(Boolean).join(' · ')}
            </p>
          )}
          <div className="flex gap-2 flex-wrap mb-4">
            {ski.technique && <Pill variant="outline">{ski.technique}</Pill>}
            {ski.type && <Pill variant="outline">{ski.type}</Pill>}
          </div>
          <div className="grid grid-cols-3 gap-4 border-t border-border pt-4">
            <MiniStat label="Flex" value={ski.flex ? `${ski.flex} kg` : '—'} />
            <MiniStat
              label="Length"
              value={ski.length ? `${ski.length} cm` : '—'}
            />
            <MiniStat label="Grind" value={ski.grind || '—'} />
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3 mb-8">
          <StatCard value={waxLogs.length} label="Times waxed" />
          <StatCard value={testLogs.length} label="Tests logged" />
        </div>

        <h2 className="text-xs uppercase tracking-wider text-text-tertiary mb-2">
          Wax history
        </h2>
        {waxLogs.length === 0 ? (
          <Card>
            <p className="text-text-tertiary italic">No wax logs yet</p>
          </Card>
        ) : (
          <Card className="divide-y divide-border p-0">
            {waxLogs.slice(0, 10).map(log => (
              <div key={log.id} className="p-4">
                <div className="text-sm font-semibold">{fmtDate(log.date)}</div>
                <div className="text-sm text-text-secondary mt-1">
                  {(log.glideWaxes || []).filter(Boolean).join(', ') || '—'}
                  {log.kickWax && <> · Kick: {log.kickWax}</>}
                </div>
              </div>
            ))}
          </Card>
        )}

        <h2 className="text-xs uppercase tracking-wider text-text-tertiary mb-2 mt-8">
          Test history
        </h2>
        {testLogs.length === 0 ? (
          <Card>
            <p className="text-text-tertiary italic">No tests yet</p>
          </Card>
        ) : (
          <Card className="divide-y divide-border p-0">
            {testLogs.slice(0, 10).map(log => (
              <div key={log.id} className="p-4 flex items-center gap-3">
                <span className="w-9 h-9 rounded-full bg-red flex items-center justify-center text-sm font-bold">
                  {log.glideRating ?? '—'}
                </span>
                <div className="flex-1">
                  <div className="text-sm font-semibold">
                    {[log.snowType, log.surface].filter(Boolean).join(', ') ||
                      'Conditions'}
                  </div>
                  <div className="text-sm text-text-secondary mt-1">
                    {fmtDate(log.date)}
                    {log.temperature !== null && log.temperature !== undefined && (
                      <> · {log.temperature}°C</>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </Card>
        )}

        {ski.notes && (
          <>
            <h2 className="text-xs uppercase tracking-wider text-text-tertiary mb-2 mt-8">
              Notes
            </h2>
            <Card>
              <p className="text-white whitespace-pre-wrap">{ski.notes}</p>
            </Card>
          </>
        )}
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
