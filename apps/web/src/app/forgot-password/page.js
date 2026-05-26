'use client';

import {useState} from 'react';
import Link from 'next/link';
import {isValidEmail} from '@nordicfleet/core';
import {useAuth} from '../providers';
import {Button} from '@/components/Button';

function mapResetError(code) {
  switch (code) {
    case 'auth/user-not-found':
      return 'No account found with that email';
    case 'auth/invalid-email':
      return 'Please enter a valid email';
    case 'auth/network-request-failed':
      return 'No connection — please try again';
    case 'auth/too-many-requests':
      return 'Too many attempts, try again in a minute';
    default:
      return "Couldn't send reset email, please try again";
  }
}

export default function ForgotPasswordPage() {
  const {sendPasswordResetEmail} = useAuth();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sentTo, setSentTo] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    const trimmed = email.trim();
    if (!isValidEmail(trimmed)) {
      setError('Please enter a valid email');
      return;
    }
    setSubmitting(true);
    try {
      await sendPasswordResetEmail(trimmed);
      setSentTo(trimmed);
    } catch (err) {
      setError(mapResetError(err && err.code));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-sm w-full">
        <Link
          href="/login"
          className="text-text-secondary text-sm hover:text-white inline-block mb-6">
          ← Back to sign in
        </Link>

        {sentTo ? (
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-success/15 border border-success/40 flex items-center justify-center mx-auto mb-6">
              <span className="text-success text-4xl leading-none">✓</span>
            </div>
            <h1 className="text-3xl font-bold mb-3">Check your email</h1>
            <p className="text-text-secondary mb-8">
              We sent a reset link to{' '}
              <span className="text-white font-semibold">{sentTo}</span>. Tap
              the link in the email to choose a new password.
            </p>
            <Link href="/login">
              <Button variant="ghost" size="md" fullWidth>
                Back to sign in
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-bold mb-2">Forgot your password?</h1>
            <p className="text-text-secondary mb-8">
              Enter your email and we&apos;ll send you a reset link.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="block text-xs uppercase tracking-wider text-text-tertiary mb-1">
                  Email
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-white focus:border-red outline-none"
                />
              </label>

              {error && (
                <p className="text-red text-sm text-center mt-2">{error}</p>
              )}

              <div className="pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={submitting}>
                  Send reset link
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
