// ComposeAdvisory — coach-side screen for sending a race-day advisory.
//
// Route params:
//   athleteUid    required
//   athleteName   optional (display only)
//
// Flow:
//   1. Loads the athlete's ski fleet (read-only — coach is just
//      selecting, not editing).
//   2. Coach fills event name + date, optionally conditions, picks
//      primary + backup skis with per-ski notes, optionally a free-
//      form body.
//   3. Send → sendAdvisory(payload) → Toast → navigate back.
//
// The screen mirrors AthleteDetail's send-message modal in tone but
// is full-screen because the structured form is too tall for a sheet.

import React, {useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Pressable,
  Switch,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import Ionicons from 'react-native-vector-icons/Ionicons';

import {useAuth} from '../context/AuthContext';
import {listSkisForAthlete} from '../services/skiService';
import {sendAdvisory} from '../services/messageService';
import {
  Header,
  Card,
  Input,
  Button,
  Pill,
  SectionHeader,
} from '../components/ui';
import {colors, radius, spacing, typography} from '../theme';

const SNOW_TYPES = ['Cold', 'Universal', 'Warm', 'Zero'];

const ComposeAdvisoryScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {user} = useAuth();
  const coachUid = user?.uid;
  const athleteUid = route.params?.athleteUid;
  const athleteName = route.params?.athleteName || 'athlete';

  const [athleteSkis, setAthleteSkis] = useState([]);
  const [loadingSkis, setLoadingSkis] = useState(true);

  // Form state.
  const [event, setEvent] = useState('');
  const [eventDate, setEventDate] = useState(defaultUpcomingDate());
  const [snowType, setSnowType] = useState('');
  const [snowTemp, setSnowTemp] = useState('');
  const [airTemp, setAirTemp] = useState('');
  const [humidity, setHumidity] = useState('');
  const [newSnow, setNewSnow] = useState(false);
  const [conditionsNotes, setConditionsNotes] = useState('');
  const [body, setBody] = useState('');
  // skiId → { role: 'primary' | 'backup', notes: string }
  const [skiPicks, setSkiPicks] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!coachUid || !athleteUid) {
      setLoadingSkis(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const list = await listSkisForAthlete(coachUid, athleteUid);
        if (!cancelled) {
          setAthleteSkis(list.filter(s => !s.retired));
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('[ComposeAdvisory] failed to load skis', err);
          setError("Couldn't load athlete's fleet — try again.");
        }
      } finally {
        if (!cancelled) setLoadingSkis(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [coachUid, athleteUid]);

  // Primary ski count drives the Send-enabled gate.
  const primaryCount = useMemo(
    () => Object.values(skiPicks).filter(p => p.role === 'primary').length,
    [skiPicks],
  );

  const isValid = useMemo(
    () => !!event.trim() && isValidISODate(eventDate) && primaryCount >= 1,
    [event, eventDate, primaryCount],
  );

  const cycleSki = ski => {
    setSkiPicks(prev => {
      const next = {...prev};
      const cur = next[ski.id];
      if (!cur) {
        // off → primary
        next[ski.id] = {role: 'primary', notes: ''};
      } else if (cur.role === 'primary') {
        // primary → backup
        next[ski.id] = {...cur, role: 'backup'};
      } else {
        // backup → off
        delete next[ski.id];
      }
      return next;
    });
  };

  const updateSkiNotes = (skiId, notes) => {
    setSkiPicks(prev => {
      if (!prev[skiId]) return prev;
      return {...prev, [skiId]: {...prev[skiId], notes}};
    });
  };

  const handleSend = async () => {
    setError('');
    if (!coachUid) {
      setError('Sign in to send an advisory.');
      return;
    }
    if (!isValid) {
      if (!event.trim()) {
        setError('Event name is required.');
      } else if (!isValidISODate(eventDate)) {
        setError('Event date needs to be YYYY-MM-DD.');
      } else {
        setError('Pick at least one primary ski.');
      }
      return;
    }
    setSubmitting(true);
    try {
      const skiRecommendations = Object.entries(skiPicks).map(
        ([skiId, p]) => ({
          skiId,
          role: p.role,
          notes: p.notes,
        }),
      );
      const conditions = {
        snowType: snowType.toLowerCase() || undefined,
        snowTemperature: snowTemp,
        airTemperature: airTemp,
        humidity,
        newSnow,
        notes: conditionsNotes,
      };
      await sendAdvisory({
        fromUid: coachUid,
        toUid: athleteUid,
        event: event.trim(),
        eventDate,
        conditions,
        skiRecommendations,
        body: body.trim() || undefined,
      });
      Toast.show({
        type: 'success',
        text1: 'Advisory sent',
        text2: `${athleteName} will see it in their inbox.`,
        position: 'top',
        visibilityTime: 2400,
      });
      navigation.goBack();
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
        title="Race-day plan"
        subtitle={`For ${athleteName}`}
        left={
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
          </Pressable>
        }
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send advisory"
            disabled={!isValid || submitting}
            onPress={handleSend}
            hitSlop={8}
            style={({pressed}) => [
              styles.headerSendBtn,
              (!isValid || submitting) && {opacity: 0.4},
              pressed && {opacity: 0.6},
            ]}>
            <Text style={styles.headerSendText}>Send</Text>
          </Pressable>
        }
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled">

          <SectionHeader title="Event" />
          <Input
            label="Event name"
            icon="trophy-outline"
            placeholder="Birkebeineren, classic 54km…"
            value={event}
            onChangeText={setEvent}
            autoCapitalize="words"
          />
          <View style={styles.fieldSpacer} />
          <Input
            label="Date (YYYY-MM-DD)"
            icon="calendar-outline"
            value={eventDate}
            onChangeText={setEventDate}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <SectionHeader title="Conditions" />
          <Text style={styles.miniLabel}>Snow type</Text>
          <View style={styles.chipRow}>
            {SNOW_TYPES.map(opt => {
              const selected = snowType.toLowerCase() === opt.toLowerCase();
              return (
                <View key={opt} style={styles.chipWrap}>
                  <Pill
                    variant={selected ? 'solid' : 'outline'}
                    color="red"
                    onPress={() => setSnowType(selected ? '' : opt)}>
                    {opt}
                  </Pill>
                </View>
              );
            })}
          </View>
          <View style={styles.fieldSpacer} />
          <View style={styles.row2}>
            <View style={styles.row2Cell}>
              <Input
                label="Snow temp"
                icon="thermometer-outline"
                value={snowTemp}
                onChangeText={setSnowTemp}
                keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
                suffix="°C"
              />
            </View>
            <View style={styles.row2Spacer} />
            <View style={styles.row2Cell}>
              <Input
                label="Air temp"
                icon="cloud-outline"
                value={airTemp}
                onChangeText={setAirTemp}
                keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
                suffix="°C"
              />
            </View>
          </View>
          <View style={styles.fieldSpacer} />
          <View style={styles.row2}>
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
            <View style={styles.row2Spacer} />
            <View style={styles.row2Cell}>
              <View style={styles.toggleWrap}>
                <Text style={styles.toggleLabel}>New snow</Text>
                <Switch
                  value={newSnow}
                  onValueChange={setNewSnow}
                  trackColor={{true: colors.red, false: colors.border}}
                  accessibilityLabel="New snow toggle"
                />
              </View>
            </View>
          </View>
          <View style={styles.fieldSpacer} />
          <Input
            label="Conditions notes (optional)"
            icon="create-outline"
            placeholder="Track was groomed last night, fresh corduroy."
            value={conditionsNotes}
            onChangeText={setConditionsNotes}
            multiline
          />

          <SectionHeader title="Ski plan" />
          {loadingSkis ? (
            <Text style={styles.note}>Loading {athleteName}'s fleet…</Text>
          ) : athleteSkis.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>
                {athleteName} hasn't added any skis yet
              </Text>
              <Text style={styles.emptyBody}>
                Ask them to add a ski to their fleet before sending an
                advisory — recommendations need at least one ski.
              </Text>
            </Card>
          ) : (
            <View>
              <Text style={styles.miniLabel}>
                Tap to cycle: off → Primary → Backup → off
              </Text>
              {athleteSkis.map(ski => {
                const pick = skiPicks[ski.id];
                return (
                  <SkiPickerRow
                    key={ski.id}
                    ski={ski}
                    pick={pick}
                    onPress={() => cycleSki(ski)}
                    onChangeNotes={notes => updateSkiNotes(ski.id, notes)}
                  />
                );
              })}
              {primaryCount === 0 && (
                <Text style={styles.warn}>
                  Pick at least one primary ski.
                </Text>
              )}
            </View>
          )}

          <SectionHeader title="Note (optional)" />
          <Input
            label="Anything else?"
            icon="chatbubble-outline"
            placeholder="If the temperature drops below -10, lean cold."
            value={body}
            onChangeText={setBody}
            multiline
          />

          {!!error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.fieldSpacer} />
          <Button
            variant="primary"
            size="lg"
            fullWidth
            icon="paper-plane-outline"
            loading={submitting}
            disabled={!isValid}
            onPress={handleSend}>
            Send advisory
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const SkiPickerRow = ({ski, pick, onPress, onChangeNotes}) => {
  const role = pick?.role;
  const accentColor =
    role === 'primary'
      ? colors.red
      : role === 'backup'
        ? colors.amber || '#F59E0B'
        : colors.border;
  return (
    <Card
      style={[styles.skiPickerCard, {borderColor: accentColor}]}
      padding={spacing.md}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Toggle role for ${ski.name}`}
        style={styles.skiPickerRow}>
        <View style={styles.skiPickerMeta}>
          <Text style={styles.skiPickerName} numberOfLines={1}>
            {ski.name || 'Unnamed ski'}
          </Text>
          <View style={styles.pillRow}>
            {!!ski.technique && (
              <View style={styles.pillWrap}>
                <Pill variant="ghost" color="neutral">
                  {ski.technique}
                </Pill>
              </View>
            )}
            {!!ski.type && (
              <View style={styles.pillWrap}>
                <Pill variant="ghost" color="neutral">
                  {ski.type}
                </Pill>
              </View>
            )}
          </View>
        </View>
        <View
          style={[
            styles.rolePill,
            {borderColor: accentColor, backgroundColor: role ? accentColor : 'transparent'},
          ]}>
          <Text
            style={[
              styles.rolePillText,
              {color: role ? colors.bg : colors.textTertiary},
            ]}>
            {role === 'primary'
              ? 'Primary'
              : role === 'backup'
                ? 'Backup'
                : 'Off'}
          </Text>
        </View>
      </Pressable>
      {!!role && (
        <>
          <View style={styles.skiNoteSpacer} />
          <Input
            label="Notes for this ski"
            icon="create-outline"
            value={pick.notes}
            onChangeText={onChangeNotes}
            multiline
            placeholder={
              role === 'primary'
                ? "Why this is the call"
                : "When to swap to this one"
            }
          />
        </>
      )}
    </Card>
  );
};

function isValidISODate(s) {
  if (typeof s !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s);
  return !Number.isNaN(d.getTime());
}

function defaultUpcomingDate() {
  // Default the date field to one week out — convenient pre-fill for
  // the coach who's planning ahead.
  const d = new Date();
  d.setDate(d.getDate() + 7);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.bg},
  flex: {flex: 1},
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  headerSendBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  headerSendText: {
    ...typography.headingMd,
    color: colors.red,
  },
  miniLabel: {
    ...typography.caption,
    color: colors.textTertiary,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.xs,
  },
  chipWrap: {
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  fieldSpacer: {height: spacing.lg},
  row2: {flexDirection: 'row'},
  row2Cell: {flex: 1},
  row2Spacer: {width: spacing.md},
  toggleWrap: {
    height: 52,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  toggleLabel: {...typography.body, color: colors.textPrimary},
  note: {
    ...typography.body,
    color: colors.textSecondary,
    paddingHorizontal: spacing.xs,
  },
  emptyCard: {alignItems: 'flex-start'},
  emptyTitle: {
    ...typography.headingMd,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  emptyBody: {
    ...typography.bodySm,
    color: colors.textSecondary,
  },
  skiPickerCard: {
    marginBottom: spacing.sm,
    borderWidth: 1.5,
  },
  skiPickerRow: {flexDirection: 'row', alignItems: 'center'},
  skiPickerMeta: {flex: 1, marginRight: spacing.md},
  skiPickerName: {...typography.headingMd, color: colors.textPrimary},
  pillRow: {flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.xs},
  pillWrap: {marginRight: spacing.xs, marginBottom: spacing.xs},
  rolePill: {
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderWidth: 1,
  },
  rolePillText: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  skiNoteSpacer: {height: spacing.md},
  warn: {
    ...typography.bodySm,
    color: colors.red,
    marginTop: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  error: {
    ...typography.body,
    color: colors.red,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});

export default ComposeAdvisoryScreen;
