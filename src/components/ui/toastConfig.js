import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {colors, radius, spacing, typography} from '../../theme';

const ICONS = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  info: 'information-circle',
};

const ACCENTS = {
  success: colors.success,
  error: colors.red,
  info: colors.red,
};

const ToastRow = ({type, text1, text2}) => {
  const accent = ACCENTS[type] || colors.red;
  const icon = ICONS[type] || 'information-circle';
  return (
    <View style={styles.toast}>
      <View style={[styles.accentBar, {backgroundColor: accent}]} />
      <Ionicons
        name={icon}
        size={20}
        color={accent}
        style={styles.icon}
      />
      <View style={styles.textCol}>
        {!!text1 && (
          <Text style={styles.title} numberOfLines={1}>
            {text1}
          </Text>
        )}
        {!!text2 && (
          <Text style={styles.subtitle} numberOfLines={2}>
            {text2}
          </Text>
        )}
      </View>
    </View>
  );
};

/**
 * Toast configuration used by App.tsx. The library calls each entry as a
 * React component and passes the toast props through.
 *
 * Usage:
 *   Toast.show({type: 'success', text1: 'Ski added'});
 */
export const toastConfig = {
  success: props => <ToastRow {...props} type="success" />,
  error: props => <ToastRow {...props} type="error" />,
  info: props => <ToastRow {...props} type="info" />,
};

const styles = StyleSheet.create({
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingRight: spacing.lg,
    overflow: 'hidden',
    width: '92%',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: {width: 0, height: 4},
    shadowRadius: 12,
  },
  accentBar: {
    width: 4,
    alignSelf: 'stretch',
  },
  icon: {
    marginLeft: spacing.md,
  },
  textCol: {
    flex: 1,
    marginLeft: spacing.md,
  },
  title: {
    ...typography.bodyLg,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  subtitle: {
    ...typography.bodySm,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

export default toastConfig;
