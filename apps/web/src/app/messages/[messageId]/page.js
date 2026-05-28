'use client';

// Athlete message detail. Renders free-form messages as a sender +
// body card with optional attached-ski links. When the message
// type === 'advisory', branches into the structured race-day-plan
// view that mirrors iOS MessageDetail.

import {useEffect, useState} from 'react';
import Link from 'next/link';
import {useParams} from 'next/navigation';
import {useAuth} from '../../providers';
import {SignedInGuard} from '@/components/SignedInGuard';
import {SiteHeader} from '@/components/SiteHeader';
import {Card} from '@/components/Card';
import {Pill} from '@/components/Pill';
import {
  getMessage,
  subscribeSki,
  markMessageRead,
} from '@/lib/firestore';

function fmtFull(raw) {
  if (!raw) return '';
  let d = null;
  if (typeof raw?.toDate === 'function') d = raw.toDate();
  else if (raw instanceof Date) d = raw;
  else if (typeof raw === 'string' || typeof raw === 'number') {
    d = new Date(raw);
  }
  if (!d || Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function fmtEventDate(iso) {
  if (typeof iso !== 'string') return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function daysFromTodayTo(iso) {
  if (typeof iso !== 'string') return null;
  const event = new Date(iso);
  if (Number.isNaN(event.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  event.setHours(0, 0, 0, 0);
  return Math.round(
    (event.getTime() - today.getTime()) / (24 * 60 * 60 * 1000),
  );
}

export default function MessageDetailPage() {
  return (
    <SignedInGuard>
      <Inner />
    </SignedInGuard>
  );
}

function Inner() {
  const {user} = useAuth();
  const {messageId} = useParams();
  const [msg, setMsg] = useState(null);
  const [attachedSkis, setAttachedSkis] = useState({});

  useEffect(() => {
    if (!user || !messageId) return undefined;
    let cancelled = false;
    getMessage(messageId).then(m => {
      if (cancelled) return;
      setMsg(m);
      if (m && user.uid === m.toUid && !m.read) {
        markMessageRead(messageId).catch(() => {});
      }
    });
    return () => {
      cancelled = true;
    };
  }, [user, messageId]);

  // Live-subscribe to each attached ski (they live under the athlete,
  // m.toUid) so a rename shows up without a reload.
  useEffect(() => {
    if (!msg) return undefined;
    const ids = msg.attachedSkiIds || [];
    const unsubs = ids.map(id =>
      subscribeSki(msg.toUid, id, ski => {
        setAttachedSkis(prev => ({...prev, [id]: ski}));
      }),
    );
    return () => unsubs.forEach(u => u && u());
  }, [msg]);

  if (!msg) {
    return (
      <div>
        <SiteHeader />
        <main className="max-w-2xl mx-auto px-6 py-8">
          <p className="text-text-tertiary">Loading…</p>
        </main>
      </div>
    );
  }

  const isAdvisory = msg.type === 'advisory' && msg.advisory;

  return (
    <div>
      <SiteHeader />
      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-6">
          <Link
            href="/messages"
            className="text-text-secondary text-sm hover:text-white">
            ← Inbox
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">
            {msg.subject ||
              (isAdvisory ? 'Race-day plan' : 'Message')}
          </h1>
          <p className="text-text-tertiary text-sm mt-1">
            {fmtFull(msg.createdAt)}
          </p>
        </div>

        {isAdvisory ? (
          <AdvisoryView
            advisory={msg.advisory}
            body={msg.body}
            attachedSkis={attachedSkis}
          />
        ) : (
          <FreeformView msg={msg} attachedSkis={attachedSkis} />
        )}
      </main>
    </div>
  );
}

function FreeformView({msg, attachedSkis}) {
  return (
    <>
      <Card>
        <p className="text-white whitespace-pre-wrap leading-relaxed">
          {msg.body}
        </p>
      </Card>

      {msg.attachedSkiIds?.length > 0 && (
        <>
          <h2 className="text-xs uppercase tracking-wider text-text-tertiary mb-2 mt-6">
            Attached skis
          </h2>
          <ul className="space-y-2">
            {msg.attachedSkiIds.map(id => {
              const ski = attachedSkis[id];
              if (!ski) {
                return (
                  <li key={id}>
                    <Card>
                      <p className="text-text-tertiary text-sm italic">
                        Loading ski…
                      </p>
                    </Card>
                  </li>
                );
              }
              return (
                <li key={id}>
                  <Link href={`/ski/${id}`}>
                    <Card className="hover:bg-surface-elevated transition-colors cursor-pointer">
                      <h3 className="text-base font-semibold">{ski.name}</h3>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {ski.technique && <Pill>{ski.technique}</Pill>}
                        {ski.type && <Pill>{ski.type}</Pill>}
                        {ski.grind && <Pill>{ski.grind}</Pill>}
                      </div>
                    </Card>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </>
  );
}

function AdvisoryView({advisory, body, attachedSkis}) {
  const conditions = advisory.conditions || null;
  const recs = advisory.skiRecommendations || [];
  const days = daysFromTodayTo(advisory.eventDate);

  return (
    <>
      <Card className="mb-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-red/15 border border-red/40 flex items-center justify-center flex-shrink-0">
            <span className="text-red text-lg">⚑</span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-tight">
              {advisory.event}
            </h2>
            <p className="text-text-secondary text-sm mt-1">
              {fmtEventDate(advisory.eventDate)}
              {days != null && days >= 0 && (
                <>
                  {' · '}
                  {days === 0
                    ? 'today'
                    : days === 1
                      ? 'tomorrow'
                      : `in ${days} days`}
                </>
              )}
            </p>
          </div>
        </div>
      </Card>

      {conditions && hasAnyCondition(conditions) && (
        <>
          <h2 className="text-xs uppercase tracking-wider text-text-tertiary mb-2">
            Conditions
          </h2>
          <Card className="mb-6">
            <div className="grid grid-cols-2 gap-4">
              {conditions.snowType && (
                <ConditionTile label="Snow" value={cap(conditions.snowType)} />
              )}
              {conditions.snowTemperature != null && (
                <ConditionTile
                  label="Snow temp"
                  value={`${conditions.snowTemperature}°C`}
                />
              )}
              {conditions.airTemperature != null && (
                <ConditionTile
                  label="Air temp"
                  value={`${conditions.airTemperature}°C`}
                />
              )}
              {conditions.humidity != null && (
                <ConditionTile
                  label="Humidity"
                  value={`${conditions.humidity}%`}
                />
              )}
              {conditions.newSnow && (
                <ConditionTile label="Snow" value="Falling / fresh" />
              )}
            </div>
            {conditions.notes && (
              <p className="text-text-secondary text-sm mt-4 leading-relaxed">
                {conditions.notes}
              </p>
            )}
          </Card>
        </>
      )}

      <h2 className="text-xs uppercase tracking-wider text-text-tertiary mb-2">
        Ski plan
      </h2>
      <ul className="space-y-3 mb-6">
        {recs.map(rec => {
          const ski = attachedSkis[rec.skiId];
          const isPrimary = rec.role === 'primary';
          return (
            <li key={rec.skiId}>
              <Link href={`/ski/${rec.skiId}`}>
                <Card
                  className={
                    'hover:bg-surface-elevated transition-colors cursor-pointer border-2 ' +
                    (isPrimary ? 'border-red/60' : 'border-warning/60')
                  }>
                  <div className="flex items-baseline justify-between gap-3 mb-2">
                    <span
                      className={
                        'inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ' +
                        (isPrimary
                          ? 'bg-red text-white'
                          : 'bg-warning text-black')
                      }>
                      {isPrimary ? 'Primary' : 'Backup'}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold">
                    {ski?.name || 'Loading…'}
                  </h3>
                  {ski && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {ski.technique && <Pill>{ski.technique}</Pill>}
                      {ski.type && <Pill>{ski.type}</Pill>}
                      {ski.grind && <Pill>{ski.grind}</Pill>}
                    </div>
                  )}
                  {rec.notes && (
                    <p className="text-text-secondary text-sm mt-3 border-t border-border pt-3 leading-relaxed">
                      {rec.notes}
                    </p>
                  )}
                </Card>
              </Link>
            </li>
          );
        })}
      </ul>

      {body && body !== advisory.event && (
        <>
          <h2 className="text-xs uppercase tracking-wider text-text-tertiary mb-2">
            Coach&apos;s note
          </h2>
          <Card>
            <p className="text-white whitespace-pre-wrap leading-relaxed">
              {body}
            </p>
          </Card>
        </>
      )}
    </>
  );
}

function ConditionTile({label, value}) {
  return (
    <div>
      <div className="text-text-tertiary text-[10px] uppercase tracking-wider">
        {label}
      </div>
      <div className="text-white text-base font-semibold mt-1">{value}</div>
    </div>
  );
}

function hasAnyCondition(c) {
  return (
    c &&
    (c.snowType ||
      c.snowTemperature != null ||
      c.airTemperature != null ||
      c.humidity != null ||
      c.newSnow ||
      c.notes)
  );
}

function cap(s) {
  return typeof s === 'string' && s
    ? s[0].toUpperCase() + s.slice(1)
    : s;
}
