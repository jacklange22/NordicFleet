'use client';

// Route-segment error boundary (Next.js App Router). Catches render +
// data errors thrown anywhere under the app and shows a recovery UI
// instead of a blank screen. Reports through the PII-safe funnel.

import {useEffect} from 'react';
import {reportError} from '@/lib/reportError';

export default function Error({error, reset}) {
  useEffect(() => {
    reportError(error, {boundary: 'segment'});
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-red/[0.12] border border-red/40 flex items-center justify-center text-2xl">
          ⚠️
        </div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">
          Something went wrong
        </h1>
        <p className="text-text-secondary mb-8">
          We hit an unexpected error. You can try again — if it keeps
          happening, please let us know.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center h-11 px-5 rounded-full bg-red text-white text-sm font-semibold hover:bg-red-pressed transition-colors">
            Try again
          </button>
          <a
            href="/home"
            className="inline-flex items-center justify-center h-11 px-5 rounded-full border border-border-strong text-white text-sm font-semibold hover:bg-surface transition-colors">
            Go home
          </a>
        </div>
        <a
          href="mailto:support@nordicfleet.com?subject=NordicFleet%20error%20report"
          className="block mt-6 text-text-tertiary text-sm hover:text-white">
          Report a problem ↗
        </a>
      </div>
    </div>
  );
}
