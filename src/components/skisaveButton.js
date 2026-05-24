import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';

const SkiSaveButton = ({onPress}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Save"
        style={styles.saveButton}
        onPress={onPress}>
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'flex-end',
    marginTop: 20,
    marginBottom: 10,
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
