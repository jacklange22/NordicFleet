'use client';

// Web mirror of the mobile ModeContext. Every user has a personal
// fleet; coaches additionally get a coaching surface and a mode
// switcher. mode is persisted to localStorage.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {deriveIsCoach, needsCoachBackfill} from '@nordicfleet/core';
import {useAuth} from '@/app/providers';
import {subscribeProfile, backfillCoachCapability} from '@/lib/firestore';

const STORAGE_KEY = 'nordicfleet.mode';

const ModeContext = createContext({
  mode: 'personal',
  setMode: () => {},
  isCoach: false,
  profile: null,
});

export function ModeProvider({children}) {
  const {user} = useAuth();
  const [profile, setProfile] = useState(null);
  const [isCoach, setIsCoach] = useState(false);
  const [mode, setModeState] = useState('personal');

  // Restore persisted mode (client-only; guards SSR).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'coaching' || stored === 'personal') {
      setModeState(stored);
    }
  }, []);

  // Live profile → isCoach, with one-shot backfill of legacy docs.
  useEffect(() => {
    if (!user?.uid) {
      setProfile(null);
      setIsCoach(false);
      return undefined;
    }
    const unsub = subscribeProfile(user.uid, p => {
      setProfile(p);
      setIsCoach(deriveIsCoach(p));
      if (needsCoachBackfill(p)) {
        backfillCoachCapability(user.uid, p).catch(() => {});
      }
    });
    return unsub;
  }, [user?.uid]);

  // Snap non-coaches back to personal.
  useEffect(() => {
    if (!isCoach && mode !== 'personal') {
      setModeState('personal');
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, 'personal');
      }
    }
  }, [isCoach, mode]);

  const setMode = useCallback(
    next => {
      if (!isCoach) return;
      if (next !== 'personal' && next !== 'coaching') return;
      setModeState(next);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, next);
      }
    },
    [isCoach],
  );

  const value = useMemo(
    () => ({
      mode: isCoach ? mode : 'personal',
      setMode,
      isCoach,
      profile,
    }),
    [mode, isCoach, setMode, profile],
  );

  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
}

export const useMode = () => useContext(ModeContext);
