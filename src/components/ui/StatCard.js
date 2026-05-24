import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {colors, radius, spacing, typography} from '../../theme';

/**
 * StatCard — the big-number-and-label primitive that defines the Whoop
 * dashboard look. Value is huge, label is tiny caps below.
 *
 * Props:
 *   value       string or number
 *   label       short caption
 *   accent      'red' | 'success' | 'warning' | undefined
 *   compact     when true, uses displayLg instead of displayXl
 */
const StatCard = ({value, label, accent, compact = false}) => {
  const accentColor =
    accent === 'red'
      ? colors.red
      : accent === 'success'
      ? colors.success
      : accent === 'warning'
      ? colors.warning
      : colors.textPrimary;

  return (
    <View style={styles.card}>
      <Text
        style={[
          compact ? typography.displayLg : typography.displayXl,
          {color: accentColor},
          styles.value,
        ]}
        accessibilityRole="text">
        {value}
      </Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    minHeight: 96,
    justifyContent: 'center',
    flex: 1,
  },
  value: {
    marginBottom: spacing.xs,
  },
  label: {
    ...typography.caption,
    color: colors.textTertiary,
  },
});

export default StatCard;
