import React, {useMemo, useState} from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import Pill from './Pill';
import Input from './Input';
import {colors, spacing, typography} from '../../theme';

// Above this many skis the flat chip wall gets unwieldy (issue #9), so we
// add a search field and select-all / clear shortcuts. Small fleets stay
// clean with neither.
const SEARCH_THRESHOLD = 6;
const ACTIONS_THRESHOLD = 2;

const matchesQuery = (ski, q) => {
  const needle = q.trim().toLowerCase();
  if (!needle) {
    return true;
  }
  return [ski.name, ski.brand, ski.model]
    .filter(Boolean)
    .some(v => String(v).toLowerCase().includes(needle));
};

/**
 * Multi-select chip grid for picking skis in the wax / test flows.
 *
 * Props:
 *   skis         array of {id, name, brand?, model?}
 *   selectedIds  array of selected ski ids
 *   onToggle     (id) => void
 *   onSelectAll  () => void   — parent selects the whole fleet
 *   onClearAll   () => void   — parent clears the selection
 *   hint         empty-state helper text (shown when nothing selected)
 */
const SkiSelector = ({
  skis,
  selectedIds,
  onToggle,
  onSelectAll,
  onClearAll,
  hint,
}) => {
  const [query, setQuery] = useState('');
  const showSearch = skis.length > SEARCH_THRESHOLD;
  const showActions = skis.length >= ACTIONS_THRESHOLD;

  const visible = useMemo(
    () => (showSearch ? skis.filter(s => matchesQuery(s, query)) : skis),
    [skis, query, showSearch],
  );

  const selectedCount = selectedIds.length;
  const allSelected = skis.length > 0 && selectedCount >= skis.length;

  return (
    <View>
      {showSearch && (
        <View style={styles.searchWrap}>
          <Input
            label="Search your fleet"
            icon="search-outline"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      )}

      {showActions && (
        <View style={styles.actionRow}>
          <Text style={styles.count}>
            {selectedCount} of {skis.length} selected
          </Text>
          <View style={styles.actionButtons}>
            {!allSelected && (
              <Pressable
                onPress={onSelectAll}
                accessibilityRole="button"
                accessibilityLabel="Select all skis"
                hitSlop={8}>
                <Text style={styles.action}>Select all</Text>
              </Pressable>
            )}
            {selectedCount > 0 && (
              <Pressable
                onPress={onClearAll}
                accessibilityRole="button"
                accessibilityLabel="Clear selected skis"
                hitSlop={8}
                style={styles.clearButton}>
                <Text style={[styles.action, styles.clear]}>Clear</Text>
              </Pressable>
            )}
          </View>
        </View>
      )}

      <View style={styles.chipRow}>
        {visible.map(ski => {
          const selected = selectedIds.includes(ski.id);
          return (
            <View key={ski.id} style={styles.chipWrap}>
              <Pill
                variant={selected ? 'solid' : 'outline'}
                color="red"
                onPress={() => onToggle(ski.id)}
                accessibilityLabel={ski.name || ski.id}>
                {ski.name || ski.id}
              </Pill>
            </View>
          );
        })}
      </View>

      {showSearch && visible.length === 0 && (
        <Text style={styles.hint}>No skis match your search.</Text>
      )}
      {selectedCount === 0 && visible.length > 0 && !!hint && (
        <Text style={styles.hint}>{hint}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  searchWrap: {
    marginBottom: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  count: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearButton: {
    marginLeft: spacing.lg,
  },
  action: {
    ...typography.bodySm,
    color: colors.red,
    fontWeight: '600',
  },
  clear: {
    color: colors.textSecondary,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chipWrap: {
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  hint: {
    ...typography.bodySm,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
});

export default SkiSelector;
