'use client';

import {useEffect} from 'react';
import {useRouter} from 'next/navigation';
import {useAuth} from '@/app/providers';

/**
 * Wrap a protected page in this. Redirects to /login if no user, after
 * the initial auth check completes. Renders a loading placeholder
 * meanwhile.
 */
export function SignedInGuard({children}) {
  const {user, loading} = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-text-tertiary text-sm">Loading…</span>
      </div>
    );
  }

  return children;
}
