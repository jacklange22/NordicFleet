import React from 'react';
import { TextInput, StyleSheet, View } from 'react-native';

const InputField = ({ placeholder, keyboardType, onChangeText, value }) => {
  return (
    <View style={styles.inputContainer}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        value={value}
        placeholderTextColor="#bebebe" // Placeholder text color
      />
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    margin: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#333', // Dark background
    borderRadius: 30, // Rounded corners
    minWidth: 200, // Minimum width
    borderWidth: 1,
    borderColor: '#555', // Slightly lighter border for subtle effect
    flexDirection: 'row', // Align 'Skis Waxed' and the icon on the same line
    justifyContent: 'space-between', // Push 'Skis Waxed' and the icon to opposite ends
    alignItems: 'center', // Center items vertically
    // Additional styles for the input container if needed
  },
  input: {
    fontSize: 16,
    color: '#fff', // White text color
  },
});

export default InputField;
