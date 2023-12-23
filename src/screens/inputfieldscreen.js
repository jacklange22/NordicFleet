import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';

// Suppose this is your ski data structure
const skiData = [
  { id: 'ski1', name: 'Fischer RC4 Pro Skate', properties: ['glidewax', 'kickwax', 'notes'] },
  // More ski data...
];

const SkiInputs = ({ ski, onChange }) => (
  <View style={styles.skiInputContainer}>
    <Text style={styles.skiName}>{ski.name}</Text>
    {ski.properties.map((property) => (
      <TextInput
        key={property}
        style={styles.input}
        placeholder={`Enter ${property}`}
        value={ski[property]}
        onChangeText={(text) => onChange(ski.id, property, text)}
      />
    ))}
  </View>
);

const SkisInputFields = () => {
  const [selectedSkis, setSelectedSkis] = useState([]);
  const [skiInputs, setSkiInputs] = useState({});

  const handleSelectionDone = (items) => {
    setSelectedSkis(items);
    const inputs = items.reduce((acc, item) => {
      acc[item.id] = { ...item, glidewax: '', kickwax: '', notes: '' };
      return acc;
    }, {});
    setSkiInputs(inputs);
  };

  const handleInputChange = (skiId, property, value) => {
    setSkiInputs((prevInputs) => ({
      ...prevInputs,
      [skiId]: { ...prevInputs[skiId], [property]: value },
    }));
  };

  return (
    <View style={styles.container}>
      {selectedSkis.map((ski) => (
        <SkiInputs
          key={ski.id}
          ski={skiInputs[ski.id]}
          onChange={handleInputChange}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Assuming a black background for the container
    padding: 20, // Add padding around the entire container
  },
  skiInputContainer: {
    backgroundColor: '#333', // Dark grey background for each ski input section
    borderRadius: 10, // Rounded corners for the container
    padding: 15, // Padding inside each container
    marginBottom: 20, // Space between each ski input section
  },
  skiName: {
    fontWeight: 'bold',
    fontSize: 20,
    color: '#fff', // White text color
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row', // Arrange the glide and kick input fields in a row
    justifyContent: 'space-between', // Space out the input fields
    marginBottom: 10,
  },
  input: {
    flex: 1, // Take up available space equally
    borderColor: 'gray',
    borderWidth: 1,
    paddingVertical: 10, // Vertical padding
    paddingHorizontal: 15, // Horizontal padding
    backgroundColor: '#282828', // Slightly lighter grey than the container background
    color: '#fff', // Text color
    fontSize: 16,
    borderRadius: 20, // Rounded corners for the inputs
    marginRight: 10, // Right margin for the left input field
  },
  notesInput: {
    // Special styling for the notes input which spans the full width
    borderColor: 'gray',
    borderWidth: 1,
    padding: 10,
    backgroundColor: '#282828', // Slightly lighter grey than the container background
    color: '#fff', // Text color
    fontSize: 16,
    borderRadius: 20, // Rounded corners
    textAlignVertical: 'top', // Align text at the top for multiline input
    height: 100, // Fixed height for notes input
  },
  label: {
    color: '#fff', // Label text color
    marginBottom: 5, // Space between label and input field
  },
  // Add more styles if needed
});

export default SkisInputFields;
