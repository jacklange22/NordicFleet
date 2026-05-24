import React from 'react';
import {Pressable, Text, View, StyleSheet} from 'react-native';
import {colors, radius, spacing, typography} from '../../theme';

/**
 * Compact tag/chip.
 *
 * Props:
 *   variant   'solid' (red filled) | 'outline' | 'ghost' (5% white bg)
 *   color     'red' | 'neutral'  (defaults to red for solid, neutral otherwise)
 *   selected  used when in a Pill-as-selector context; flips to solid red
 *   onPress
 *   children  short label
 */
const Pill = ({
  variant = 'ghost',
  color,
  selected = false,
  onPress,
  children,
  style,
  accessibilityLabel,
}) => {
  const resolvedColor = color || (variant === 'solid' ? 'red' : 'neutral');
  const isSelected = selected;
  const effectiveVariant = isSelected ? 'solid' : variant;

  let bg, border, textColor;
  if (effectiveVariant === 'solid') {
    bg = resolvedColor === 'red' ? colors.red : colors.borderStrong;
    border = bg;
    textColor = colors.textPrimary;
  } else if (effectiveVariant === 'outline') {
    bg = 'transparent';
    border = colors.borderStrong;
    textColor = colors.textPrimary;
  } else {
    // ghost
    bg = 'rgba(255,255,255,0.06)';
    border = 'transparent';
    textColor = colors.textSecondary;
  }

  const inner = (
    <Text style={[styles.label, {color: textColor}]} numberOfLines={1}>
      {children}
    </Text>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || (typeof children === 'string' ? children : undefined)}
        accessibilityState={{selected: isSelected}}
        onPress={onPress}
        style={({pressed}) => [
          styles.pill,
          {backgroundColor: bg, borderColor: border},
          pressed && {opacity: 0.7},
          style,
        ]}>
        {inner}
      </Pressable>
    );
  }
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={[styles.pill, {backgroundColor: bg, borderColor: border}, style]}>
      {inner}
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  label: {
    ...typography.bodySm,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});

export default Pill;
