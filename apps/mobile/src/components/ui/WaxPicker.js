import React, {useState, useMemo, forwardRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  FlatList,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {searchWaxes, getWaxById} from '@nordicfleet/core';
import {colors, radius, spacing, typography} from '../../theme';
import Input from './Input';

/**
 * WaxPicker — typeahead-style input bound to the wax dictionary.
 *
 * Props:
 *   value         { id?: string|null, name: string }
 *   onChange      (next) => void
 *   type          'kick'|'glide'|'binder'|'klister'|'base' filters the dictionary
 *   label         visible label (defaults to "Wax")
 *   placeholder   placeholder for the free-text fallback
 *
 * Behavior:
 *   - The visible Input shows the resolved display string (the
 *     dictionary fullName when value.id is set, else value.name).
 *   - Tapping the Input opens a modal sheet with a search field +
 *     filtered list. Tapping a result calls onChange({id, name:
 *     fullName}).
 *   - "Use as typed: ..." row at the bottom of the sheet calls
 *     onChange({id: null, name: typedQuery}).
 *
 * Storage convention on a wax log:
 *   wax fields keep both `waxName` (display string for compatibility
 *   with old logs) and `waxId` (the dictionary id, nullable).
 */
const WaxPicker = forwardRef(function WaxPicker(
  {value, onChange, type = 'glide', label = 'Wax', placeholder, icon},
  _ref,
) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const v = value || {};
  const resolved = useMemo(() => {
    if (v.id) {
      const w = getWaxById(v.id);
      if (w) {
        return w.fullName;
      }
    }
    return v.name || '';
  }, [v.id, v.name]);

  const results = useMemo(
    () => searchWaxes(query, {type, limit: 40}),
    [query, type],
  );

  const pick = wax => {
    onChange({id: wax.id, name: wax.fullName});
    setOpen(false);
    setQuery('');
  };

  const useTyped = () => {
    onChange({id: null, name: query.trim()});
    setOpen(false);
    setQuery('');
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label} picker, currently ${resolved || 'none'}`}>
        {/* The displayed Input is read-only; tapping it opens the
            modal. We render Input editable=false so it still looks
            consistent with the surrounding form. */}
        <View pointerEvents="none">
          <Input
            label={label}
            icon={icon || 'flask-outline'}
            value={resolved}
            onChangeText={() => {}}
            editable={false}
            placeholder={placeholder}
          />
        </View>
      </Pressable>

      <Modal
        animationType="slide"
        transparent
        visible={open}
        onRequestClose={() => setOpen(false)}>
        <KeyboardAvoidingView
          style={styles.backdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Pick a wax</Text>
              <Pressable
                onPress={() => setOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="Close picker"
                hitSlop={8}>
                <Ionicons name="close" size={22} color={colors.textPrimary} />
              </Pressable>
            </View>

            <Input
              label="Search"
              icon="search-outline"
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <FlatList
              style={styles.list}
              data={results}
              keyExtractor={item => item.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({item}) => (
                <Pressable
                  onPress={() => pick(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`Pick ${item.fullName}`}
                  style={({pressed}) => [
                    styles.row,
                    pressed && {opacity: 0.7},
                  ]}>
                  <View style={styles.rowMain}>
                    <Text style={styles.rowMfr}>{item.manufacturer}</Text>
                    <Text style={styles.rowName} numberOfLines={1}>
                      {item.product}
                      {item.variant ? ` ${item.variant}` : ''}
                    </Text>
                  </View>
                  {item.tempRange && (
                    <Text style={styles.rowTemp}>
                      {item.tempRange.min}° to {item.tempRange.max}°C
                    </Text>
                  )}
                </Pressable>
              )}
              ListEmptyComponent={
                <Text style={styles.empty}>No matches in the dictionary.</Text>
              }
            />

            {query.trim() && (
              <Pressable
                onPress={useTyped}
                accessibilityRole="button"
                accessibilityLabel={`Use as typed: ${query.trim()}`}
                style={({pressed}) => [
                  styles.useTyped,
                  pressed && {opacity: 0.7},
                ]}>
                <Ionicons
                  name="pencil-outline"
                  size={18}
                  color={colors.red}
                />
                <Text style={styles.useTypedText}>
                  Use as typed: <Text style={styles.useTypedBold}>{query.trim()}</Text>
                </Text>
              </Pressable>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
});

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    maxHeight: '85%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sheetTitle: {
    ...typography.displayMd,
    color: colors.textPrimary,
  },
  list: {
    marginTop: spacing.md,
    maxHeight: 380,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowMain: {flex: 1},
  rowMfr: {
    ...typography.caption,
    color: colors.textTertiary,
    marginBottom: 2,
  },
  rowName: {
    ...typography.bodyLg,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  rowTemp: {
    ...typography.bodySm,
    color: colors.red,
    fontWeight: '600',
  },
  empty: {
    ...typography.body,
    color: colors.textTertiary,
    textAlign: 'center',
    paddingVertical: spacing['3xl'],
  },
  useTyped: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  useTypedText: {
    ...typography.body,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  useTypedBold: {fontWeight: '700'},
});

export default WaxPicker;
