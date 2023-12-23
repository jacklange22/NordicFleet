import React from 'react';
import { Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const ProfileButton = () => {
  const navigation = useNavigation();

  return (
    <TouchableOpacity style={styles.imageContainer} onPress={() => navigation.navigate('Profile', { userId: 'user1' })}>
      <Image
        source={require('../assets/profile.png')}
        style={styles.image}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
    imageContainer: {
        width: 39,
        height: 39,
        borderRadius: 20, // Half of the width or height to make it a perfect circle
      },
      image: {
        width: 39,        // Set the width to 39 pixels
        height: 39,       // Set the height to 39 pixels
        borderRadius: 39 / 2,  // Set the border radius to half of the width/height to make it circular
        overflow: 'hidden',    // Ensures the borderRadius is respected
      },
      
});

export default ProfileButton;
