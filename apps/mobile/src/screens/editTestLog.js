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
import Toast from 'react-native-toast-message';

import {useAuth} from '../context/AuthContext';
import useSkis from '../hooks/useSkis';
import {getTestLog, updateTestLog} from '../services/testLogService';
import {TestEntryCard, emptyTestEntry} from './testinglog';
import {
  Header,
  Card,
  Input,
  Button,
  Pill,
  SectionHeader,
} from '../components/ui';
import {colors, spacing, typography} from '../theme';

const SNOW_OPTIONS = ['Old', 'New', 'Manmade'];
const SURFACE_OPTIONS = ['Hardpack', 'Powder', 'Corduroy', 'Slush'];

// Map a stored (lowercased) enum back to its capitalised chip option.
const toOption = (options, stored) =>
  options.find(o => o.toLowerCase() === String(stored || '').toLowerCase()) ||
  '';

const EditTestLogScreen = ({route}) => {
  const navigation = useNavigation();
  const {user} = useAuth();
  const uid = user?.uid;
  const logId = route?.params?.logId;
  const skiId = route?.params?.skiId;

  const {skis} = useSkis(uid, {includeRetired: true});

  const [entry, setEntry] = useState(null);
  const [conditions, setConditions] = useState({
    temperature: '',
    humidity: '',
    snowType: '',
    surface: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const ski = useMemo(
    () =>
      skis.find(s => s.id === skiId) || {
        id: skiId,
        name: 'Ski',
        technique: '',
      },
    [skis, skiId],
  );

  useEffect(() => {
    let active = true;
    if (!uid || !logId) {
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    getTestLog(uid, logId)
      .then(log => {
        if (!active) {
          return;
        }
        if (log) {
          const base = emptyTestEntry();
          setEntry({
            ...base,
            glideWax: log.glideWax || '',
            kickWax: log.kickWax || '',
            glideRating: log.glideRating ?? base.glideRating,
            kickRating: log.kickRating ?? base.kickRating,
            stabilityRating: log.stabilityRating ?? base.stabilityRating,
            climbingRating: log.climbingRating ?? base.climbingRating,
            notes: log.notes || '',
          });
          setConditions({
            temperature:
              log.temperature === null || log.temperature === undefined
                ? ''
                : String(log.temperature),
            humidity:
              log.humidity === null || log.humidity === undefined
                ? ''
                : String(log.humidity),
            snowType: toOption(SNOW_OPTIONS, log.snowType),
            surface: toOption(SURFACE_OPTIONS, log.surface),
          });
        } else {
          setEntry(null);
        }
        setLoading(false);
      })
      .catch(() => {
        if (active) {
          setError('Could not load this test log.');
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [uid, logId]);

  const setCondition = (k, v) => setConditions(prev => ({...prev, [k]: v}));
  const togglePill = (k, v) =>
    setConditions(prev => ({...prev, [k]: prev[k] === v ? '' : v}));
  const handleEntryChange = partial =>
    setEntry(prev => ({...prev, ...partial}));

  const canSave = !!uid && !!logId && !!entry && !submitting;

  const handleSave = async () => {
    setError('');
    if (!uid || !logId || !entry) {
      return;
    }
    setSubmitting(true);
    const technique = (ski.technique || '').toLowerCase();
    const payload = {
      temperature: conditions.temperature,
      humidity: conditions.humidity,
      snowType: conditions.snowType,
      surface: conditions.surface,
      ...entry,
    };
    if (technique === 'skate') {
      payload.kickWax = null;
      payload.kickRating = null;
    } else if (technique === 'classic') {
      payload.stabilityRating = null;
      payload.climbingRating = null;
    }
    try {
      await updateTestLog(uid, logId, payload);
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
      text1: 'Test updated',
      position: 'top',
      visibilityTime: 2000,
    });
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <Header
        title="Edit test"
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Save"
            disabled={!canSave}
            onPress={handleSave}
            hitSlop={8}
            style={({pressed}) => [
              styles.headerSave,
              !canSave && {opacity: 0.4},
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
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={colors.red} />
            </View>
          ) : !entry ? (
            <Text style={styles.notFound}>
              This test log could not be found.
            </Text>
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
              </Card>

              <SectionHeader title="Ratings" />
              <TestEntryCard
                ski={ski}
                entry={entry}
                onChange={handleEntryChange}
              />

              {!!error && <Text style={styles.error}>{error}</Text>}

              <View style={styles.fieldSpacer} />
              <Button
                variant="primary"
                size="lg"
                fullWidth
                icon="checkmark"
                loading={submitting}
                disabled={!entry}
                onPress={handleSave}>
                Save changes
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
  notFound: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing['4xl'],
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
  chipWrap: {marginRight: spacing.sm, marginBottom: spacing.sm},
  fieldSpacer: {height: spacing.lg},
  error: {
    ...typography.body,
    color: colors.red,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});

export default EditTestLogScreen;
