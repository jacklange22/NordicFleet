// WaxTestRunner — arrange the bracket, run it head-to-head, and read
// the result. One screen, three phases keyed off `status`:
//
//   setup     → arranger: reorder seeds (up/down), then Start.
//   running   → runner: pick a winner for each live matchup; record
//               per-combination performance numbers.
//   complete  → results: winner + standings + full bracket.
//
// All bracket math is pure (@nordicfleet/core); this screen only renders
// and persists (updateWaxTest merges status + bracket + combinations).

import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Pressable,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  advanceWinner,
  rearrangeBracket,
  bracketProgress,
} from '@nordicfleet/core';

import {useAuth} from '../context/AuthContext';
import {
  getWaxTest,
  updateWaxTest,
  deleteWaxTest,
} from '../services/waxTestService';
import {subscribeAthletesForCoach} from '../services/userService';
import {Header, Card, Button, Input, SectionHeader} from '../components/ui';
import {colors, radius, spacing, typography} from '../theme';

// Turn a finished test + its winning combination into seed values for
// the coach's race-day advisory composer. The advisory is the coaching
// surface; this is the bridge from "what won" to "tell the athlete".
function buildAdvisoryPrefill(test, winner) {
  const c = test.conditions || {};
  const layerLines = (winner?.layers || [])
    .map(l => `  • ${l.category}: ${l.waxName}`)
    .join('\n');
  const bodyParts = [
    `Wax Truck winner: ${winner?.label || 'fastest combination'}`,
    layerLines ? `Layers:\n${layerLines}` : '',
    `From test "${test.name}".`,
  ].filter(Boolean);
  const numOr = v => (v == null || v === '' ? '' : String(v));
  return {
    snowType: c.snowType || '',
    snowTemp: numOr(c.temperature),
    humidity: numOr(c.humidity),
    conditionsNotes: c.locationLabel ? `Tested at ${c.locationLabel}.` : '',
    body: bodyParts.join('\n\n'),
  };
}

const WaxTestRunnerScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {user} = useAuth();
  const uid = user?.uid;
  const testId = route.params?.testId;

  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [athletes, setAthletes] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const t = await getWaxTest(uid, testId);
        if (!cancelled) {
          if (!t) {
            setError('This test no longer exists.');
          } else {
            setTest(t);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(String(err.message || err));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uid, testId]);

  // Linked athletes — only needed to offer "send winner as advisory".
  useEffect(() => {
    if (!uid) {
      return undefined;
    }
    return subscribeAthletesForCoach(uid, setAthletes);
  }, [uid]);

  const comboById = useMemo(() => {
    const map = {};
    (test?.combinations || []).forEach(c => {
      map[c.id] = c;
    });
    return map;
  }, [test]);

  const labelFor = useCallback(
    id => (id ? comboById[id]?.label || 'Unknown' : null),
    [comboById],
  );

  const persist = useCallback(
    async patch => {
      setSaving(true);
      try {
        await updateWaxTest(uid, testId, patch);
      } catch (err) {
        Toast.show({
          type: 'error',
          text1: "Couldn't save",
          text2: String(err.message || err),
          position: 'top',
        });
      } finally {
        setSaving(false);
      }
    },
    [uid, testId],
  );

  // ── Arranger (setup) ──────────────────────────────────────────────
  const moveCombo = (from, to) => {
    if (!test || to < 0 || to >= test.combinations.length) {
      return;
    }
    const {combinations, bracket} = rearrangeBracket(
      test.combinations,
      from,
      to,
    );
    setTest(prev => ({...prev, combinations, bracket}));
    persist({combinations, bracket});
  };

  const startTest = () => {
    setTest(prev => ({...prev, status: 'running'}));
    persist({status: 'running'});
  };

  // ── Runner (running) ──────────────────────────────────────────────
  const pickWinner = (matchId, winnerId) => {
    const bracket = advanceWinner(test.bracket, matchId, winnerId);
    const status = bracket.winnerId ? 'complete' : 'running';
    setTest(prev => ({...prev, bracket, status}));
    persist({bracket, status});
    if (bracket.winnerId) {
      Toast.show({
        type: 'success',
        text1: 'We have a winner',
        text2: labelFor(bracket.winnerId),
        position: 'top',
        visibilityTime: 2600,
      });
    }
  };

  // ── Performance numbers (running/complete) ────────────────────────
  const setPerf = (comboId, value) => {
    setTest(prev => ({
      ...prev,
      combinations: prev.combinations.map(c =>
        c.id === comboId ? {...c, performanceNumber: value} : c,
      ),
    }));
  };

  const savePerf = () => {
    const combinations = test.combinations.map(c => ({
      ...c,
      performanceNumber:
        c.performanceNumber === '' || c.performanceNumber == null
          ? null
          : Number(c.performanceNumber),
    }));
    setTest(prev => ({...prev, combinations}));
    persist({combinations});
    Toast.show({
      type: 'success',
      text1: 'Numbers saved',
      position: 'top',
      visibilityTime: 1600,
    });
  };

  const sendToAthlete = athlete => {
    setPickerOpen(false);
    const winner = comboById[test.bracket.winnerId];
    navigation.navigate('ComposeAdvisory', {
      athleteUid: athlete.uid || athlete.id,
      athleteName: athlete.displayName || athlete.name || 'athlete',
      prefill: buildAdvisoryPrefill(test, winner),
    });
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete this test?',
      'This permanently removes the test and its bracket. This cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteWaxTest(uid, testId);
              navigation.goBack();
            } catch (err) {
              Toast.show({
                type: 'error',
                text1: "Couldn't delete",
                text2: String(err.message || err),
                position: 'top',
              });
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header title="Wax test" />
        <View style={styles.center}>
          <ActivityIndicator color={colors.waxtruck} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !test) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header title="Wax test" />
        <View style={styles.center}>
          <Text style={styles.errorBig}>{error || 'Test not found.'}</Text>
          <View style={styles.spacer} />
          <Button variant="secondary" onPress={() => navigation.goBack()}>
            Back
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const progress = bracketProgress(test.bracket);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <Header
        title={test.name}
        subtitle={
          test.status === 'setup'
            ? 'Arrange the bracket'
            : test.status === 'complete'
              ? 'Result'
              : `Round ${progress.currentRound + 1} of ${progress.totalRounds}`
        }
        right={
          saving ? (
            <ActivityIndicator color={colors.textTertiary} size="small" />
          ) : null
        }
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled">
        {test.status === 'setup' && (
          <Arranger
            combinations={test.combinations}
            onMove={moveCombo}
            onStart={startTest}
          />
        )}

        {test.status === 'running' && (
          <Runner
            bracket={test.bracket}
            labelFor={labelFor}
            progress={progress}
            onPick={pickWinner}
          />
        )}

        {test.status === 'complete' && (
          <Results
            test={test}
            labelFor={labelFor}
            comboById={comboById}
            athleteCount={athletes.length}
            onSendAdvisory={() => setPickerOpen(true)}
          />
        )}

        {/* Performance numbers — available once the test is running. */}
        {test.status !== 'setup' && (
          <>
            <SectionHeader title="Performance numbers" />
            <Text style={styles.help}>
              Optional objective readings (glide-out distance, timing gate,
              etc.) recorded per combination.
            </Text>
            {test.combinations.map(c => (
              <View key={c.id} style={styles.perfRow}>
                <Text style={styles.perfLabel} numberOfLines={1}>
                  {c.label}
                </Text>
                <View style={styles.perfInput}>
                  <Input
                    label=""
                    value={c.performanceNumber == null ? '' : String(c.performanceNumber)}
                    onChangeText={v => setPerf(c.id, v)}
                    keyboardType="numbers-and-punctuation"
                    placeholder="—"
                  />
                </View>
              </View>
            ))}
            <Button
              variant="secondary"
              size="md"
              icon="save-outline"
              onPress={savePerf}
              style={styles.saveBtn}>
              Save numbers
            </Button>
          </>
        )}

        {/* Full bracket overview — read-only. */}
        <SectionHeader title="Bracket" />
        <BracketOverview bracket={test.bracket} labelFor={labelFor} />

        <View style={styles.spacer} />
        <Button
          variant="ghost"
          size="md"
          icon="trash-outline"
          onPress={confirmDelete}>
          Delete test
        </Button>
      </ScrollView>

      <AthletePicker
        visible={pickerOpen}
        athletes={athletes}
        onPick={sendToAthlete}
        onClose={() => setPickerOpen(false)}
      />
    </SafeAreaView>
  );
};

// Reorder seeds before the bracket runs.
const Arranger = ({combinations, onMove, onStart}) => (
  <>
    <Text style={styles.help}>
      Drag order sets the seeding. Top seeds get any byes. Reorder, then
      start the test.
    </Text>
    {combinations.map((c, i) => (
      <Card key={c.id} style={styles.seedCard}>
        <Text style={styles.seedNum}>{i + 1}</Text>
        <Text style={styles.seedLabel} numberOfLines={1}>
          {c.label}
        </Text>
        <View style={styles.seedArrows}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Move ${c.label} up`}
            disabled={i === 0}
            onPress={() => onMove(i, i - 1)}
            hitSlop={6}
            style={({pressed}) => [
              styles.arrowBtn,
              i === 0 && {opacity: 0.3},
              pressed && {opacity: 0.6},
            ]}>
            <Ionicons name="chevron-up" size={20} color={colors.textPrimary} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Move ${c.label} down`}
            disabled={i === combinations.length - 1}
            onPress={() => onMove(i, i + 1)}
            hitSlop={6}
            style={({pressed}) => [
              styles.arrowBtn,
              i === combinations.length - 1 && {opacity: 0.3},
              pressed && {opacity: 0.6},
            ]}>
            <Ionicons name="chevron-down" size={20} color={colors.textPrimary} />
          </Pressable>
        </View>
      </Card>
    ))}
    <View style={styles.spacer} />
    <Button
      variant="primary"
      size="lg"
      fullWidth
      icon="play"
      onPress={onStart}>
      Start test
    </Button>
  </>
);

// Pick winners for every live matchup in the current round.
const Runner = ({bracket, labelFor, progress, onPick}) => {
  const liveMatches = [];
  bracket.rounds.forEach(round => {
    round.forEach(m => {
      if (!m.winnerId && m.combinationIdA && m.combinationIdB) {
        liveMatches.push(m);
      }
    });
  });

  if (liveMatches.length === 0) {
    return (
      <Card style={styles.infoCard}>
        <Text style={styles.infoText}>
          Waiting on earlier rounds — no live matchups right now.
        </Text>
      </Card>
    );
  }

  return (
    <>
      <Text style={styles.help}>
        Tap the faster wax in each matchup. {progress.decided} of{' '}
        {progress.total} decided.
      </Text>
      {liveMatches.map(m => (
        <Card key={m.matchId} style={styles.matchCard}>
          <CompetitorButton
            label={labelFor(m.combinationIdA)}
            onPress={() => onPick(m.matchId, m.combinationIdA)}
          />
          <Text style={styles.vs}>vs</Text>
          <CompetitorButton
            label={labelFor(m.combinationIdB)}
            onPress={() => onPick(m.matchId, m.combinationIdB)}
          />
        </Card>
      ))}
    </>
  );
};

const CompetitorButton = ({label, onPress}) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={`${label} wins`}
    onPress={onPress}
    style={({pressed}) => [styles.competitor, pressed && styles.competitorPressed]}>
    <Text style={styles.competitorText} numberOfLines={2}>
      {label}
    </Text>
    <Ionicons name="trophy-outline" size={18} color={colors.waxtruck} />
  </Pressable>
);

// Winner + standings once complete.
const Results = ({test, labelFor, comboById, athleteCount, onSendAdvisory}) => {
  const winnerId = test.bracket.winnerId;
  const ranked = [...test.combinations].sort((a, b) => {
    // Put the bracket winner first, then by performance number (desc),
    // then leave input order.
    if (a.id === winnerId) {
      return -1;
    }
    if (b.id === winnerId) {
      return 1;
    }
    const an = a.performanceNumber == null ? -Infinity : a.performanceNumber;
    const bn = b.performanceNumber == null ? -Infinity : b.performanceNumber;
    return bn - an;
  });
  return (
    <>
      <Card style={styles.winnerCard}>
        <Ionicons name="trophy" size={40} color={colors.waxtruck} />
        <Text style={styles.winnerKicker}>Fastest wax</Text>
        <Text style={styles.winnerName}>{labelFor(winnerId)}</Text>
        {comboById[winnerId]?.performanceNumber != null && (
          <Text style={styles.winnerPerf}>
            Performance: {comboById[winnerId].performanceNumber}
          </Text>
        )}
      </Card>
      <View style={styles.sendWrap}>
        <Button
          variant="primary"
          size="md"
          icon="paper-plane-outline"
          disabled={athleteCount === 0}
          onPress={onSendAdvisory}>
          Send winner as advisory
        </Button>
        {athleteCount === 0 && (
          <Text style={styles.sendHint}>
            Link an athlete in Coaching mode to send this as a race-day
            advisory.
          </Text>
        )}
      </View>
      <SectionHeader title="Standings" />
      {ranked.map((c, i) => (
        <View key={c.id} style={styles.standRow}>
          <Text style={styles.standRank}>{i + 1}</Text>
          <Text style={styles.standLabel} numberOfLines={1}>
            {c.label}
          </Text>
          {c.performanceNumber != null && (
            <Text style={styles.standPerf}>{c.performanceNumber}</Text>
          )}
          {c.id === winnerId && (
            <Ionicons name="trophy" size={16} color={colors.waxtruck} />
          )}
        </View>
      ))}
    </>
  );
};

// Bottom-sheet athlete picker for routing a winner into an advisory.
const AthletePicker = ({visible, athletes, onPick, onClose}) => (
  <Modal
    visible={visible}
    transparent
    animationType="slide"
    onRequestClose={onClose}>
    <View style={styles.backdrop}>
      <View style={styles.sheet}>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Send to…</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={onClose}
            hitSlop={8}>
            <Ionicons name="close" size={22} color={colors.textPrimary} />
          </Pressable>
        </View>
        <FlatList
          data={athletes}
          keyExtractor={a => a.uid || a.id}
          renderItem={({item}) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Send to ${item.displayName || item.name || 'athlete'}`}
              onPress={() => onPick(item)}
              style={({pressed}) => [styles.athleteRow, pressed && {opacity: 0.7}]}>
              <Ionicons name="person-circle-outline" size={28} color={colors.textTertiary} />
              <Text style={styles.athleteName} numberOfLines={1}>
                {item.displayName || item.name || item.email || 'Athlete'}
              </Text>
            </Pressable>
          )}
          ListEmptyComponent={
            <Text style={styles.athleteEmpty}>No linked athletes yet.</Text>
          }
        />
      </View>
    </View>
  </Modal>
);

const BracketOverview = ({bracket, labelFor}) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
    <View style={styles.bracketRow}>
      {bracket.rounds.map((round, ri) => (
        <View key={ri} style={styles.bracketCol}>
          <Text style={styles.roundLabel}>
            {ri === bracket.rounds.length - 1 ? 'Final' : `R${ri + 1}`}
          </Text>
          {round.map(m => (
            <View key={m.matchId} style={styles.miniMatch}>
              <Slot
                label={labelFor(m.combinationIdA)}
                won={m.winnerId && m.winnerId === m.combinationIdA}
              />
              <View style={styles.miniDivider} />
              <Slot
                label={labelFor(m.combinationIdB)}
                won={m.winnerId && m.winnerId === m.combinationIdB}
              />
            </View>
          ))}
        </View>
      ))}
    </View>
  </ScrollView>
);

const Slot = ({label, won}) => (
  <Text
    style={[styles.slotText, won && styles.slotWon]}
    numberOfLines={1}>
    {label || '—'}
  </Text>
);

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.bg},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl},
  scroll: {paddingHorizontal: spacing.lg, paddingBottom: spacing['4xl']},
  spacer: {height: spacing.lg},
  help: {
    ...typography.bodySm,
    color: colors.textSecondary,
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.md,
  },
  errorBig: {...typography.body, color: colors.red, textAlign: 'center'},

  // Arranger
  seedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  seedNum: {
    ...typography.headingMd,
    color: colors.waxtruck,
    width: 28,
  },
  seedLabel: {...typography.body, color: colors.textPrimary, flex: 1},
  seedArrows: {flexDirection: 'row'},
  arrowBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Runner
  matchCard: {marginBottom: spacing.md},
  competitor: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  competitorPressed: {
    borderColor: colors.waxtruck,
    backgroundColor: colors.waxtruckDim,
  },
  competitorText: {
    ...typography.headingMd,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.md,
  },
  vs: {
    ...typography.caption,
    color: colors.textTertiary,
    textAlign: 'center',
    marginVertical: spacing.sm,
  },
  infoCard: {marginBottom: spacing.md},
  infoText: {...typography.body, color: colors.textSecondary},

  // Performance numbers
  perfRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  perfLabel: {...typography.body, color: colors.textPrimary, flex: 1, marginRight: spacing.md},
  perfInput: {width: 120},
  saveBtn: {marginTop: spacing.sm, alignSelf: 'flex-start'},

  // Results
  winnerCard: {alignItems: 'center', paddingVertical: spacing.xl},
  winnerKicker: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: spacing.md,
  },
  winnerName: {
    ...typography.displayMd,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  winnerPerf: {
    ...typography.body,
    color: colors.waxtruck,
    marginTop: spacing.sm,
  },
  standRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  standRank: {...typography.headingMd, color: colors.textTertiary, width: 28},
  standLabel: {...typography.body, color: colors.textPrimary, flex: 1},
  standPerf: {
    ...typography.body,
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  sendWrap: {marginTop: spacing.lg, alignItems: 'flex-start'},
  sendHint: {
    ...typography.bodySm,
    color: colors.textTertiary,
    marginTop: spacing.sm,
  },

  // Athlete picker sheet
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
    paddingBottom: spacing['2xl'],
    maxHeight: '70%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sheetTitle: {...typography.displayMd, color: colors.textPrimary},
  athleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  athleteName: {
    ...typography.bodyLg,
    color: colors.textPrimary,
    marginLeft: spacing.md,
    flex: 1,
  },
  athleteEmpty: {
    ...typography.body,
    color: colors.textTertiary,
    textAlign: 'center',
    paddingVertical: spacing['2xl'],
  },

  // Bracket overview
  bracketRow: {flexDirection: 'row', paddingVertical: spacing.sm},
  bracketCol: {marginRight: spacing.lg, justifyContent: 'space-around'},
  roundLabel: {
    ...typography.caption,
    color: colors.textTertiary,
    marginBottom: spacing.sm,
  },
  miniMatch: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
    width: 140,
  },
  miniDivider: {height: 1, backgroundColor: colors.border, marginVertical: 4},
  slotText: {...typography.bodySm, color: colors.textSecondary},
  slotWon: {color: colors.waxtruck, fontWeight: '700'},
});

export default WaxTestRunnerScreen;
