import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  ActivityIndicator,
} from 'react-native';

/**
 * Standard red Save button. While `submitting` is true, the button shows a
 * spinner and disables itself.
 */
const SkiSaveButton = ({onPress, submitting = false, disabled = false}) => {
  const isDisabled = submitting || disabled;
  return (
    <View style={styles.container}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Save"
        accessibilityState={{disabled: isDisabled}}
        style={[styles.saveButton, isDisabled && styles.saveButtonDisabled]}
        onPress={isDisabled ? undefined : onPress}>
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Save</Text>
        )}
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
    backgroundColor: 'red',
    borderRadius: 30,
    padding: 12,
    alignSelf: 'center',
    minWidth: 120,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 20,
  },
});

export default SkiSaveButton;
