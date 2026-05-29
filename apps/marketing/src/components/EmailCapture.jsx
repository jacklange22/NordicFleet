'use client';

import {useState} from 'react';
import {recordSignup, isValidEmail} from '@/lib/signups';

/**
 * Email capture form → marketingSignups in Firestore.
 *
 * Props:
 *   source   string tag stored with the signup (e.g. 'hero', 'footer')
 *   compact  tighter layout for inline placement
 */
export function EmailCapture({source = 'website', compact = false}) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle'); // idle | submitting | done | error
  const [message, setMessage] = useState('');

  const submit = async e => {
    e.preventDefault();
    setMessage('');
    if (!isValidEmail(email)) {
      setState('error');
      setMessage('Please enter a valid email address.');
      return;
    }
    setState('submitting');
    try {
      await recordSignup(email, {source});
      setState('done');
      setMessage("You're on the list — we'll be in touch.");
      setEmail('');
    } catch (err) {
      setState('error');
      setMessage(String((err && err.message) || err));
    }
  };

  if (state === 'done') {
    return (
      <div
        className={
          'rounded-2xl border border-success/40 bg-success/[0.06] text-success ' +
          (compact ? 'px-4 py-3 text-sm' : 'px-5 py-4')
        }
        role="status">
        {message}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="w-full" noValidate>
      <div
        className={
          'flex gap-2 ' + (compact ? 'flex-row' : 'flex-col sm:flex-row')
        }>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@team.com"
          aria-label="Email address"
          autoComplete="email"
          className="flex-1 bg-surface border border-border rounded-full px-5 py-3 text-white text-sm placeholder:text-text-tertiary focus:border-red outline-none"
        />
        <button
          type="submit"
          disabled={state === 'submitting'}
          className="inline-flex items-center justify-center h-12 px-6 rounded-full bg-red text-white text-sm font-semibold hover:bg-red-pressed transition-colors disabled:opacity-50 shrink-0">
          {state === 'submitting' ? 'Joining…' : 'Get early access'}
        </button>
      </div>
      {message && state === 'error' && (
        <p className="text-red text-xs mt-2 px-2">{message}</p>
      )}
      <p className="text-text-tertiary text-xs mt-2 px-2">
        No spam. Just a note when we open the next round of access.
      </p>
    </form>
  );
}
