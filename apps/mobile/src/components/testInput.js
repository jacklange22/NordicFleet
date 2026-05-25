import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

const RatingInput = ({label, value, onValueChange}) => {
  return (
    <View style={styles.ratingContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.numberInputContainer}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${label}`}
          style={styles.numberButton}
          onPress={() => onValueChange(Math.max(1, value - 1))}>
          <Text style={styles.numberButtonText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.numberInput}>{value}</Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Increase ${label}`}
          style={styles.numberButton}
          onPress={() => onValueChange(Math.min(10, value + 1))}>
          <Text style={styles.numberButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

/**
 * Controlled test-input component. The parent screen owns the form state.
 * `value` is the object shape: { glideWax, kickWax, glideRating, kickRating,
 * stabilityRating, climbingRating, notes }.
 */
const SkiInputComponent = ({ski, technique, value, onChange}) => {
  const safeValue = value || {
    glideWax: '',
    kickWax: '',
    glideRating: 5,
    kickRating: 5,
    stabilityRating: 5,
    climbingRating: 5,
    notes: '',
  };

  const {
    glideWax,
    kickWax,
    glideRating,
    kickRating,
    stabilityRating,
    climbingRating,
    notes,
  } = safeValue;

  const update = partial => onChange && onChange(partial);
  const techniqueNormalized = (technique || '').toLowerCase();

  return (
    <View style={styles.skiInputContainer}>
      <Text style={styles.skiName}>{ski}</Text>

      {techniqueNormalized === 'classic' && (
        <>
          <TextInput
            style={[styles.input, styles.waxInput]}
            placeholder="Glidewax"
            value={glideWax}
            onChangeText={text => update({glideWax: text})}
            placeholderTextColor={'#A9A9A9'}
          />
          <TextInput
            style={[styles.input, styles.waxInput]}
            placeholder="Kickwax"
            value={kickWax}
            onChangeText={text => update({kickWax: text})}
            placeholderTextColor={'#A9A9A9'}
          />
          <RatingInput
            label="Kick"
            value={kickRating}
            onValueChange={v => update({kickRating: v})}
          />
        </>
      )}

      {techniqueNormalized === 'skate' && (
        <>
          <TextInput
            style={[styles.input, styles.waxInput]}
            placeholder="Glidewax"
            value={glideWax}
            onChangeText={text => update({glideWax: text})}
            placeholderTextColor={'#A9A9A9'}
          />
          <RatingInput
            label="Stability"
            value={stabilityRating}
            onValueChange={v => update({stabilityRating: v})}
          />
          <RatingInput
            label="Climbing"
            value={climbingRating}
            onValueChange={v => update({climbingRating: v})}
          />
        </>
      )}
      <RatingInput
        label="Glide"
        value={glideRating}
        onValueChange={v => update({glideRating: v})}
      />

      <TextInput
        style={[styles.input, styles.notesInput]}
        placeholder="Notes"
        multiline
        value={notes}
        onChangeText={text => update({notes: text})}
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
    minHeight: 60,
  },
});

export default SkiInputComponent;
