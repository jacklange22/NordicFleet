'use client';

import Link from 'next/link';
import {usePathname, useRouter} from 'next/navigation';
import {useAuth} from '@/app/providers';

const NAV = [
  {href: '/home', label: 'Home', roles: ['athlete']},
  {href: '/coach', label: 'Athletes', roles: ['coach']},
  {href: '/profile', label: 'Profile', roles: ['athlete', 'coach']},
];

export function SiteHeader({role = 'athlete'}) {
  const {user, signOut} = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const items = NAV.filter(item => item.roles.includes(role));

  return (
    <header className="bg-surface border-b border-border">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href={role === 'coach' ? '/coach' : '/home'} className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight">NordicFleet</span>
        </Link>
        <nav className="flex items-center gap-6">
          {items.map(item => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  active
                    ? 'text-red font-semibold text-sm'
                    : 'text-text-secondary hover:text-white text-sm'
                }>
                {item.label}
              </Link>
            );
          })}
          {user && (
            <button
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
