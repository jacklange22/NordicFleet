// src/screens/AuthLoadingScreen.js
import React, {useEffect, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {deriveIsCoach} from '@nordicfleet/core';
import {useAuth} from '../context/AuthContext';
import LoadingScreen from '../components/LoadingScreen';
import {getProfile} from '../services/userService';

const MODE_KEY = 'nordicfleet.mode';

const AuthLoadingScreen = ({navigation}) => {
  const {user, loading} = useAuth();
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (loading) {
      return;
    }
    if (!user) {
      navigation.replace('Welcome');
      return;
    }
    // Authenticated. Decide the landing screen from the capability +
    // the last-used mode (capability model — see ModeContext):
    //   coach who last used coaching mode → CoachDashboard
    //   everyone else                     → Home (personal fleet)
    //   no profile yet                    → Welcome
    setResolving(true);
    let cancelled = false;
    (async () => {
      try {
        const [profile, storedMode] = await Promise.all([
          getProfile(user.uid),
          AsyncStorage.getItem(MODE_KEY).catch(() => null),
        ]);
        if (cancelled) {
          return;
        }
        if (!profile) {
          navigation.replace('Welcome');
          return;
        }
        const isCoach = deriveIsCoach(profile);
        if (isCoach && storedMode === 'coaching') {
          navigation.replace('CoachDashboard');
        } else {
          navigation.replace('Home');
        }
      } catch {
        if (!cancelled) {
          navigation.replace('Home');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, user, navigation]);

  return <LoadingScreen label={resolving ? 'Loading profile…' : undefined} />;
};

export default AuthLoadingScreen;
