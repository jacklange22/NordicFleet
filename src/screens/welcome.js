import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Image} from 'react-native';

const WelcomeScreen = ({navigation}) => {
  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/nordicfleet.png')}
        style={styles.logo}
        accessibilityElementsHidden={true}
        importantForAccessibility="no"
      />
      <Text style={styles.title}>Welcome</Text>
      <Text style={styles.subtitle}>
        Track and manage all your nordic skis in one place.
      </Text>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Track now"
        style={styles.trackButton}
        onPress={() => navigation.navigate('Signup')}>
        <Text style={styles.trackButtonText}>Track now</Text>
      </TouchableOpacity>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Already a member, log in"
        onPress={() => navigation.navigate('Login')}>
        <Text style={styles.loginText}>Already a member? Log in</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  logo: {
    width: '100%',
    height: undefined,
    aspectRatio: 1298 / 852,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#E53935',
    textAlign: 'center',
    marginBottom: 30,
  },
  subtitle: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  trackButton: {
    backgroundColor: '#E53935',
    paddingVertical: 12,
    paddingHorizontal: 36,
    borderRadius: 24,
    alignSelf: 'center',
    marginBottom: 15,
  },
  trackButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  loginText: {
    fontSize: 16,
    color: '#bbb',
    textAlign: 'center',
    textDecorationLine: 'underline',
    marginTop: 15,
  },
});

export default WelcomeScreen;
