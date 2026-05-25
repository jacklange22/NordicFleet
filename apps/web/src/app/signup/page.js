'use client';

import {useState} from 'react';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import {isValidEmail, validatePassword} from '@nordicfleet/core';
import {doc, setDoc, serverTimestamp} from 'firebase/firestore';
import {getDbClient} from '@/lib/firebase';
import {useAuth} from '../providers';
import {Button} from '@/components/Button';

function mapError(code) {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with that email already exists';
    case 'auth/weak-password':
      return 'Password is too weak';
    case 'auth/network-request-failed':
      return 'No connection — please try again';
    case 'auth/invalid-email':
      return 'Please enter a valid email';
    default:
      return 'Sign-up failed, please try again';
  }
}

export default function SignupPage() {
  const {signUp} = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!isValidEmail(email)) {
      setError('Please enter a valid email');
      return;
    }
    const pwCheck = validatePassword(password);
    if (!pwCheck.valid) {
      setError(pwCheck.errors[0]);
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setSubmitting(true);
    try {
      const cred = await signUp(email.trim(), password);
      // Create the profile doc. Default to athlete; user can pick coach
      // on iOS during the role-select flow.
      const db = getDbClient();
      await setDoc(
        doc(db, 'users', cred.user.uid),
        {
          email: cred.user.email,
          role: 'athlete',
          weight: null,
          height: null,
          team: null,
          location: null,
          coachId: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        {merge: true},
      );
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
        <h1 className="text-3xl font-bold mb-2">Create your account</h1>
        <p className="text-text-secondary mb-8">Start tracking your fleet.</p>

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
            autoComplete="new-password"
          />
          <Field
            label="Confirm password"
            type="password"
            value={confirm}
            onChange={setConfirm}
            autoComplete="new-password"
          />

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
              Sign up
            </Button>
          </div>
        </form>

        <div className="text-center mt-6">
          <Link href="/login" className="text-text-secondary text-sm hover:text-white">
            Already have an account? Sign in
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
