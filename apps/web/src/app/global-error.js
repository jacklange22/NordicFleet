'use client';

// Root error boundary (Next.js App Router). Replaces the whole document
// when an error escapes the root layout, so it must render its own
// <html>/<body>. Uses inline styles so it renders even if the stylesheet
// failed to load. Reports through the PII-safe funnel.

import {useEffect} from 'react';
import {reportError} from '@/lib/reportError';

export default function GlobalError({error, reset}) {
  useEffect(() => {
    reportError(error, {boundary: 'global'});
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a0a',
          color: '#fff',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
          padding: '24px',
        }}>
        <div style={{maxWidth: 420, textAlign: 'center'}}>
          <div style={{fontSize: 40, marginBottom: 16}}>⚠️</div>
          <h1 style={{fontSize: 24, fontWeight: 700, margin: '0 0 8px'}}>
            Something went wrong
          </h1>
          <p style={{color: '#a3a3a3', margin: '0 0 28px', lineHeight: 1.5}}>
            The app hit an unexpected error. Reloading usually fixes it.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              height: 44,
              padding: '0 20px',
              borderRadius: 999,
              border: 'none',
              background: '#e53935',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}>
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
