// src/screens/AuthLoadingScreen.js
import React, {useEffect, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {deriveIsCoach} from '@nordicfleet/core';
import {useAuth} from '../context/AuthContext';
import LoadingScreen from '../components/LoadingScreen';
import {getProfile} from '../services/userService';
import {trace} from '../services/devTrace';

const MODE_KEY = 'nordicfleet.mode';

// Safety net: if the one-time profile fetch hangs (offline with no cache,
// a Firestore stall), never sit frozen on the splash — fall through to Home
// after this long. useProfile on Home backfills the doc when it arrives.
const BOOT_TIMEOUT_MS = 12000;

const AuthLoadingScreen = ({navigation}) => {
  const {user, loading} = useAuth();
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (loading) {
      return;
    }
    if (!user) {
      trace('boot decision', {target: 'Welcome', reason: 'signed-out'});
      navigation.replace('Welcome');
      return;
    }
    // Authenticated. Decide the landing screen from the capability +
    // the last-used mode (capability model — see ModeContext):
    //   coach who last used coaching mode → CoachDashboard
    //   coach who last used wax-truck mode → WaxTruck
    //   everyone else                     → Home (personal fleet)
    //   no profile yet                    → Welcome
    setResolving(true);
    let cancelled = false;
    let timer;
    const timedOut = {}; // unique sentinel — a real profile is object|null
    (async () => {
      try {
        const [profileOrTimeout, storedMode] = await Promise.all([
          Promise.race([
            getProfile(user.uid),
            new Promise(resolve => {
              timer = setTimeout(() => resolve(timedOut), BOOT_TIMEOUT_MS);
            }),
          ]),
          AsyncStorage.getItem(MODE_KEY).catch(() => null),
        ]);
        if (cancelled) {
          return;
        }
        if (profileOrTimeout === timedOut) {
          trace('boot decision', {target: 'Home', reason: 'getProfile-timeout'});
          navigation.replace('Home');
          return;
        }
        const profile = profileOrTimeout;
        if (!profile) {
          trace('boot decision', {target: 'Welcome', reason: 'no-profile'});
          navigation.replace('Welcome');
          return;
        }
        const isCoach = deriveIsCoach(profile);
        if (isCoach && storedMode === 'coaching') {
          trace('boot decision', {target: 'CoachDashboard'});
          navigation.replace('CoachDashboard');
        } else if (isCoach && storedMode === 'waxtruck') {
          trace('boot decision', {target: 'WaxTruck'});
          navigation.replace('WaxTruck');
        } else {
          trace('boot decision', {target: 'Home'});
          navigation.replace('Home');
        }
      } catch {
        if (!cancelled) {
          trace('boot decision', {target: 'Home', reason: 'error'});
          navigation.replace('Home');
        }
      }
    })();
    return () => {
      cancelled = true;
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [loading, user, navigation]);

  return <LoadingScreen label={resolving ? 'Loading profile…' : undefined} />;
};

export default AuthLoadingScreen;
