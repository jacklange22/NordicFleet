import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {colors, spacing, typography} from '../../theme';

/**
 * Section title within a scrollable screen.
 *
 * Props:
 *   title     required
 *   action    { label: string, onPress: () => void }
 */
const SectionHeader = ({title, action}) => (
  <View style={styles.row}>
    <Text style={styles.title}>{title}</Text>
    {action && (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={action.label}
        onPress={action.onPress}
        hitSlop={8}
        style={({pressed}) => pressed && {opacity: 0.6}}>
        <Text style={styles.action}>{action.label}</Text>
      </Pressable>
    )}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: spacing['2xl'],
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  title: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  action: {
    ...typography.bodySm,
    color: colors.red,
    fontWeight: '600',
  },
});

export default SectionHeader;
