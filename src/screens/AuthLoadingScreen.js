// src/screens/AuthLoadingScreen.js
import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
{/*import AsyncStorage from '@react-native-community/async-storage';*/}


const AuthLoadingScreen = ({ navigation }) => {
  useEffect(() => {
    // Your authentication logic here
    // This could involve checking for a stored authentication token
    // and validating it, then navigating to the appropriate screen
    const bootstrapAsync = async () => {
      // Check user token or session state
      let userToken;
      try {
        // Restore token or session info from storage
        userToken = await AsyncStorage.getItem('userToken');
        // You could also include a validation check for the token here
      } catch (e) {
        // Restoring token failed
      }
      // After restoring token, we may need to validate it or simply assume it's correct
      // Then we navigate to our appropriate place
      navigation.navigate(userToken ? 'Home' : 'Welcome');
    };

    bootstrapAsync();
  }, [navigation]);

  // Render any loading content that you like here
  return (
    <View style={styles.container}>
      <ActivityIndicator />
      {/* You could add additional loading indicators or branding here */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AuthLoadingScreen;
