import React, {useState, useEffect, useMemo} from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Pressable,
  StatusBar,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import Toast from 'react-native-toast-message';
import {useAuth} from '../context/AuthContext';
import useSkis from '../hooks/useSkis';
import {waxLogHasContent} from '@nordicfleet/core';
import {createWaxLog} from '../services/waxLogService';
import {firestore} from '../services/firebase';
import {
  Header,
  Card,
  Input,
  Button,
  Pill,
  SectionHeader,
  EmptyState,
  WaxPicker,
} from '../components/ui';
import {colors, radius, spacing, typography} from '../theme';

const BINDER_OPTIONS = [
  'None',
  'VG Swix',
  'Toko Base',
  'GS Base AT',
  'GS Base Super',
  'Chola',
  'K-base',
  'Rode Blackbase',
  'KS base',
];

const MAX_LAYERS = 6;

const emptyWaxEntry = () => ({
  binder: '',
  kickLayers: 1,
  kickWax: '',
  glideLayers: 1,
  glideWaxes: [''],
  notes: '',
});

const Stepper = ({value, onChange, min = 0, max = MAX_LAYERS, label}) => (
  <View style={styles.stepperRow}>
    <Text style={styles.stepperLabel}>{label}</Text>
    <View style={styles.stepperControls}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Decrease ${label}`}
        disabled={value <= min}
        onPress={() => onChange(Math.max(min, value - 1))}
        style={({pressed}) => [
          styles.stepperBtn,
          value <= min && {opacity: 0.4},
          pressed && {opacity: 0.6},
        ]}>
        <Ionicons name="remove" size={18} color={colors.textPrimary} />
      </Pressable>
      <Text style={styles.stepperValue}>{value}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Increase ${label}`}
        disabled={value >= max}
        onPress={() => onChange(Math.min(max, value + 1))}
        style={({pressed}) => [
          styles.stepperBtn,
          value >= max && {opacity: 0.4},
          pressed && {opacity: 0.6},
        ]}>
        <Ionicons name="add" size={18} color={colors.textPrimary} />
      </Pressable>
    </View>
  </View>
);

// Keep the glideWaxes array sized to glideLayers count.
const resizeArr = (arr, n, fill = '') => {
  const out = arr.slice(0, n);
  while (out.length < n) {
    out.push(fill);
  }
  return out;
};

// Short one-line summary of what's been entered — shown on a collapsed
// accordion card so the coach can scan filled vs. empty without expanding.
const summarizeEntry = entry => {
  const parts = [];
  if (entry.binder && entry.binder !== 'None') {
    parts.push(entry.binder);
  }
  const glides = (entry.glideWaxes || []).filter(g => (g || '').trim());
  if (glides.length) {
    parts.push(glides.join(' + '));
  }
  if (entry.kickWax && (entry.kickWax || '').trim()) {
    parts.push(`kick: ${entry.kickWax}`);
  }
  return parts.length ? parts.join(' · ') : 'Not filled in yet';
};

const WaxEntryCard = ({ski, entry, onChange, collapsible, expanded, onToggle}) => {
  const isClassic = (ski.technique || '').toLowerCase() === 'classic';

  const setBinder = b => onChange({binder: entry.binder === b ? '' : b});
  const setKickLayers = n => onChange({kickLayers: n});
  const setGlideLayers = n =>
    onChange({
      glideLayers: n,
      glideWaxes: resizeArr(entry.glideWaxes || [], n),
    });
  const setGlideAt = (i, v) => {
    const next = resizeArr(entry.glideWaxes || [], entry.glideLayers);
    next[i] = v;
    onChange({glideWaxes: next});
  };

  // In accordion mode the title row toggles the body; otherwise it's a
  // plain header and the body is always shown.
  const TitleRow = (
    <>
      <View style={styles.entryHeaderRow}>
        <Text style={styles.entryTitle}>{ski.name || ski.id}</Text>
        {collapsible && (
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={22}
            color={colors.textSecondary}
          />
        )}
      </View>
      {collapsible && !expanded && (
        <Text style={styles.entrySummary} numberOfLines={1}>
          {summarizeEntry(entry)}
        </Text>
      )}
    </>
  );

  return (
    <Card style={styles.entryCard}>
      {collapsible ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${ski.name || ski.id} wax entry, ${expanded ? 'expanded' : 'collapsed'}`}
          accessibilityState={{expanded}}
          onPress={onToggle}
          style={({pressed}) => [pressed && {opacity: 0.7}]}>
          {TitleRow}
        </Pressable>
      ) : (
        TitleRow
      )}

      {!expanded ? null : (
        <>
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

      <Text style={styles.miniLabel}>Binder</Text>
      <View style={styles.chipRow}>
        {BINDER_OPTIONS.map(b => {
          const selected = entry.binder === b;
          return (
            <View key={b} style={styles.chipWrap}>
              <Pill
                variant={selected ? 'solid' : 'outline'}
                color="red"
                onPress={() => setBinder(b)}>
                {b}
              </Pill>
            </View>
          );
        })}
      </View>

      {isClassic && (
        <>
          <View style={styles.fieldSpacer} />
          <Stepper
            label="Kick layers"
            value={entry.kickLayers ?? 0}
            onChange={setKickLayers}
          />
          <Text style={styles.hint}>
            How many coats of the same kick wax.
          </Text>
          {entry.kickLayers > 0 && (
            <>
              <View style={styles.fieldSpacer} />
              <WaxPicker
                label="Kick wax"
                icon="thermometer-outline"
                type="kick"
                value={{id: entry.kickWaxId, name: entry.kickWax}}
                onChange={picked =>
                  onChange({kickWax: picked.name, kickWaxId: picked.id})
                }
              />
            </>
          )}
        </>
      )}

      <View style={styles.fieldSpacer} />
      <Stepper
        label="Glide layers"
        value={entry.glideLayers ?? 1}
        onChange={setGlideLayers}
        min={1}
      />
      <Text style={styles.hint}>
        Each layer is its own wax, base coat to finish. Pick the same wax
        twice to record two coats of it.
      </Text>
      <View style={styles.fieldSpacer} />
      {resizeArr(entry.glideWaxes || [], entry.glideLayers).map((g, i) => {
        const glideIds = entry.glideWaxIds || [];
        const id = glideIds[i] || null;
        return (
          <View key={i} style={i > 0 ? styles.fieldSpacerSm : undefined}>
            <WaxPicker
              label={`Glide layer ${i + 1}`}
              icon="water-outline"
              type="glide"
              value={{id, name: g}}
              onChange={picked => {
                setGlideAt(i, picked.name);
                const nextIds = (entry.glideWaxIds || []).slice(
                  0,
                  entry.glideLayers,
                );
                while (nextIds.length < entry.glideLayers) {
                  nextIds.push(null);
                }
                nextIds[i] = picked.id;
                onChange({glideWaxIds: nextIds});
              }}
            />
          </View>
        );
      })}

      <View style={styles.fieldSpacer} />
      <Input
        label="Notes"
        icon="create-outline"
        value={entry.notes}
        onChangeText={t => onChange({notes: t})}
        multiline
      />
        </>
      )}
    </Card>
  );
};

const WaxLogScreen = () => {
  const navigation = useNavigation();
  const {user} = useAuth();
  const uid = user?.uid;

  const {skis: skisForUser, loading: loadingSkis} = useSkis(uid);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [selectedSkis, setSelectedSkis] = useState([]);
  const [waxLog, setWaxLog] = useState({});
  // With 3+ skis the per-ski forms become a wall, so we collapse them
  // into an accordion and keep one open at a time.
  const accordion = selectedSkis.length >= 3;
  const [expandedSki, setExpandedSki] = useState(null);

  useEffect(() => {
    if (!accordion) {
      return;
    }
    // Keep a valid ski expanded — default to the first selected.
    setExpandedSki(prev =>
      prev && selectedSkis.includes(prev) ? prev : selectedSkis[0],
    );
  }, [accordion, selectedSkis]);

  useEffect(() => {
    setWaxLog(prev => {
      const next = {};
      for (const skiId of selectedSkis) {
        next[skiId] = prev[skiId] || emptyWaxEntry();
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

  const handleEntryChange = (skiId, partial) => {
    setWaxLog(prev => ({
      ...prev,
      [skiId]: {...prev[skiId], ...partial},
    }));
  };

  const canSave = !!uid && selectedSkis.length > 0;

  const handleSave = async () => {
    setError('');
    if (!uid) {
      setError('Sign in to save');
      return;
    }
    if (selectedSkis.length === 0) {
      setError('Pick at least one ski');
      return;
    }
    // Block empty logs (#13): every selected ski needs at least one
    // meaningful field (binder, kick, glide, or a note).
    const emptyIds = selectedSkis.filter(
      id => !waxLogHasContent(waxLog[id] || emptyWaxEntry()),
    );
    if (emptyIds.length > 0) {
      const names = emptyIds
        .map(id => skiById[id]?.name || 'a ski')
        .join(', ');
      setError(
        `Add a wax (binder, kick, or glide) or a note for ${names} before saving.`,
      );
      return;
    }
    setSubmitting(true);
    const date = firestore.FieldValue.serverTimestamp();
    const writes = selectedSkis.map(skiId => {
      const entry = waxLog[skiId] || emptyWaxEntry();
      const ski = skiById[skiId] || {};
      const technique = (ski.technique || '').toLowerCase();
      const payload = {
        skiId,
        date,
        ...entry,
        binder: entry.binder && entry.binder !== 'None' ? entry.binder : null,
      };
      if (technique === 'skate') {
        payload.kickLayers = 0;
        payload.kickWax = null;
      }
      return createWaxLog(uid, payload);
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
    const onlySkiId = selectedSkis.length === 1 ? selectedSkis[0] : null;
    Toast.show({
      type: 'success',
      text1: 'Wax logged',
      text2: onlySkiId
        ? 'Opening its history…'
        : `${selectedSkis.length} skis`,
      position: 'top',
      visibilityTime: 2200,
    });
    // Post-save context (#12): a single-ski log opens that ski's detail
    // so the new entry is visible in its history, instead of dropping the
    // user back on Home where the log feels like it vanished.
    if (onlySkiId) {
      navigation.navigate('SkiInfo', {skiId: onlySkiId});
    } else {
      navigation.navigate('Home');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <Header
        title="Log wax"
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Save"
            disabled={!canSave || submitting}
            onPress={handleSave}
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
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled">
          {loadingSkis ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={colors.red} />
            </View>
          ) : skisForUser.length === 0 ? (
            <EmptyState
              icon="snow-outline"
              title="No skis in your fleet yet"
              description="Add a ski first so you can log a wax for it."
              cta={{
                label: 'Add a ski',
                icon: 'add',
                onPress: () => navigation.navigate('newSki'),
              }}
            />
          ) : (
            <>
              <SectionHeader title="Step 1 · Select skis" />
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
                    Tap one or more skis to log a wax for.
                  </Text>
                )}
              </Card>

              {selectedSkis.length > 0 && (
                <>
                  <SectionHeader title="Step 2 · Wax details" />
                  {selectedSkis.map(skiId => {
                    const ski = skiById[skiId];
                    if (!ski) {
                      return null;
                    }
                    return (
                      <WaxEntryCard
                        key={skiId}
                        ski={ski}
                        entry={waxLog[skiId] || emptyWaxEntry()}
                        onChange={partial => handleEntryChange(skiId, partial)}
                        collapsible={accordion}
                        expanded={!accordion || expandedSki === skiId}
                        onToggle={() =>
                          setExpandedSki(prev =>
                            prev === skiId ? null : skiId,
                          )
                        }
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
                onPress={handleSave}>
                Save wax log
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
  selectorCard: {
    marginBottom: spacing.lg,
  },
  hint: {
    ...typography.bodySm,
    color: colors.textTertiary,
    marginTop: spacing.md,
  },
  entryCard: {
    marginBottom: spacing.lg,
  },
  entryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  entryTitle: {
    ...typography.headingLg,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    flexShrink: 1,
  },
  entrySummary: {
    ...typography.bodySm,
    color: colors.textTertiary,
    marginBottom: spacing.xs,
  },
  entryPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.lg,
  },
  entryPillWrap: {
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  miniLabel: {
    ...typography.caption,
    color: colors.textTertiary,
    marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chipWrap: {
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  fieldSpacer: {height: spacing.lg},
  fieldSpacerSm: {marginTop: spacing.md},
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperLabel: {
    ...typography.bodyLg,
    color: colors.textPrimary,
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.xs,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    ...typography.headingMd,
    color: colors.textPrimary,
    minWidth: 24,
    textAlign: 'center',
  },
  error: {
    ...typography.body,
    color: colors.red,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});

export default WaxLogScreen;
