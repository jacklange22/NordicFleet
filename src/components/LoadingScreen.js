import React from 'react';
import {View, ActivityIndicator, StyleSheet, Text} from 'react-native';

/**
 * Centered loading spinner on the standard black background.
 * Optional `label` shown below the spinner.
 */
const LoadingScreen = ({label}) => (
  <View style={styles.container}>
    <ActivityIndicator color="#fff" />
    {!!label && <Text style={styles.label}>{label}</Text>}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    color: '#888',
    marginTop: 12,
  },
});

export default LoadingScreen;
