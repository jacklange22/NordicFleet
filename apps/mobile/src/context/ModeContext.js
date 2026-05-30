// ModeContext - the personal / coaching / wax-truck mode switcher.
//
// Every signed-in user has a personal fleet. Users with the coaching
// capability (isCoach) can ADD two more surfaces - Coaching (manage
// athletes) and Wax Truck (head-to-head wax testing) - and toggle
// among the three. Non-coaches are locked to personal and never see
// the toggle.
//
//   mode        'personal' | 'coaching' | 'waxtruck'
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
import {trace} from '../services/devTrace';

const STORAGE_KEY = 'nordicfleet.mode';

// The three surfaces. Personal is always available; coaching + waxtruck
// are coach-only extras. Keep this list as the single source of truth so
// the restore guard and setMode guard never drift apart.
const VALID_MODES = ['personal', 'coaching', 'waxtruck'];

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
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [mode, setModeState] = useState('personal');
  const [modeReady, setModeReady] = useState(false);

  // Live profile subscription → derive isCoach + backfill once.
  useEffect(() => {
    if (!user?.uid) {
      setProfile(null);
      setIsCoach(false);
      setProfileLoaded(false);
      return undefined;
    }
    trace('profile subscription attached');
    const unsub = subscribeProfile(user.uid, p => {
      trace('profile loaded', {hasProfile: !!p, isCoach: deriveIsCoach(p)});
      setProfile(p);
      setIsCoach(deriveIsCoach(p));
      setProfileLoaded(true);
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
        if (cancelled) {
          return;
        }
        if (VALID_MODES.includes(stored)) {
          trace('mode restored', {stored, valid: true});
          setModeState(stored);
        } else if (stored != null) {
          // Corrupt / legacy value - drop it so we never re-read garbage
          // and never strand the app on an invalid mode.
          trace('mode validated', {stored, valid: false, reset: 'personal'});
          AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
        } else {
          trace('mode restored', {stored: null});
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) {
          setModeReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // If the user loses (or never had) the coaching capability, snap back to
  // personal so we never strand them in a mode they can't use.
  //
  // Gate on profileLoaded: before the Firestore profile resolves, isCoach
  // is false-by-default. Acting on that would clobber a real coach's
  // persisted mode on every cold start, because AsyncStorage restores the
  // mode well before the network profile arrives. Only correct the mode
  // once we actually KNOW the capability.
  useEffect(() => {
    if (profileLoaded && !isCoach && mode !== 'personal') {
      setModeState('personal');
      AsyncStorage.setItem(STORAGE_KEY, 'personal').catch(() => {});
    }
  }, [profileLoaded, isCoach, mode]);

  const setMode = useCallback(
    next => {
      if (!isCoach) {
        return; // non-coaches are locked to personal
      }
      if (!VALID_MODES.includes(next)) {
        return;
      }
      setModeState(next);
      AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
    },
    [isCoach],
  );

  const value = useMemo(
    () => ({
      // Force personal whenever the user isn't a coach - defensive,
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
