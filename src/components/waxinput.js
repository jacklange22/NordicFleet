import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Dropdown from './dropdown';

const RatingInput = ({ label, value, onValueChange }) => {
    return (
      <View style={styles.ratingContainer}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.numberInputContainer}>
          <TouchableOpacity
            style={styles.numberButton}
            onPress={() => onValueChange(Math.max(1, value - 1))}
          >
            <Text style={styles.numberButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.numberInput}>{value}</Text>
          <TouchableOpacity
            style={styles.numberButton}
            onPress={() => onValueChange(Math.min(4, value + 1))} // max value is 4
          >
            <Text style={styles.numberButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  

const WaxInputComponent = ({ ski, technique, onsave }) => {
    const [binder, setBinder] = useState(false);
  const [kickLayers, setKickLayers] = useState(1);
  const [kickWax, setKickWax] = useState('');
  const [glideLayers, setGlideLayers] = useState(1);
  const [glideWax, setGlideWax] = useState(['']); // Array for each layer's wax
  const [notes, setNotes] = useState('');

  const handleBinderSelect = (itemValue) => {
    setBinder(itemValue);
  };

  binderOptions = ['none','VG swix binder','Toko Base','GS base AT','GS base super','Chola','K-base','Rode Blackbase','KS base']
  
  const handleSave = () => {
    // Create the wax data object
    const waxData = {
      binder,
      kickLayers,
      kickWax,
      glideLayers,
      glideWax, // This will be an array of strings
      notes
    };

    // Pass the wax data to the onSave function provided by the parent component
    onSave(waxData);
  };

  useEffect(() => {
    setGlideWax(oldGlideWax => {
      const newGlideWax = Array(glideLayers).fill('');
      oldGlideWax.forEach((wax, index) => {
        if (index < glideLayers) {
          newGlideWax[index] = wax;
        }
      });
      return newGlideWax;
    });
  }, [glideLayers]);

  const [selectedLayer, setSelectedLayer] = useState(null);


  const handleLayerSelect = (selectedLayers) => {
    setSelectedLayer(selectedLayers); // Update the state with the selected layer
  };

  const renderGlideLayerInputs = () => {
    const inputs = [];
    for (let i = 0; i < glideLayers; i++) {
      inputs.push(
        <TextInput
          key={i} // Important for React list rendering
          style={[styles.input, styles.waxInput]}
          placeholder={`Glide Layer ${i + 1} `}
          placeholderTextColor={'#A9A9A9'}
          // You can also manage state for each layer's value if needed
        />
      );
    }
    return inputs;
  };

  return (
    <View style={styles.skiInputContainer}>
      <Text style={styles.skiName}>{ski}</Text>

             

      {/* Glide and Kick Wax inputs for Classic technique */}
      {technique === 'Classic' && (
        <>
              <View style={styles.dropdownContainer}>
      <Text style={styles.label}>Binder:</Text>
      <Dropdown label="Binder" options={binderOptions} onSelect={handleBinderSelect} />
      </View>
        <RatingInput 
        label="Kick Layers" 
        value={kickLayers} 
        onValueChange={setKickLayers} 
      />
          <TextInput
            style={[styles.input, styles.waxInput]}
            placeholder="Kickwax"
            value={kickWax}
            onChangeText={setKickWax}
            placeholderTextColor={'#A9A9A9'}
          />
        </>
      )}
      <RatingInput 
        label="Glide Layers" 
        value={glideLayers} 
        onValueChange={setGlideLayers} 
      />
        {renderGlideLayerInputs()}

      {/* Notes input for both Classic and Skate */}
      <TextInput
        style={[styles.input, styles.notesInput]}
        placeholder="Notes"
        multiline
        value={notes}
        onChangeText={setNotes}
        placeholderTextColor={'#A9A9A9'}
      />
      
    </View>
  );
};

const styles = StyleSheet.create({
  skiInputContainer: {
    backgroundColor: '#333',
    borderRadius: 20,
    padding: 20,
    width: '95%',
    alignSelf: 'center',
    marginTop: 10,
  },
  skiName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  waxInput: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#222',
    color: '#fff',
    borderRadius: 10,
    fontSize: 16,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 10,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  numberInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  numberButton: {
    backgroundColor: '#444',
    borderRadius: 10,
    padding: 10,
  },
  numberButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  numberInput: {
    color: '#fff',
    fontSize: 16,
    marginHorizontal: 10,
    width: 40,
    textAlign: 'center',
  },
  notesInput: {
    minHeight: 60, // enough height for multiline notes
  },
  dropdownContainer: {
    flexDirection: 'row', // Align items in a row
    alignItems: 'center', // Center items vertically
    justifyContent: 'space-between', // Space between the label and dropdown
    padding: 10, // Add some padding for spacing
    // Set other styling as needed for your layout
  },
  dropdown: {
    // Style for the dropdown
    flexGrow: 1, // Allow dropdown to grow to fill space
    marginLeft: 10, // Add space between the label and dropdown
    // Set other styling as needed
  },
  // Add any other styles you need here
});

export default WaxInputComponent;
