'use client';

import {useEffect} from 'react';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import {useAuth} from './providers';
import {Button} from '@/components/Button';

// Marketing landing. Bounces signed-in users to /home; everyone else
// gets a one-screen pitch + Get-started CTA. Keep this lean - the
// purpose is to demo NordicFleet to people who can't or won't install
// the iOS app yet.

const FEATURES = [
  {label: 'Track every wax & test session'},
  {label: 'Share your fleet with your coach'},
  {label: 'Works offline, syncs automatically'},
];

export default function Landing() {
  const {user, loading} = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/home');
    }
  }, [loading, user, router]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold tracking-tight mb-3">
            NordicFleet
          </h1>
          <p className="text-text-secondary text-lg">
            Track and manage your nordic skis like a pro team.
          </p>
        </div>

        <ul className="space-y-4 mb-12">
          {FEATURES.map(f => (
            <li
              key={f.label}
              className="flex items-center gap-4 bg-surface border border-border rounded-2xl px-5 py-4">
              <div className="w-10 h-10 rounded-full bg-red/15 border border-red/25 flex items-center justify-center text-red text-lg">
                ✓
              </div>
              <span className="text-white">{f.label}</span>
            </li>
          ))}
        </ul>

        <div className="space-y-3">
          <Link href="/signup">
            <Button variant="primary" size="lg" fullWidth>
              Get started →
            </Button>
          </Link>
          <Link href="/login" className="block">
            <Button variant="ghost" size="md" fullWidth>
              I already have an account
            </Button>
          </Link>
        </div>

        <p className="text-text-tertiary text-xs text-center mt-10">
          Web preview · For the full experience, use the NordicFleet iOS app.
        </p>
      </div>
    </main>
  );
}
