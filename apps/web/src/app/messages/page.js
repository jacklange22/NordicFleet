'use client';

// Athlete inbox. Newest-first list with unread indicator + a
// concise preview. Each row links to the detail.

import {useEffect, useState} from 'react';
import Link from 'next/link';
import {useAuth} from '../providers';
import {SignedInGuard} from '@/components/SignedInGuard';
import {SiteHeader} from '@/components/SiteHeader';
import {Card} from '@/components/Card';
import {Pill} from '@/components/Pill';
import {subscribeMessagesForAthlete} from '@/lib/firestore';

function fmtRelative(raw) {
  if (!raw) return '';
  let d = null;
  if (typeof raw?.toDate === 'function') d = raw.toDate();
  else if (raw instanceof Date) d = raw;
  else if (typeof raw === 'string' || typeof raw === 'number') {
    d = new Date(raw);
  }
  if (!d || Number.isNaN(d.getTime())) return '';
  const diffMs = Date.now() - d.getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return d.toLocaleDateString(undefined, {month: 'short', day: 'numeric'});
}

export default function MessagesPage() {
  return (
    <SignedInGuard>
      <Inner />
    </SignedInGuard>
  );
}

function Inner() {
  const {user} = useAuth();
  const [messages, setMessages] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return undefined;
    const unsub = subscribeMessagesForAthlete(user.uid, list => {
      setMessages(list);
      setLoaded(true);
    });
    return unsub;
  }, [user]);

  return (
    <div>
      <SiteHeader />
      <main className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold mb-6">Messages</h1>

        {!loaded && (
          <p className="text-text-tertiary text-sm py-12 text-center">
            Loading…
          </p>
        )}

        {loaded && messages.length === 0 && (
          <Card>
            <h3 className="text-xl font-bold mb-2">No messages yet</h3>
            <p className="text-text-secondary text-sm">
              When your coach sends you a message or race-day plan, it
              shows up here.
            </p>
          </Card>
        )}

        <ul className="space-y-3">
          {messages.map(m => (
            <li key={m.id}>
              <Link href={`/messages/${m.id}`}>
                <Card
                  className={
                    'hover:bg-surface-elevated transition-colors cursor-pointer ' +
                    (m.read ? '' : 'border-red/30')
                  }>
                  <div className="flex items-start gap-3">
                    <span
                      className={
                        'w-2 h-2 rounded-full mt-2 flex-shrink-0 ' +
                        (m.read ? 'bg-text-tertiary/50' : 'bg-red')
                      }
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-3">
                        <h3 className="text-base font-semibold truncate">
                          {m.subject ||
                            (m.type === 'advisory'
                              ? m.advisory?.event || 'Race-day plan'
                              : 'Message')}
                        </h3>
                        <span className="text-text-tertiary text-xs whitespace-nowrap">
                          {fmtRelative(m.createdAt)}
                        </span>
                      </div>
                      <p className="text-text-secondary text-sm mt-1 line-clamp-2">
                        {m.body}
                      </p>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {m.type === 'advisory' && (
                          <Pill variant="solid">Race plan</Pill>
                        )}
                        {m.attachedSkiIds?.length > 0 && (
                          <Pill variant="ghost">
                            {m.attachedSkiIds.length} ski
                            {m.attachedSkiIds.length === 1 ? '' : 's'}
                          </Pill>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
