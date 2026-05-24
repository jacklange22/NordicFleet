import React from 'react';
import {View, Text, TextInput, TouchableOpacity, StyleSheet} from 'react-native';
import Dropdown from './dropdown';

const BINDER_OPTIONS = [
  'none',
  'VG swix binder',
  'Toko Base',
  'GS base AT',
  'GS base super',
  'Chola',
  'K-base',
  'Rode Blackbase',
  'KS base',
];

const RatingInput = ({label, value, onValueChange, max = 4}) => {
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
          onPress={() => onValueChange(Math.min(max, value + 1))}>
          <Text style={styles.numberButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

/**
 * Controlled wax input component.
 * The parent screen owns the per-ski form state and passes it in as `value`,
 * receiving updates via `onChange(partial)`. The component never holds its
 * own copy of the data.
 */
const WaxInputComponent = ({ski, technique, value, onChange}) => {
  const safeValue = value || {
    binder: '',
    kickLayers: 1,
    kickWax: '',
    glideLayers: 1,
    glideWaxes: [''],
    notes: '',
  };

  const {
    binder,
    kickLayers,
    kickWax,
    glideLayers,
    glideWaxes,
    notes,
  } = safeValue;

  const update = partial => onChange && onChange(partial);

  const handleBinderSelect = itemValue => update({binder: itemValue});

  const handleKickLayersChange = next => update({kickLayers: next});

  const handleGlideLayersChange = next => {
    const resized = Array(next).fill('');
    (glideWaxes || []).forEach((wax, idx) => {
      if (idx < next) {
        resized[idx] = wax;
      }
    });
    update({glideLayers: next, glideWaxes: resized});
  };

  const handleGlideWaxChange = (idx, text) => {
    const next = (glideWaxes || []).slice();
    while (next.length <= idx) {
      next.push('');
    }
    next[idx] = text;
    update({glideWaxes: next});
  };

  const renderGlideLayerInputs = () => {
    const inputs = [];
    for (let i = 0; i < glideLayers; i++) {
      inputs.push(
        <TextInput
          key={i}
          style={[styles.input, styles.waxInput]}
          placeholder={`Glide Layer ${i + 1} `}
          placeholderTextColor={'#A9A9A9'}
          value={glideWaxes[i] || ''}
          onChangeText={text => handleGlideWaxChange(i, text)}
        />,
      );
    }
    return inputs;
  };

  const techniqueNormalized = (technique || '').toLowerCase();

  return (
    <View style={styles.skiInputContainer}>
      <Text style={styles.skiName}>{ski}</Text>

      {techniqueNormalized === 'classic' && (
        <>
          <View style={styles.dropdownContainer}>
            <Text style={styles.label}>Binder:</Text>
            <Dropdown
              options={BINDER_OPTIONS}
              onSelect={handleBinderSelect}
              placeholder="Choose binder"
            />
          </View>
          <RatingInput
            label="Kick Layers"
            value={kickLayers}
            onValueChange={handleKickLayersChange}
          />
          <TextInput
            style={[styles.input, styles.waxInput]}
            placeholder="Kickwax"
            value={kickWax}
            onChangeText={text => update({kickWax: text})}
            placeholderTextColor={'#A9A9A9'}
          />
        </>
      )}
      <RatingInput
        label="Glide Layers"
        value={glideLayers}
        onValueChange={handleGlideLayersChange}
      />
      {renderGlideLayerInputs()}

      <TextInput
        style={[styles.input, styles.notesInput]}
        placeholder="Notes"
        multiline
        value={notes}
        onChangeText={text => update({notes: text})}
        placeholderTextColor={'#A9A9A9'}
      />
      {/* binder shown as muted helper text when set, so the user can confirm */}
      {!!binder && techniqueNormalized === 'classic' && (
        <Text style={styles.helperText}>Binder: {binder}</Text>
      )}
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
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
  },
  dropdown: {
    flexGrow: 1,
    marginLeft: 10,
  },
  helperText: {
    color: '#999',
    fontSize: 12,
    marginTop: 4,
  },
});

export default WaxInputComponent;
