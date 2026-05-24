import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';
import {colors, spacing, typography} from '../../theme';

/**
 * App header.
 *
 * Props:
 *   title         the screen title (centered or left-aligned per `align`)
 *   subtitle      optional second line under the title (small caps)
 *   left          custom left component (default: a back chevron when the
 *                 stack has a back history). Pass `null` to suppress.
 *   right         custom right component
 *   onBack        override the default goBack handler
 *   align         'left' (default) | 'center'
 *   transparent   skip the background fill (for full-bleed screens)
 */
const Header = ({
  title,
  subtitle,
  left,
  right,
  onBack,
  align = 'left',
  transparent = false,
}) => {
  const navigation = useNavigation();
  const canGoBack = navigation?.canGoBack && navigation.canGoBack();

  let leftEl = left;
  if (leftEl === undefined && canGoBack) {
    leftEl = (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back"
        onPress={onBack || (() => navigation.goBack())}
        hitSlop={10}
        style={({pressed}) => [styles.iconButton, pressed && {opacity: 0.6}]}>
        <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
      </Pressable>
    );
  }
  // left === null means caller explicitly wants no left affordance
  if (left === null) {
    leftEl = null;
  }

  const center = align === 'center';

  return (
    <View
      style={[
        styles.container,
        !transparent && {backgroundColor: colors.surface},
      ]}>
      <View style={styles.side}>{leftEl}</View>
      <View
        style={[
          styles.titleWrap,
          center ? styles.titleCenter : styles.titleLeft,
        ]}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {!!subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      <View style={[styles.side, styles.rightSide]}>{right}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 56,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  side: {
    width: 56,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightSide: {
    justifyContent: 'flex-end',
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.sm,
  },
  titleWrap: {
    flex: 1,
  },
  titleLeft: {
    alignItems: 'flex-start',
  },
  titleCenter: {
    alignItems: 'center',
  },
  title: {
    ...typography.headingLg,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: 2,
  },
});

export default Header;
