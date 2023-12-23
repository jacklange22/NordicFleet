// InfoItem.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';

const InfoItem = ({ label, value, onEditPress, isPassword }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  const handleSave = () => {
    if (onEditPress) {
      onEditPress(inputValue); // Call the onEditPress callback with the new value
    }
    setIsEditing(false);
  };

  return (
    <View style={styles.infoItem}>
      <Text style={styles.label}>{label}</Text>
      {isEditing ? (
        <TextInput
          style={styles.input}
          value={inputValue}
          onChangeText={setInputValue}
          secureTextEntry={isPassword}
          autoCapitalize="none"
          autoCorrect={false}
        />
      ) : (
        <Text style={styles.value}>{isPassword ? '•'.repeat(8) : value}</Text>
      )}
      {isEditing ? (
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ... your styles here ...


// Styles for the InfoItem
const styles = StyleSheet.create({
    infoItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center', // Vertically center the content within the infoItem
        backgroundColor: '#282828',
        borderRadius: 24,
        padding: 10,
        marginVertical: 5,
        width: '70%', // Make the InfoItem take up 90% of its container's width
      },
  label: {
    color: '#fff',
    // Add more styling for the label
  },
  value: {
    color: '#fff',
    // Add more styling for the value
  },
  editButton: {
    backgroundColor: 'red',
    borderRadius: 24,
    padding: 10,
    // Add more styling for the button
  },
  editButtonText: {
    color: '#fff',
    // Add more styling for the button text
  },
  input: {
    color: '#fff',
    // Additional styles for text input
  },
  saveButton: {
    backgroundColor: 'green', // Indicate save action with color
    borderRadius: 24,
    padding: 10,
    // Additional styles for save button
  },
  saveButtonText: {
    color: '#fff',
    // Additional styles for save button text
  },
  // ... other styles
});

export default InfoItem;
