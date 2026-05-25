import React from 'react';
import {Pressable, Text, ActivityIndicator, View, StyleSheet} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {colors, radius, spacing} from '../../theme';

/**
 * Standard button.
 *
 * Props:
 *   variant   'primary' (red filled) | 'secondary' (outlined) |
 *             'ghost' (text only) | 'danger' (red filled, semantic for
 *             destructive)
 *   size      'lg' | 'md' | 'sm'
 *   icon      Ionicon name (renders before the label)
 *   iconRight place the icon on the right
 *   loading   shows a spinner, disables press
 *   disabled
 *   fullWidth stretches to parent width
 *   onPress
 *   children  label text
 *   accessibilityLabel
 */
const Button = ({
  variant = 'primary',
  size = 'md',
  icon,
  iconRight = false,
  loading = false,
  disabled = false,
  fullWidth = false,
  onPress,
  children,
  accessibilityLabel,
  style,
}) => {
  const isDisabled = loading || disabled;
  const sizeStyle = sizeStyles[size];
  const labelSize = labelSizeStyles[size];

  const variantBg =
    variant === 'primary' || variant === 'danger'
      ? colors.red
      : 'transparent';
  const variantBorder =
    variant === 'secondary' ? colors.borderStrong : 'transparent';
  const variantText =
    variant === 'primary' || variant === 'danger'
      ? colors.textPrimary
      : variant === 'ghost'
      ? colors.textSecondary
      : colors.textPrimary;

  const renderIcon = () =>
    icon ? (
      <Ionicons
        name={icon}
        size={size === 'sm' ? 16 : 18}
        color={variantText}
        style={iconRight ? styles.iconRight : styles.iconLeft}
      />
    ) : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || (typeof children === 'string' ? children : undefined)}
      accessibilityState={{disabled: isDisabled, busy: loading}}
      disabled={isDisabled}
      onPress={onPress}
      style={({pressed}) => [
        styles.base,
        sizeStyle,
        {
          backgroundColor: variantBg,
          borderColor: variantBorder,
          borderWidth: variant === 'secondary' ? 1 : 0,
        },
        fullWidth && {alignSelf: 'stretch'},
        pressed && !isDisabled && {opacity: 0.75, transform: [{scale: 0.98}]},
        isDisabled && {opacity: 0.5},
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={variantText} size="small" />
      ) : (
        <View style={styles.row}>
          {!iconRight && renderIcon()}
          <Text style={[labelSize, {color: variantText}, styles.label]}>
            {children}
          </Text>
          {iconRight && renderIcon()}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconLeft: {
    marginRight: spacing.sm,
  },
  iconRight: {
    marginLeft: spacing.sm,
  },
  label: {
    fontWeight: '600',
  },
});

const sizeStyles = StyleSheet.create({
  lg: {
    minHeight: 52,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.full,
  },
  md: {
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
  },
  sm: {
    minHeight: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
});

const labelSizeStyles = StyleSheet.create({
  lg: {fontSize: 17, lineHeight: 20},
  md: {fontSize: 15, lineHeight: 18},
  sm: {fontSize: 13, lineHeight: 16},
});

export default Button;
