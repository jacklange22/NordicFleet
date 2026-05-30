import React from 'react';
import {
  View,
  Image,
  ActivityIndicator,
  StyleSheet,
  Text,
  StatusBar,
} from 'react-native';
import {colors, spacing, typography} from '../theme';

/**
 * Branded loading screen - centered NordicFleet logo, a subtle spinner
 * below, and an optional label. Used for AuthLoading, profile boot, and
 * anywhere else the app pauses on a network roundtrip.
 */
const LoadingScreen = ({label}) => (
  <View style={styles.container}>
    <StatusBar barStyle="light-content" />
    <Image
      source={require('../assets/nordicfleet.png')}
      style={styles.logo}
      accessibilityElementsHidden
      importantForAccessibility="no"
      resizeMode="contain"
    />
    <Text style={styles.brand}>NordicFleet</Text>
    <ActivityIndicator color={colors.red} style={styles.spinner} />
    {!!label && <Text style={styles.label}>{label}</Text>}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  logo: {
    width: 96,
    height: 96,
    marginBottom: spacing.lg,
  },
  brand: {
    ...typography.displayMd,
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: spacing['2xl'],
  },
  spinner: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.body,
    color: colors.textSecondary,
  },
});

export default LoadingScreen;
