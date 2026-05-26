'use client';

import {useState} from 'react';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import {isValidEmail} from '@nordicfleet/core';
import {useAuth} from '../providers';
import {Button} from '@/components/Button';

function mapError(code) {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Wrong email or password';
    case 'auth/network-request-failed':
      return 'No connection — please try again';
    case 'auth/too-many-requests':
      return 'Too many attempts, try again in a minute';
    default:
      return 'Sign-in failed, please try again';
  }
}

export default function LoginPage() {
  const {signIn} = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!isValidEmail(email)) {
      setError('Please enter a valid email');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      router.push('/home');
    } catch (err) {
      setError(mapError(err && err.code));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-sm w-full">
        <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
        <p className="text-text-secondary mb-8">Pick up where you left off.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="username"
          />
          <Field
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
          />

          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-text-secondary text-sm hover:text-white">
              Forgot password?
            </Link>
          </div>

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
              Sign in
            </Button>
          </div>
        </form>

        <div className="text-center mt-6">
          <Link href="/signup" className="text-text-secondary text-sm hover:text-white">
            Don't have an account? Create one
          </Link>
        </div>
      </div>
    </main>
  );
}

function Field({label, type, value, onChange, autoComplete}) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-wider text-text-tertiary mb-1">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        autoComplete={autoComplete}
        autoCapitalize="none"
        autoCorrect="off"
        className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-white focus:border-red outline-none"
      />
    </label>
  );
}
