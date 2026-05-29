// WaxTestSetup — name a test, set conditions + fleet size, and build
// the wax combinations that will compete in the bracket.
//
// The category selector (Kick / Paraffin / Topcoat / Structure) filters
// the wax typeahead, but NEVER blocks: every picker has a "Use as typed"
// escape so a coach can enter a wax (or structure) that exists nowhere
// in the dictionary, in any category. Free text is a first-class input.
//
// On create → buildWaxTestCreatePayload (core) → createWaxTest →
// navigate into the runner for the freshly-generated bracket.

import React, {useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Pressable,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {WAX_CATEGORIES, buildCombinationLabel} from '@nordicfleet/core';

import {useAuth} from '../context/AuthContext';
import {createWaxTest} from '../services/waxTestService';
import {
  Header,
  Card,
  Input,
  Button,
  Pill,
  SectionHeader,
  WaxPicker,
} from '../components/ui';
import {colors, radius, spacing, typography} from '../theme';

const SNOW_TYPES = ['New', 'Fresh', 'Transformed', 'Old', 'Icy'];
const SURFACES = ['Powder', 'Packed', 'Granular', 'Corduroy', 'Crust'];

const CATEGORY_LABEL = {
  kick: 'Kick',
  paraffin: 'Paraffin',
  topcoat: 'Topcoat',
  structure: 'Structure',
};
const CATEGORY_ICON = {
  kick: 'footsteps-outline',
  paraffin: 'flask-outline',
  topcoat: 'sparkles-outline',
  structure: 'grid-outline',
};

let _uid = 0;
const nextId = prefix => `${prefix}${Date.now().toString(36)}${(_uid++).toString(36)}`;

const makeLayer = (category = 'paraffin') => ({
  key: nextId('l'),
  category,
  waxId: null,
  waxName: '',
});

const makeCombination = () => ({
  id: nextId('c'),
  label: '',
  layers: [makeLayer('paraffin')],
  performanceNumber: '',
});

const WaxTestSetupScreen = () => {
  const navigation = useNavigation();
  const {user} = useAuth();
  const uid = user?.uid;

  const [name, setName] = useState('');
  const [temperature, setTemperature] = useState('');
  const [humidity, setHumidity] = useState('');
  const [snowType, setSnowType] = useState('');
  const [surface, setSurface] = useState('');
  const [locationLabel, setLocationLabel] = useState('');
  const [fleetSize, setFleetSize] = useState('8');
  const [combinations, setCombinations] = useState([
    makeCombination(),
    makeCombination(),
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fleetNum = Number(fleetSize);

  const isValid = useMemo(() => {
    if (!name.trim()) {
      return false;
    }
    if (!Number.isFinite(fleetNum) || fleetNum < 2) {
      return false;
    }
    if (combinations.length < 2 || combinations.length > fleetNum) {
      return false;
    }
    // Every combination must have at least one layer with a wax name.
    return combinations.every(c =>
      c.layers.some(l => (l.waxName || '').trim()),
    );
  }, [name, fleetNum, combinations]);

  const updateCombination = (id, patch) => {
    setCombinations(prev =>
      prev.map(c => (c.id === id ? {...c, ...patch} : c)),
    );
  };

  const addCombination = () => {
    setCombinations(prev => {
      if (prev.length >= fleetNum) {
        return prev;
      }
      return [...prev, makeCombination()];
    });
  };

  const removeCombination = id => {
    setCombinations(prev =>
      prev.length <= 2 ? prev : prev.filter(c => c.id !== id),
    );
  };

  const addLayer = comboId => {
    setCombinations(prev =>
      prev.map(c =>
        c.id === comboId
          ? {...c, layers: [...c.layers, makeLayer('paraffin')]}
          : c,
      ),
    );
  };

  const updateLayer = (comboId, layerKey, patch) => {
    setCombinations(prev =>
      prev.map(c =>
        c.id === comboId
          ? {
              ...c,
              layers: c.layers.map(l =>
                l.key === layerKey ? {...l, ...patch} : l,
              ),
            }
          : c,
      ),
    );
  };

  const removeLayer = (comboId, layerKey) => {
    setCombinations(prev =>
      prev.map(c =>
        c.id === comboId
          ? {
              ...c,
              layers:
                c.layers.length <= 1
                  ? c.layers
                  : c.layers.filter(l => l.key !== layerKey),
            }
          : c,
      ),
    );
  };

  const handleCreate = async () => {
    setError('');
    if (!uid) {
      setError('Sign in to create a wax test.');
      return;
    }
    if (!isValid) {
      if (!name.trim()) {
        setError('Give the test a name.');
      } else if (!Number.isFinite(fleetNum) || fleetNum < 2) {
        setError('Fleet size must be at least 2.');
      } else if (combinations.length > fleetNum) {
        setError('You have more combinations than the fleet size allows.');
      } else {
        setError('Every combination needs at least one wax layer.');
      }
      return;
    }
    setSubmitting(true);
    try {
      const payloadCombos = combinations.map((c, idx) => ({
        id: c.id,
        label: c.label.trim() || undefined,
        performanceNumber: c.performanceNumber,
        layers: c.layers
          .filter(l => (l.waxName || '').trim())
          .map((l, i) => ({
            category: l.category,
            waxId: l.waxId || null,
            waxName: l.waxName.trim(),
            order: i,
          })),
      }));
      const testId = await createWaxTest(uid, {
        name: name.trim(),
        fleetSize: fleetNum,
        conditions: {
          temperature,
          humidity,
          snowType,
          surface,
          locationLabel,
        },
        combinations: payloadCombos,
      });
      Toast.show({
        type: 'success',
        text1: 'Test created',
        text2: 'Bracket generated — time to arrange and run.',
        position: 'top',
        visibilityTime: 2200,
      });
      navigation.replace('WaxTestRunner', {testId});
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <Header
        title="New wax test"
        subtitle="Build the bracket"
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Create wax test"
            disabled={!isValid || submitting}
            onPress={handleCreate}
            hitSlop={8}
            style={({pressed}) => [
              styles.headerBtn,
              (!isValid || submitting) && {opacity: 0.4},
              pressed && {opacity: 0.6},
            ]}>
            <Text style={styles.headerBtnText}>Create</Text>
          </Pressable>
        }
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled">
          <SectionHeader title="Test" />
          <Input
            label="Test name"
            icon="git-network-outline"
            placeholder="Stratton AM glide test"
            value={name}
            onChangeText={setName}
            autoCapitalize="sentences"
          />
          <View style={styles.spacer} />
          <Input
            label="Location (optional)"
            icon="location-outline"
            placeholder="Stratton, VT"
            value={locationLabel}
            onChangeText={setLocationLabel}
          />

          <SectionHeader title="Conditions (optional)" />
          <View style={styles.row2}>
            <View style={styles.row2Cell}>
              <Input
                label="Temp"
                icon="thermometer-outline"
                value={temperature}
                onChangeText={setTemperature}
                keyboardType={
                  Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'
                }
                suffix="°C"
              />
            </View>
            <View style={styles.row2Spacer} />
            <View style={styles.row2Cell}>
              <Input
                label="Humidity"
                icon="water-outline"
                value={humidity}
                onChangeText={setHumidity}
                keyboardType="number-pad"
                suffix="%"
              />
            </View>
          </View>
          <View style={styles.spacer} />
          <Text style={styles.miniLabel}>Snow type</Text>
          <View style={styles.chipRow}>
            {SNOW_TYPES.map(opt => (
              <View key={opt} style={styles.chipWrap}>
                <Pill
                  selected={snowType.toLowerCase() === opt.toLowerCase()}
                  variant="outline"
                  onPress={() =>
                    setSnowType(
                      snowType.toLowerCase() === opt.toLowerCase() ? '' : opt,
                    )
                  }>
                  {opt}
                </Pill>
              </View>
            ))}
          </View>
          <View style={styles.spacer} />
          <Text style={styles.miniLabel}>Surface</Text>
          <View style={styles.chipRow}>
            {SURFACES.map(opt => (
              <View key={opt} style={styles.chipWrap}>
                <Pill
                  selected={surface.toLowerCase() === opt.toLowerCase()}
                  variant="outline"
                  onPress={() =>
                    setSurface(
                      surface.toLowerCase() === opt.toLowerCase() ? '' : opt,
                    )
                  }>
                  {opt}
                </Pill>
              </View>
            ))}
          </View>

          <SectionHeader title="Fleet size" />
          <Text style={styles.helpText}>
            The maximum number of combinations in this test. Byes fill any
            empty bracket slots.
          </Text>
          <View style={styles.fleetRow}>
            {[2, 4, 8, 16].map(n => (
              <View key={n} style={styles.fleetCell}>
                <Pill
                  selected={fleetNum === n}
                  variant="outline"
                  onPress={() => setFleetSize(String(n))}>
                  {`${n}`}
                </Pill>
              </View>
            ))}
          </View>

          <SectionHeader
            title={`Combinations (${combinations.length}/${
              Number.isFinite(fleetNum) ? fleetNum : '—'
            })`}
          />
          {combinations.map((combo, idx) => (
            <CombinationCard
              key={combo.id}
              index={idx}
              combo={combo}
              canRemove={combinations.length > 2}
              onChangeLabel={label => updateCombination(combo.id, {label})}
              onChangePerf={performanceNumber =>
                updateCombination(combo.id, {performanceNumber})
              }
              onAddLayer={() => addLayer(combo.id)}
              onUpdateLayer={(layerKey, patch) =>
                updateLayer(combo.id, layerKey, patch)
              }
              onRemoveLayer={layerKey => removeLayer(combo.id, layerKey)}
              onRemove={() => removeCombination(combo.id)}
            />
          ))}

          <Button
            variant="secondary"
            size="md"
            icon="add"
            disabled={combinations.length >= fleetNum}
            onPress={addCombination}
            style={styles.addComboBtn}>
            Add combination
          </Button>

          {!!error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.spacer} />
          <Button
            variant="primary"
            size="lg"
            fullWidth
            icon="git-network-outline"
            loading={submitting}
            disabled={!isValid}
            onPress={handleCreate}>
            Create & generate bracket
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const CombinationCard = ({
  index,
  combo,
  canRemove,
  onChangeLabel,
  onChangePerf,
  onAddLayer,
  onUpdateLayer,
  onRemoveLayer,
  onRemove,
}) => {
  const autoLabel = buildCombinationLabel(combo.layers);
  return (
    <Card style={styles.comboCard}>
      <View style={styles.comboHeader}>
        <Text style={styles.comboIndex}>#{index + 1}</Text>
        <Text style={styles.comboAuto} numberOfLines={1}>
          {combo.label.trim() || autoLabel}
        </Text>
        {canRemove && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Remove combination ${index + 1}`}
            onPress={onRemove}
            hitSlop={8}
            style={({pressed}) => [pressed && {opacity: 0.6}]}>
            <Ionicons name="trash-outline" size={20} color={colors.textTertiary} />
          </Pressable>
        )}
      </View>

      {combo.layers.map(layer => (
        <LayerEditor
          key={layer.key}
          layer={layer}
          showRemove={combo.layers.length > 1}
          onChange={patch => onUpdateLayer(layer.key, patch)}
          onRemove={() => onRemoveLayer(layer.key)}
        />
      ))}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add layer"
        onPress={onAddLayer}
        style={({pressed}) => [styles.addLayerRow, pressed && {opacity: 0.6}]}>
        <Ionicons name="add" size={18} color={colors.waxtruck} />
        <Text style={styles.addLayerText}>Add layer</Text>
      </Pressable>

      <View style={styles.spacerSm} />
      <Input
        label="Custom label (optional)"
        icon="pricetag-outline"
        placeholder={autoLabel}
        value={combo.label}
        onChangeText={onChangeLabel}
      />
      <View style={styles.spacerSm} />
      <Input
        label="Performance number (optional)"
        icon="speedometer-outline"
        placeholder="e.g. glide-out distance"
        value={String(combo.performanceNumber)}
        onChangeText={onChangePerf}
        keyboardType={
          Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'
        }
      />
    </Card>
  );
};

const LayerEditor = ({layer, showRemove, onChange, onRemove}) => (
  <View style={styles.layerBlock}>
    <View style={styles.categoryRow}>
      {WAX_CATEGORIES.map(cat => {
        const active = layer.category === cat;
        return (
          <Pressable
            key={cat}
            accessibilityRole="button"
            accessibilityLabel={`${CATEGORY_LABEL[cat]} category`}
            accessibilityState={{selected: active}}
            onPress={() => onChange({category: cat})}
            style={({pressed}) => [
              styles.catChip,
              active && styles.catChipActive,
              pressed && {opacity: 0.7},
            ]}>
            <Ionicons
              name={CATEGORY_ICON[cat]}
              size={14}
              color={active ? colors.bg : colors.textSecondary}
            />
            <Text
              style={[
                styles.catChipText,
                {color: active ? colors.bg : colors.textSecondary},
              ]}>
              {CATEGORY_LABEL[cat]}
            </Text>
          </Pressable>
        );
      })}
    </View>
    <View style={styles.layerPickerRow}>
      <View style={styles.layerPickerCell}>
        <WaxPicker
          label={CATEGORY_LABEL[layer.category]}
          category={layer.category}
          icon={CATEGORY_ICON[layer.category]}
          placeholder="Pick or type any wax"
          value={{id: layer.waxId, name: layer.waxName}}
          onChange={next =>
            onChange({waxId: next.id, waxName: next.name})
          }
        />
      </View>
      {showRemove && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Remove layer"
          onPress={onRemove}
          hitSlop={8}
          style={({pressed}) => [styles.layerRemove, pressed && {opacity: 0.6}]}>
          <Ionicons name="close" size={20} color={colors.textTertiary} />
        </Pressable>
      )}
    </View>
  </View>
);

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.bg},
  flex: {flex: 1},
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  headerBtn: {paddingHorizontal: spacing.sm, paddingVertical: spacing.xs},
  headerBtnText: {...typography.headingMd, color: colors.waxtruck},
  spacer: {height: spacing.lg},
  spacerSm: {height: spacing.md},
  miniLabel: {
    ...typography.caption,
    color: colors.textTertiary,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  helpText: {
    ...typography.bodySm,
    color: colors.textSecondary,
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.md,
  },
  chipRow: {flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.xs},
  chipWrap: {marginRight: spacing.sm, marginBottom: spacing.sm},
  row2: {flexDirection: 'row'},
  row2Cell: {flex: 1},
  row2Spacer: {width: spacing.md},
  fleetRow: {flexDirection: 'row', paddingHorizontal: spacing.xs},
  fleetCell: {marginRight: spacing.sm},
  comboCard: {marginBottom: spacing.md},
  comboHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  comboIndex: {
    ...typography.headingMd,
    color: colors.waxtruck,
    marginRight: spacing.md,
  },
  comboAuto: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
    marginRight: spacing.md,
  },
  layerBlock: {
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  catChipActive: {
    backgroundColor: colors.waxtruck,
    borderColor: colors.waxtruck,
  },
  catChipText: {
    ...typography.bodySm,
    fontWeight: '700',
    marginLeft: 4,
  },
  layerPickerRow: {flexDirection: 'row', alignItems: 'center'},
  layerPickerCell: {flex: 1},
  layerRemove: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  addLayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  addLayerText: {
    ...typography.bodySm,
    color: colors.waxtruck,
    fontWeight: '700',
    marginLeft: 4,
  },
  addComboBtn: {marginTop: spacing.sm, alignSelf: 'flex-start'},
  error: {
    ...typography.body,
    color: colors.red,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});

export default WaxTestSetupScreen;
