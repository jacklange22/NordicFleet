import React from 'react';
import { View, Text, StyleSheet, Button, TouchableOpacity, Image } from 'react-native';

const WelcomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
        <Image source={require('../assets/nordicfleet.png')} style={styles.logo} />
      <Text style={styles.title}>Welcome</Text>
      <Text style={styles.subtitle}>Track and manage all your nordic skis in one place.</Text>
      <Button
        title="Track now"
        onPress={() => navigation.navigate('Signup')} 
      />
      <TouchableOpacity onPress={() => navigation.navigate('Login')}> 
        <Text style={styles.loginText}>Already a member? Log in</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#161616',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: '100%', // or a fixed size that fits well within your view, maintaining the aspect ratio
    height: undefined, // setting height undefined allows the image to scale according to the width while maintaining aspect ratio
    aspectRatio: 1298 / 852, // Use the original aspect ratio of the image
    resizeMode: 'contain', // 'contain' fits the entire image within the frame, 'cover' would fill the frame
    // Add your styles for the logo
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center', // This centers everything on the screen vertically
    backgroundColor: '#000', // Assuming a black background
  },
  title: {
    fontSize: 32, // Large text size for the title
    fontWeight: 'bold', // Make the title bold
    color: '#E53935', // Red color for the title, similar to the logo
    textAlign: 'center', // Center-align the title
    marginBottom: 30, // Space after the title
  },
  subtitle: {
    fontSize: 18, // Smaller text size for the subtitle
    color: '#fff', // White color for text
    textAlign: 'center', // Center-align the subtitle
    marginBottom: 20, // Space after the subtitle
  },
  trackButton: {
    backgroundColor: '#007bff', // Example blue color for the button
    paddingVertical: 10, // Vertical padding for the button
    paddingHorizontal: 20, // Horizontal padding
    borderRadius: 5, // Rounded corners
    alignSelf: 'center', // Center the button in the screen
    marginBottom: 15, // Space after the button
  },
  trackButtonText: {
    color: '#fff', // White text for the button
    fontSize: 20, // Size of the button text
    textAlign: 'center', // Center the text in the button
  },
  loginText: {
    fontSize: 16, // Smaller text size for the login
    color: '#bbb', // Lighter text color for less emphasis
    textAlign: 'center', // Center-align the login text
    textDecorationLine: 'underline', // Underline the login text to indicate it is clickable
    marginTop: 15, // Space before the login text if anything is above
  },
});

export default WelcomeScreen;
