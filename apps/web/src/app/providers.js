'use client';

import {createContext, useContext, useEffect, useState} from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail as fbSendPasswordResetEmail,
} from 'firebase/auth';
import {getAuthClient, isFirebaseConfigured} from '@/lib/firebase';
import {ToastProvider} from '@/components/Toast';

const AuthContext = createContext(null);

export function Providers({children}) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setConfigured(false);
      setLoading(false);
      return;
    }
    const auth = getAuthClient();
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const value = {
    user,
    loading,
    configured,
    signIn: (email, pw) =>
      signInWithEmailAndPassword(getAuthClient(), email, pw),
    signUp: (email, pw) =>
      createUserWithEmailAndPassword(getAuthClient(), email, pw),
    signOut: () => fbSignOut(getAuthClient()),
    sendPasswordResetEmail: email =>
      fbSendPasswordResetEmail(getAuthClient(), email),
  };

  return (
    <AuthContext.Provider value={value}>
      <ToastProvider>{children}</ToastProvider>
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
