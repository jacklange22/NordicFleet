import React from 'react';
import {View, Pressable, StyleSheet} from 'react-native';
import {colors, radius, spacing} from '../../theme';

/**
 * Surface container - the building block for every grouped UI region.
 *
 * Props:
 *   children
 *   style       additional style override
 *   onPress     if set, the whole card is tappable (animates opacity)
 *   padding     override the default (spacing.lg)
 *   elevated    use the lighter surface for modals / raised cards
 *   accessibilityLabel
 */
const Card = ({
  children,
  style,
  onPress,
  padding = spacing.lg,
  elevated = false,
  accessibilityLabel,
}) => {
  const containerStyle = [
    styles.card,
    {padding, backgroundColor: elevated ? colors.surfaceElevated : colors.surface},
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={({pressed}) => [...containerStyle, pressed && styles.pressed]}>
        {children}
      </Pressable>
    );
  }
  return <View style={containerStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.7,
  },
});

export default Card;
