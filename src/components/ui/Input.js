import React, {useRef, useState, useEffect} from 'react';
import {
  View,
  TextInput,
  Text,
  Animated,
  StyleSheet,
  Pressable,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {colors, radius, spacing, typography} from '../../theme';

/**
 * Floating-label text input with leading icon support and an optional
 * password-visibility toggle.
 *
 * Props:
 *   label              required string
 *   value
 *   onChangeText
 *   placeholder        falls back to label when not supplied
 *   icon               Ionicon name (leading)
 *   error              string; shown below the field and turns the border red
 *   keyboardType
 *   secureTextEntry    triggers the eye toggle
 *   autoCapitalize
 *   editable
 *   onBlur / onFocus
 *   testID
 *   suffix             trailing static text (e.g. "cm", "kg")
 *   multiline          taller field, auto-grows, no fixed height
 *   autoComplete       passthrough (Android autofill hint, also iOS)
 *   textContentType    passthrough (iOS keychain hint)
 *   passwordRules      passthrough (iOS strong-password rules)
 *   autoCorrect        passthrough
 */
const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  error,
  keyboardType,
  secureTextEntry,
  autoCapitalize,
  editable = true,
  onBlur,
  onFocus,
  testID,
  suffix,
  multiline = false,
  autoComplete,
  textContentType,
  passwordRules,
  autoCorrect,
}) => {
  const [focused, setFocused] = useState(false);
  const [showSecure, setShowSecure] = useState(false);
  const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(labelAnim, {
      toValue: focused || value ? 1 : 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [focused, value, labelAnim]);

  const labelStyle = {
    position: 'absolute',
    left: icon ? spacing['3xl'] : spacing.lg,
    top: labelAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [18, 6],
    }),
    fontSize: labelAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 11],
    }),
    color: error ? colors.red : focused ? colors.red : colors.textTertiary,
    letterSpacing: 0.3,
    fontWeight: '500',
  };

  return (
    <View>
      <View
        style={[
          styles.container,
          multiline && styles.containerMultiline,
          {
            borderColor: error
              ? colors.red
              : focused
              ? colors.red
              : colors.border,
          },
        ]}>
        {icon && (
          <Ionicons
            name={icon}
            size={18}
            color={colors.textTertiary}
            style={styles.leadingIcon}
          />
        )}
        <Animated.Text style={labelStyle} pointerEvents="none">
          {label}
        </Animated.Text>
        <TextInput
          testID={testID}
          accessibilityLabel={label}
          style={[
            styles.input,
            {paddingLeft: icon ? spacing['3xl'] : spacing.lg},
            multiline && styles.inputMultiline,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={focused ? placeholder || '' : ''}
          placeholderTextColor={colors.textTertiary}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry && !showSecure}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          textContentType={textContentType}
          passwordRules={passwordRules}
          autoCorrect={autoCorrect}
          editable={editable}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          onFocus={e => {
            setFocused(true);
            onFocus && onFocus(e);
          }}
          onBlur={e => {
            setFocused(false);
            onBlur && onBlur(e);
          }}
          selectionColor={colors.red}
        />
        {!!suffix && !secureTextEntry && (
          <Text style={styles.suffix} accessibilityElementsHidden>
            {suffix}
          </Text>
        )}
        {secureTextEntry && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={showSecure ? 'Hide password' : 'Show password'}
            onPress={() => setShowSecure(s => !s)}
            style={styles.trailingButton}
            hitSlop={10}>
            <Ionicons
              name={showSecure ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={colors.textTertiary}
            />
          </Pressable>
        )}
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 60,
    borderWidth: 1,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.lg,
  },
  containerMultiline: {
    height: undefined,
    minHeight: 110,
    alignItems: 'stretch',
  },
  leadingIcon: {
    position: 'absolute',
    left: spacing.md,
    top: 22,
  },
  input: {
    flex: 1,
    paddingTop: 22,
    paddingBottom: 10,
    color: colors.textPrimary,
    ...typography.bodyLg,
  },
  inputMultiline: {
    paddingTop: 26,
    paddingBottom: spacing.md,
    minHeight: 90,
  },
  trailingButton: {
    marginLeft: spacing.sm,
  },
  suffix: {
    ...typography.body,
    color: colors.textTertiary,
    marginLeft: spacing.sm,
    fontWeight: '600',
  },
  error: {
    ...typography.bodySm,
    color: colors.red,
    marginTop: spacing.sm,
    marginLeft: spacing.xs,
  },
});

export default Input;
