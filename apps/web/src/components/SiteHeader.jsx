'use client';

import {useEffect, useState} from 'react';
import Link from 'next/link';
import {usePathname, useRouter} from 'next/navigation';
import {useAuth} from '@/app/providers';
import {useMode} from '@/components/ModeProvider';
import {subscribeUnreadCountForAthlete} from '@/lib/firestore';

// Nav per mode. Personal = the skier surface; coaching = the
// athlete-management surface. The mode prop on the old API is gone —
// the header reads mode straight from ModeProvider now.
const PERSONAL_NAV = [
  {href: '/home', label: 'Fleet'},
  {href: '/messages', label: 'Messages', showUnread: true},
  {href: '/profile', label: 'Profile'},
];
const COACHING_NAV = [
  {href: '/coach', label: 'Athletes'},
  {href: '/coach/requests', label: 'Requests'},
  {href: '/profile', label: 'Profile'},
];
const WAXTRUCK_NAV = [
  {href: '/wax-truck', label: 'Tests'},
  {href: '/profile', label: 'Profile'},
];
const MODE_HOME = {
  personal: '/home',
  coaching: '/coach',
  waxtruck: '/wax-truck',
};
const MODE_NAV = {
  personal: PERSONAL_NAV,
  coaching: COACHING_NAV,
  waxtruck: WAXTRUCK_NAV,
};
const MODE_ACCENT_TEXT = {
  personal: 'text-red',
  coaching: 'text-coaching',
  waxtruck: 'text-waxtruck',
};

export function SiteHeader() {
  const {user, signOut} = useAuth();
  const {mode, setMode, isCoach} = useMode();
  const pathname = usePathname();
  const router = useRouter();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user || mode !== 'personal') {
      setUnread(0);
      return undefined;
    }
    return subscribeUnreadCountForAthlete(user.uid, setUnread);
  }, [user, mode]);

  const items = MODE_NAV[mode] || PERSONAL_NAV;
  const accentText = MODE_ACCENT_TEXT[mode] || 'text-red';

  const switchMode = next => {
    if (next === mode) return;
    setMode(next);
    router.push(MODE_HOME[next]);
  };

  return (
    <header className="bg-surface border-b border-border">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Link
            href={MODE_HOME[mode] || '/home'}
            className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight">
              NordicFleet
            </span>
          </Link>
          {isCoach && (
            <ModeSwitcher mode={mode} onSwitch={switchMode} />
          )}
        </div>
        <nav className="flex items-center gap-5 sm:gap-6 flex-wrap">
          {items.map(item => {
            const active =
              item.href === '/home'
                ? pathname === '/home'
                : item.href === '/coach'
                  ? pathname === '/coach'
                  : pathname.startsWith(item.href);
            const badge = item.showUnread && unread > 0 ? unread : null;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  'relative text-sm transition-colors ' +
                  (active
                    ? `${accentText} font-semibold`
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

function ModeSwitcher({mode, onSwitch}) {
  return (
    <div className="inline-flex items-center rounded-full border border-border bg-bg p-0.5">
      <SegmentButton
        label="My Fleet"
        active={mode === 'personal'}
        activeClass="bg-red text-white"
        onClick={() => onSwitch('personal')}
      />
      <SegmentButton
        label="Coaching"
        active={mode === 'coaching'}
        activeClass="bg-coaching text-white"
        onClick={() => onSwitch('coaching')}
      />
      <SegmentButton
        label="Wax Truck"
        active={mode === 'waxtruck'}
        activeClass="bg-waxtruck text-black"
        onClick={() => onSwitch('waxtruck')}
      />
    </div>
  );
}

function SegmentButton({label, active, activeClass, onClick}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={
        'px-3 py-1 rounded-full text-xs font-semibold tracking-wide transition-colors ' +
        (active ? activeClass : 'text-text-secondary hover:text-white')
      }>
      {label}
    </button>
  );
}
