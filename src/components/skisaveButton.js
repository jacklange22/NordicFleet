import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';

const SkiSaveButton = ({ onPress }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.saveButton} onPress={onPress}>
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // This will make sure the button stays at the bottom of the container
    flex: 1,
    justifyContent: 'flex-end',
    marginTop: 20,
    marginBottom: 10, // Adjust this value as needed for bottom margin
  },
  saveButton: {
    backgroundColor: 'red', // Changed from blue to red
    borderRadius: 30,
    padding: 12,
    // Add additional styles for horizontal alignment if needed, e.g.:
    alignSelf: 'center', // Center button horizontally
  },
  saveButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 20,
  },
});

export default SkiSaveButton;
