import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

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
          onPress={() => onValueChange(Math.min(10, value + 1))}
        >
          <Text style={styles.numberButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const SkiInputComponent = ({ ski, technique }) => {
  const [glideWax, setGlideWax] = useState('');
  const [glideRating, setGlideRating] = useState(5);

  const [kickWax, setKickWax] = useState('');
  const [kickRating, setKickRating] = useState(5);

  const [stabilityRating, setStabilityRating] = useState(5);
  const [climbingRating, setClimbingRating] = useState(5);

  const [notes, setNotes] = useState('');

  console.log('component',ski,technique)

  return (
    <View style={styles.skiInputContainer}>
      <Text style={styles.skiName}>{ski}</Text>

      {/* Glide and Kick Wax inputs for Classic technique */}
      {technique === 'Classic' && (
        <>
          <TextInput
            style={[styles.input, styles.waxInput]}
            placeholder="Glidewax"
            value={glideWax}
            onChangeText={setGlideWax}
            placeholderTextColor={'#A9A9A9'}
          />
          <TextInput
            style={[styles.input, styles.waxInput]}
            placeholder="Kickwax"
            value={kickWax}
            onChangeText={setKickWax}
            placeholderTextColor={'#A9A9A9'}
          />
          <RatingInput label="Kick" value={kickRating} onValueChange={setKickRating} />
        </>
      )}

      {/* Glide Rating for both Classic and Skate */}
      

      {/* Kick Rating and Stability/Climbing Ratings for Skate technique */}
      {technique === 'Skate' && (
        <>
          <TextInput
            style={[styles.input, styles.waxInput]}
            placeholder="Glidewax"
            value={glideWax}
            onChangeText={setGlideWax}
            placeholderTextColor={'#A9A9A9'}
          />
          <RatingInput label="Stability" value={stabilityRating} onValueChange={setStabilityRating} />
          <RatingInput label="Climbing" value={climbingRating} onValueChange={setClimbingRating} />
        </>
      )}
      <RatingInput label="Glide" value={glideRating} onValueChange={setGlideRating} />

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
  // Add any other styles you need here
});

export default SkiInputComponent;
