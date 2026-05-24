// src/screens/AuthLoadingScreen.js
import React, {useEffect} from 'react';
import {View, ActivityIndicator, StyleSheet} from 'react-native';
import {useAuth} from '../context/AuthContext';

const AuthLoadingScreen = ({navigation}) => {
  const {user, loading} = useAuth();

  useEffect(() => {
    if (loading) {
      return;
    }
    navigation.replace(user ? 'Home' : 'Welcome');
  }, [loading, user, navigation]);

  return (
    <View style={styles.container}>
      <ActivityIndicator color="#fff" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
});

export default AuthLoadingScreen;
