// src/screens/AuthLoadingScreen.js
import React, {useEffect} from 'react';
import {useAuth} from '../context/AuthContext';
import LoadingScreen from '../components/LoadingScreen';

const AuthLoadingScreen = ({navigation}) => {
  const {user, loading} = useAuth();

  useEffect(() => {
    if (loading) {
      return;
    }
    navigation.replace(user ? 'Home' : 'Welcome');
  }, [loading, user, navigation]);

  return <LoadingScreen />;
};

export default AuthLoadingScreen;
