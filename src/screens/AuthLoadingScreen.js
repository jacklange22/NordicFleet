// src/screens/AuthLoadingScreen.js
import React, {useEffect} from 'react';
import {View, ActivityIndicator, StyleSheet} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthLoadingScreen = ({navigation}) => {
  useEffect(() => {
    const bootstrapAsync = async () => {
      let userToken;
      try {
        userToken = await AsyncStorage.getItem('userToken');
      } catch (e) {
        userToken = null;
      }
      navigation.replace(userToken ? 'Home' : 'Welcome');
    };

    bootstrapAsync();
  }, [navigation]);

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
