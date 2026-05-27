'use client';

import {useEffect, useState} from 'react';
import Link from 'next/link';
import {usePathname, useRouter} from 'next/navigation';
import {useAuth} from '@/app/providers';
import {subscribeUnreadCountForAthlete} from '@/lib/firestore';

const NAV = [
  {href: '/home', label: 'Fleet', roles: ['athlete']},
  {href: '/messages', label: 'Messages', roles: ['athlete'], showUnread: true},
  {href: '/coach', label: 'Athletes', roles: ['coach']},
  {href: '/coach/requests', label: 'Requests', roles: ['coach']},
  {href: '/profile', label: 'Profile', roles: ['athlete', 'coach']},
];

export function SiteHeader({role = 'athlete'}) {
  const {user, signOut} = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [unread, setUnread] = useState(0);
  const items = NAV.filter(item => item.roles.includes(role));

  useEffect(() => {
    if (!user || role !== 'athlete') {
      return undefined;
    }
    const unsub = subscribeUnreadCountForAthlete(user.uid, setUnread);
    return unsub;
  }, [user, role]);

  return (
    <header className="bg-surface border-b border-border">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
        <Link
          href={role === 'coach' ? '/coach' : '/home'}
          className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight">NordicFleet</span>
        </Link>
        <nav className="flex items-center gap-5 sm:gap-6 flex-wrap">
          {items.map(item => {
            const active =
              item.href === '/home'
                ? pathname === '/home'
                : item.href === '/coach'
                  ? pathname === '/coach'
                  : pathname.startsWith(item.href);
            const badge =
              item.showUnread && unread > 0 ? unread : null;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  'relative text-sm transition-colors ' +
                  (active
                    ? 'text-red font-semibold'
                    : 'text-text-secondary hover:text-white')
                }>
                {item.label}
                {badge != null && (
                  <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full bg-red text-white text-[10px] font-bold tabular-nums align-middle">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </Link>
            );
          })}
          {user && (
            <button
              type="button"
              onClick={async () => {
                await signOut();
                router.push('/login');
              }}
              className="text-text-tertiary hover:text-white text-sm">
              Sign out
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
