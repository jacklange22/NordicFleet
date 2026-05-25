import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {colors, spacing, typography} from '../../theme';
import Button from './Button';

/**
 * Inviting placeholder for empty lists/screens.
 *
 * Props:
 *   icon          Ionicon name
 *   title         displayMd
 *   description   body
 *   cta           { label: string, onPress: () => void, icon?: string }
 */
const EmptyState = ({icon, title, description, cta}) => (
  <View style={styles.container}>
    {icon && (
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={56} color={colors.textTertiary} />
      </View>
    )}
    <Text style={styles.title}>{title}</Text>
    {!!description && <Text style={styles.description}>{description}</Text>}
    {cta && (
      <View style={styles.ctaWrap}>
        <Button
          variant="primary"
          size="md"
          icon={cta.icon}
          onPress={cta.onPress}>
          {cta.label}
        </Button>
      </View>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing['4xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.displayMd,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 21,
  },
  ctaWrap: {
    marginTop: spacing['2xl'],
  },
});

export default EmptyState;
