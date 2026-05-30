import React, {useState, useEffect, useMemo} from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import Toast from 'react-native-toast-message';
import {useAuth} from '../context/AuthContext';
import useSkis from '../hooks/useSkis';
import {createTestLog} from '../services/testLogService';
import {firestore} from '../services/firebase';
import {getCurrentLocation} from '../services/locationService';
import {
  Header,
  Card,
  Input,
  Button,
  Pill,
  SectionHeader,
  EmptyState,
} from '../components/ui';
import {colors, spacing, typography} from '../theme';

const SNOW_OPTIONS = ['Old', 'New', 'Manmade'];
const SURFACE_OPTIONS = ['Hardpack', 'Powder', 'Corduroy', 'Slush'];

const emptyTestEntry = () => ({
  glideWax: '',
  kickWax: '',
  glideRating: 5,
  kickRating: 5,
  stabilityRating: 5,
  climbingRating: 5,
  notes: '',
});

// 1-10 rating picker using a row of small numbered tappable pills.
const RatingPicker = ({label, value, onChange}) => (
  <View style={styles.ratingBlock}>
    <View style={styles.ratingHeader}>
      <Text style={styles.ratingLabel}>{label}</Text>
      <Text style={styles.ratingValue}>{value ?? '—'}</Text>
    </View>
    <View style={styles.ratingRow}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => {
        const selected = Number(value) === n;
        return (
          <Pressable
            key={n}
            accessibilityRole="button"
            accessibilityLabel={`${label} ${n}`}
            onPress={() => onChange(n)}
            style={({pressed}) => [
              styles.ratingDot,
              selected && styles.ratingDotSelected,
              pressed && {opacity: 0.7},
            ]}>
            <Text
              style={[
                styles.ratingDotText,
                selected && styles.ratingDotTextSelected,
              ]}>
              {n}
            </Text>
          </Pressable>
        );
      })}
    </View>
  </View>
);

const TestEntryCard = ({ski, entry, onChange}) => {
  const tech = (ski.technique || '').toLowerCase();
  return (
    <Card style={styles.entryCard}>
      <Text style={styles.entryTitle}>{ski.name || ski.id}</Text>
      {/* Read-only ski attributes — ghost variant so they read as quiet
          labels, NOT like the tappable outline/solid selector pills. */}
      <View style={styles.entryPillRow}>
        {!!ski.technique && (
          <View style={styles.entryPillWrap}>
            <Pill variant="ghost" color="neutral">
              {ski.technique}
            </Pill>
          </View>
        )}
        {!!ski.type && (
          <View style={styles.entryPillWrap}>
            <Pill variant="ghost" color="neutral">
              {ski.type}
            </Pill>
          </View>
        )}
      </View>

      <RatingPicker
        label="Glide"
        value={entry.glideRating}
        onChange={v => onChange({glideRating: v})}
      />
      {tech === 'classic' && (
        <RatingPicker
          label="Kick"
          value={entry.kickRating}
          onChange={v => onChange({kickRating: v})}
        />
      )}
      {tech === 'skate' && (
        <>
          <RatingPicker
            label="Stability"
            value={entry.stabilityRating}
            onChange={v => onChange({stabilityRating: v})}
          />
          <RatingPicker
            label="Climbing"
            value={entry.climbingRating}
            onChange={v => onChange({climbingRating: v})}
          />
        </>
      )}

      <View style={styles.fieldSpacer} />
      <Input
        label="Notes"
        icon="create-outline"
        value={entry.notes}
        onChangeText={t => onChange({notes: t})}
        multiline
      />
    </Card>
  );
};

const TestingLogScreen = () => {
  const navigation = useNavigation();
  const {user} = useAuth();
  const uid = user?.uid;

  const {skis: skisForUser, loading: loadingSkis} = useSkis(uid);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [selectedSkis, setSelectedSkis] = useState([]);
  const [conditions, setConditions] = useState({
    temperature: '',
    humidity: '',
    snowType: '',
    surface: '',
  });
  const [location, setLocation] = useState(null);
  const [locationLabel, setLocationLabel] = useState('');
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [skiTestEntries, setSkiTestEntries] = useState({});

  const captureLocation = async () => {
    setFetchingLocation(true);
    try {
      const here = await getCurrentLocation();
      if (here) {
        setLocation(here);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Location unavailable',
          text2:
            'Make sure Location Services + NordicFleet are enabled in Settings.',
          position: 'top',
          visibilityTime: 2400,
        });
      }
    } finally {
      setFetchingLocation(false);
    }
  };

  const clearLocation = () => {
    setLocation(null);
    setLocationLabel('');
  };

  useEffect(() => {
    setSkiTestEntries(prev => {
      const next = {};
      for (const skiId of selectedSkis) {
        next[skiId] = prev[skiId] || emptyTestEntry();
      }
      return next;
    });
  }, [selectedSkis]);

  const skiById = useMemo(() => {
    const map = {};
    skisForUser.forEach(s => {
      map[s.id] = s;
    });
    return map;
  }, [skisForUser]);

  const toggleSki = skiId => {
    setSelectedSkis(prev =>
      prev.includes(skiId) ? prev.filter(s => s !== skiId) : [...prev, skiId],
    );
  };

  const setCondition = (k, v) => setConditions(prev => ({...prev, [k]: v}));
  const togglePill = (k, v) =>
    setConditions(prev => ({...prev, [k]: prev[k] === v ? '' : v}));

  const handleEntryChange = (skiId, partial) => {
    setSkiTestEntries(prev => ({
      ...prev,
      [skiId]: {...prev[skiId], ...partial},
    }));
  };

  const canSave = !!uid && selectedSkis.length > 0;

  const handleSubmit = async () => {
    setError('');
    if (!uid) {
      setError('Sign in to save');
      return;
    }
    if (selectedSkis.length === 0) {
      setError('Pick at least one ski');
      return;
    }
    setSubmitting(true);
    const date = firestore.FieldValue.serverTimestamp();
    const writes = selectedSkis.map(skiId => {
      const entry = skiTestEntries[skiId] || emptyTestEntry();
      const ski = skiById[skiId] || {};
      const technique = (ski.technique || '').toLowerCase();
      const payload = {
        skiId,
        date,
        temperature: conditions.temperature,
        humidity: conditions.humidity,
        snowType: conditions.snowType,
        surface: conditions.surface,
        location: location
          ? {
              latitude: location.latitude,
              longitude: location.longitude,
              accuracy: location.accuracy,
              label: locationLabel.trim() || null,
            }
          : null,
        ...entry,
      };
      if (technique === 'skate') {
        payload.kickWax = null;
        payload.kickRating = null;
      } else if (technique === 'classic') {
        payload.stabilityRating = null;
        payload.climbingRating = null;
      }
      return createTestLog(uid, payload);
    });
    try {
      await Promise.all(writes);
    } catch (err) {
      const code = err && err.code;
      if (code && !String(code).includes('unavailable')) {
        setError(String(err.message || err));
        setSubmitting(false);
        return;
      }
    }
    setSubmitting(false);
    Toast.show({
      type: 'success',
      text1: 'Test logged',
      text2: `${selectedSkis.length} ski${selectedSkis.length === 1 ? '' : 's'}`,
      position: 'top',
      visibilityTime: 2200,
    });
    navigation.navigate('Home');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <Header
        title="Log test"
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Save"
            disabled={!canSave || submitting}
            onPress={handleSubmit}
            hitSlop={8}
            style={({pressed}) => [
              styles.headerSave,
              (!canSave || submitting) && {opacity: 0.4},
              pressed && {opacity: 0.6},
            ]}>
            <Text style={styles.headerSaveText}>Save</Text>
          </Pressable>
        }
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled">
          {loadingSkis ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={colors.red} />
            </View>
          ) : skisForUser.length === 0 ? (
            <EmptyState
              icon="snow-outline"
              title="No skis in your fleet yet"
              description="Add a ski first so you can log a test for it."
              cta={{
                label: 'Add a ski',
                icon: 'add',
                onPress: () => navigation.navigate('newSki'),
              }}
            />
          ) : (
            <>
              <SectionHeader title="Conditions" />
              <Card>
                <View style={styles.row2}>
                  <View style={styles.row2Cell}>
                    <Input
                      label="Temperature"
                      icon="thermometer-outline"
                      value={conditions.temperature}
                      onChangeText={t => setCondition('temperature', t)}
                      keyboardType="numbers-and-punctuation"
                      suffix="°C"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                  <View style={styles.row2Spacer} />
                  <View style={styles.row2Cell}>
                    <Input
                      label="Humidity"
                      icon="water-outline"
                      value={conditions.humidity}
                      onChangeText={t => setCondition('humidity', t)}
                      keyboardType="number-pad"
                      suffix="%"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>
                <View style={styles.fieldSpacer} />
                <Text style={styles.miniLabel}>Snow</Text>
                <View style={styles.chipRow}>
                  {SNOW_OPTIONS.map(o => (
                    <View key={o} style={styles.chipWrap}>
                      <Pill
                        variant={conditions.snowType === o ? 'solid' : 'outline'}
                        color="red"
                        onPress={() => togglePill('snowType', o)}>
                        {o}
                      </Pill>
                    </View>
                  ))}
                </View>
                <View style={styles.fieldSpacer} />
                <Text style={styles.miniLabel}>Surface</Text>
                <View style={styles.chipRow}>
                  {SURFACE_OPTIONS.map(o => (
                    <View key={o} style={styles.chipWrap}>
                      <Pill
                        variant={conditions.surface === o ? 'solid' : 'outline'}
                        color="red"
                        onPress={() => togglePill('surface', o)}>
                        {o}
                      </Pill>
                    </View>
                  ))}
                </View>

                <View style={styles.fieldSpacer} />
                <Text style={styles.miniLabel}>Location</Text>
                {location ? (
                  <>
                    <View style={styles.locRow}>
                      <Ionicons
                        name="location"
                        size={18}
                        color={colors.red}
                      />
                      <Text style={styles.locText}>
                        {location.latitude.toFixed(4)},{' '}
                        {location.longitude.toFixed(4)}
                        {location.accuracy
                          ? ` (±${Math.round(location.accuracy)}m)`
                          : ''}
                      </Text>
                      <Pressable
                        onPress={clearLocation}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel="Remove location">
                        <Ionicons
                          name="close-circle"
                          size={20}
                          color={colors.textTertiary}
                        />
                      </Pressable>
                    </View>
                    <View style={styles.fieldSpacer} />
                    <Input
                      label="Label (optional)"
                      icon="pricetag-outline"
                      value={locationLabel}
                      onChangeText={setLocationLabel}
                      placeholder="e.g. Craftsbury"
                      autoCapitalize="words"
                    />
                  </>
                ) : (
                  <View style={styles.chipRow}>
                    <View style={styles.chipWrap}>
                      <Pill
                        variant="outline"
                        color="red"
                        onPress={captureLocation}
                        accessibilityLabel="Use current location">
                        {fetchingLocation
                          ? 'Locating…'
                          : 'Use current location'}
                      </Pill>
                    </View>
                  </View>
                )}
              </Card>

              <SectionHeader title="Select skis" />
              <Card style={styles.selectorCard}>
                <View style={styles.chipRow}>
                  {skisForUser.map(ski => {
                    const selected = selectedSkis.includes(ski.id);
                    return (
                      <View key={ski.id} style={styles.chipWrap}>
                        <Pill
                          variant={selected ? 'solid' : 'outline'}
                          color="red"
                          onPress={() => toggleSki(ski.id)}
                          accessibilityLabel={ski.name || ski.id}>
                          {ski.name || ski.id}
                        </Pill>
                      </View>
                    );
                  })}
                </View>
                {selectedSkis.length === 0 && (
                  <Text style={styles.hint}>
                    Tap one or more skis to rate.
                  </Text>
                )}
              </Card>

              {selectedSkis.length > 0 && (
                <>
                  <SectionHeader title="Ratings" />
                  {selectedSkis.map(skiId => {
                    const ski = skiById[skiId];
                    if (!ski) {
                      return null;
                    }
                    return (
                      <TestEntryCard
                        key={skiId}
                        ski={ski}
                        entry={skiTestEntries[skiId] || emptyTestEntry()}
                        onChange={partial => handleEntryChange(skiId, partial)}
                      />
                    );
                  })}
                </>
              )}

              {!!error && <Text style={styles.error}>{error}</Text>}

              <View style={styles.fieldSpacer} />
              <Button
                variant="primary"
                size="lg"
                fullWidth
                icon="checkmark"
                loading={submitting}
                disabled={!canSave}
                onPress={handleSubmit}>
                Save test log
              </Button>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.bg},
  flex: {flex: 1},
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  headerSave: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  headerSaveText: {
    ...typography.headingMd,
    color: colors.red,
  },
  loadingWrap: {
    paddingVertical: spacing['4xl'],
    alignItems: 'center',
  },
  row2: {flexDirection: 'row'},
  row2Cell: {flex: 1},
  row2Spacer: {width: spacing.md},
  miniLabel: {
    ...typography.caption,
    color: colors.textTertiary,
    marginBottom: spacing.sm,
  },
  chipRow: {flexDirection: 'row', flexWrap: 'wrap'},
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  locText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  chipWrap: {marginRight: spacing.sm, marginBottom: spacing.sm},
  fieldSpacer: {height: spacing.lg},
  selectorCard: {marginBottom: spacing.lg},
  hint: {
    ...typography.bodySm,
    color: colors.textTertiary,
    marginTop: spacing.md,
  },
  entryCard: {marginBottom: spacing.lg},
  entryTitle: {
    ...typography.headingLg,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  entryPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.lg,
  },
  entryPillWrap: {marginRight: spacing.sm, marginBottom: spacing.sm},

  ratingBlock: {
    marginBottom: spacing.lg,
  },
  ratingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.sm,
  },
  ratingLabel: {
    ...typography.headingMd,
    color: colors.textPrimary,
  },
  ratingValue: {
    ...typography.displayMd,
    color: colors.red,
    fontWeight: '700',
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ratingDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingDotSelected: {
    backgroundColor: colors.red,
    borderColor: colors.red,
  },
  ratingDotText: {
    ...typography.bodySm,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  ratingDotTextSelected: {
    color: colors.textPrimary,
  },
  error: {
    ...typography.body,
    color: colors.red,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});

export default TestingLogScreen;
