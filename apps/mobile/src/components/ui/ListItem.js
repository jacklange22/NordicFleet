import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {colors, spacing, typography} from '../../theme';

/**
 * Standard row inside a Card. Use a list of ListItems with `showDivider`
 * on all but the last to get hairline separation between rows.
 *
 * Props:
 *   leading         component (icon, color dot, avatar)
 *   title           required
 *   subtitle
 *   right           component, or a string (rendered as textSecondary)
 *   onPress
 *   showDivider     hairline below the row
 *   destructive     red title (for sign-out etc.)
 *   icon            convenience - pass an Ionicon name for leading
 *   iconColor       (default red)
 *   chevron         show right chevron (default true if onPress)
 */
const ListItem = ({
  leading,
  title,
  subtitle,
  right,
  onPress,
  showDivider = false,
  destructive = false,
  icon,
  iconColor = colors.red,
  chevron,
  accessibilityLabel,
}) => {
  const showChevron = chevron === undefined ? !!onPress && !right : chevron;
  const titleColor = destructive ? colors.red : colors.textPrimary;

  const leadingEl =
    leading || (icon ? <Ionicons name={icon} size={22} color={iconColor} /> : null);

  const rightEl =
    typeof right === 'string' ? (
      <Text style={styles.rightText}>{right}</Text>
    ) : (
      right
    );

  const content = (
    <View style={styles.row}>
      {leadingEl && <View style={styles.leading}>{leadingEl}</View>}
      <View style={styles.center}>
        <Text style={[styles.title, {color: titleColor}]} numberOfLines={1}>
          {title}
        </Text>
        {!!subtitle && (
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightEl && <View style={styles.right}>{rightEl}</View>}
      {showChevron && (
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.textTertiary}
          style={styles.chevron}
        />
      )}
    </View>
  );

  const inner = onPress ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      onPress={onPress}
      style={({pressed}) => [styles.container, pressed && {opacity: 0.7}]}>
      {content}
    </Pressable>
  ) : (
    <View style={styles.container}>{content}</View>
  );

  return (
    <>
      {inner}
      {showDivider && <View style={styles.divider} />}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 32,
  },
  leading: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  center: {
    flex: 1,
  },
  title: {
    ...typography.bodyLg,
    fontWeight: '500',
  },
  subtitle: {
    ...typography.bodySm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  right: {
    marginLeft: spacing.md,
  },
  rightText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  chevron: {
    marginLeft: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.md,
  },
});

export default ListItem;
