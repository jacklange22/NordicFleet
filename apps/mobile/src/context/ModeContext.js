// ModeContext — the personal / coaching mode switcher state.
//
// Every signed-in user has a personal fleet. Users with the coaching
// capability (isCoach) can ADD a coaching surface and toggle between
// the two modes. Non-coaches are locked to personal and never see the
// toggle.
//
//   mode        'personal' | 'coaching'
//   setMode     switch modes (no-op for non-coaches), persists choice
//   isCoach     derived from the live profile
//   profile     the live profile doc (so consumers don't re-subscribe)
//   modeReady   true once we've restored the persisted mode
//
// Persistence: AsyncStorage, restored on launch so a coach who lives
// in coaching mode doesn't re-toggle every cold start.

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {deriveIsCoach, needsCoachBackfill} from '@nordicfleet/core';
import {useAuth} from './AuthContext';
import {
  subscribeProfile,
  backfillCoachCapability,
} from '../services/userService';

const STORAGE_KEY = 'nordicfleet.mode';

const ModeContext = createContext({
  mode: 'personal',
  setMode: () => {},
  isCoach: false,
  profile: null,
  modeReady: false,
});

export const ModeProvider = ({children}) => {
  const {user} = useAuth();
  const [profile, setProfile] = useState(null);
  const [isCoach, setIsCoach] = useState(false);
  const [mode, setModeState] = useState('personal');
  const [modeReady, setModeReady] = useState(false);

  // Live profile subscription → derive isCoach + backfill once.
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

  // Restore the persisted mode once on mount.
  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then(stored => {
        if (cancelled) return;
        if (stored === 'coaching' || stored === 'personal') {
          setModeState(stored);
        }
      })
      .finally(() => {
        if (!cancelled) setModeReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // If the user loses (or never had) the coaching capability, snap
  // back to personal so we never strand them in a mode they can't use.
  useEffect(() => {
    if (!isCoach && mode !== 'personal') {
      setModeState('personal');
      AsyncStorage.setItem(STORAGE_KEY, 'personal').catch(() => {});
    }
  }, [isCoach, mode]);

  const setMode = useCallback(
    next => {
      if (!isCoach) {
        return; // non-coaches are locked to personal
      }
      if (next !== 'personal' && next !== 'coaching') {
        return;
      }
      setModeState(next);
      AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
    },
    [isCoach],
  );

  const value = useMemo(
    () => ({
      // Force personal whenever the user isn't a coach — defensive,
      // even if state somehow drifted.
      mode: isCoach ? mode : 'personal',
      setMode,
      isCoach,
      profile,
      modeReady,
    }),
    [mode, isCoach, setMode, profile, modeReady],
  );

  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
};

export const useMode = () => useContext(ModeContext);

export default ModeContext;
