// src/screens/AuthLoadingScreen.js
import React, {useEffect, useState} from 'react';
import {useAuth} from '../context/AuthContext';
import LoadingScreen from '../components/LoadingScreen';
import {getProfile} from '../services/userService';

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
    // Authenticated. Look up the profile to decide where to send them:
    //   coach   → CoachDashboard
    //   athlete → Home
    //   (no profile yet — first run of a partially-created account) → Welcome
    setResolving(true);
    let cancelled = false;
    (async () => {
      try {
        const profile = await getProfile(user.uid);
        if (cancelled) {
          return;
        }
        if (!profile) {
          navigation.replace('Welcome');
          return;
        }
        if (profile.role === 'coach') {
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
