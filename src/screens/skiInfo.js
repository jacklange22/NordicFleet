import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {useAuth} from '../context/AuthContext';
import {subscribeSki} from '../services/skiService';
import {subscribeWaxLogsForSki} from '../services/waxLogService';
import {subscribeTestLogsForSki} from '../services/testLogService';
import {
  Header,
  Card,
  Pill,
  StatCard,
  SectionHeader,
  ListItem,
  TabBar,
} from '../components/ui';
import {colors, radius, spacing, typography} from '../theme';

const formatDate = raw => {
  if (!raw) {
    return '—';
  }
  let d = null;
  if (typeof raw.toDate === 'function') {
    d = raw.toDate();
  } else if (raw instanceof Date) {
    d = raw;
  } else if (typeof raw === 'string' || typeof raw === 'number') {
    d = new Date(raw);
    if (isNaN(d.getTime())) {
      d = null;
    }
  }
  if (!d) {
    return '—';
  }
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const relativeDate = raw => {
  if (!raw) {
    return null;
  }
  let d = null;
  if (typeof raw.toDate === 'function') {
    d = raw.toDate();
  } else if (raw instanceof Date) {
    d = raw;
  } else if (typeof raw === 'string' || typeof raw === 'number') {
    const dd = new Date(raw);
    if (!isNaN(dd.getTime())) {
      d = dd;
    }
  }
  if (!d) {
    return null;
  }
  const diff = Math.max(0, Date.now() - d.getTime());
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  if (days === 0) {
    return 'today';
  }
  if (days === 1) {
    return 'yesterday';
  }
  if (days < 30) {
    return `${days}d ago`;
  }
  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months}mo ago`;
  }
  return `${Math.floor(months / 12)}y ago`;
};

const ratingDot = score => {
  // 1-10 mapped to dim → bright red
  if (score === null || score === undefined) {
    return colors.borderStrong;
  }
  const n = Number(score);
  if (!Number.isFinite(n)) {
    return colors.borderStrong;
  }
  if (n >= 8) {
    return colors.red;
  }
  if (n >= 5) {
    return '#B71C1C';
  }
  return colors.redDim;
};

const RatingBadge = ({value}) => {
  const bg = ratingDot(value);
  return (
    <View style={[styles.ratingBadge, {backgroundColor: bg}]}>
      <Text style={styles.ratingBadgeText}>
        {value === null || value === undefined || value === '' ? '—' : value}
      </Text>
    </View>
  );
};

const SkiInfo = ({route, navigation}) => {
  const {user} = useAuth();
  const skiId = route?.params?.skiId;
  const ownerUid = route?.params?.ownerUid;
  const uid = ownerUid || user?.uid;
  const isCoachView = !!ownerUid && ownerUid !== user?.uid;

  const [ski, setSki] = useState(null);
  const [waxLogs, setWaxLogs] = useState([]);
  const [testLogs, setTestLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid || !skiId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubSki = subscribeSki(uid, skiId, data => {
      setSki(data);
      setLoading(false);
    });
    const unsubWax = subscribeWaxLogsForSki(uid, skiId, logs =>
      setWaxLogs(logs.slice(0, 10)),
    );
    const unsubTest = subscribeTestLogsForSki(uid, skiId, logs =>
      setTestLogs(logs.slice(0, 10)),
    );
    return () => {
      unsubSki();
      unsubWax();
      unsubTest();
    };
  }, [uid, skiId]);

  const techLower = (ski?.technique || '').toLowerCase();
  const accentColor = techLower === 'skate' ? colors.redDim : colors.red;

  const waxLogSubtitle = log => {
    const parts = [];
    if (log.glideWaxes && log.glideWaxes.length) {
      parts.push(log.glideWaxes.filter(Boolean).join(', '));
    }
    if (log.kickWax) {
      parts.push(`Kick: ${log.kickWax}`);
    }
    if (log.binder) {
      parts.push(`Binder: ${log.binder}`);
    }
    if (parts.length === 0) {
      parts.push('No wax recorded');
    }
    const rel = relativeDate(log.date);
    return rel ? `${parts.join(' · ')} · ${rel}` : parts.join(' · ');
  };

  const testLogTitle = log => {
    const bits = [];
    if (log.snowType) {
      bits.push(log.snowType);
    }
    if (log.surface) {
      bits.push(log.surface);
    }
    return bits.length ? bits.join(', ') : 'Conditions';
  };

  const testLogSubtitle = log => {
    const bits = [];
    if (log.temperature !== null && log.temperature !== undefined) {
      bits.push(`${log.temperature}°C`);
    }
    if (log.humidity !== null && log.humidity !== undefined) {
      bits.push(`${log.humidity}% humidity`);
    }
    const rel = relativeDate(log.date);
    if (rel) {
      bits.push(rel);
    }
    return bits.length ? bits.join(' · ') : formatDate(log.date);
  };

  // Loading state.
  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar barStyle="light-content" />
        <Header title="Ski" />
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.red} />
        </View>
        {!isCoachView && <TabBar role="athlete" />}
      </SafeAreaView>
    );
  }

  // Not found.
  if (!ski) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar barStyle="light-content" />
        <Header title="Ski not found" />
        <View style={styles.notFoundWrap}>
          <Text style={styles.notFound}>Ski not found</Text>
        </View>
        {!isCoachView && <TabBar role="athlete" />}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <Header title={ski.name || 'Ski'} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>
        {/* Hero card */}
        <Card padding={0} style={styles.hero}>
          <View style={[styles.heroAccent, {backgroundColor: accentColor}]} />
          <View style={styles.heroBody}>
            <Text style={styles.heroName} numberOfLines={2}>
              {ski.name}
            </Text>
            <View style={styles.heroPillRow}>
              {!!ski.technique && (
                <View style={styles.heroPillWrap}>
                  <Pill variant="outline" color="red">
                    {ski.technique}
                  </Pill>
                </View>
              )}
              {!!ski.type && (
                <View style={styles.heroPillWrap}>
                  <Pill variant="outline" color="red">
                    {ski.type}
                  </Pill>
                </View>
              )}
              {!!ski.brand && (
                <View style={styles.heroPillWrap}>
                  <Pill variant="ghost" color="neutral">
                    {ski.brand}
                  </Pill>
                </View>
              )}
            </View>
            <View style={styles.miniStatRow}>
              <View style={styles.miniStat}>
                <Text style={styles.miniStatLabel}>Flex</Text>
                <Text style={styles.miniStatValue}>{ski.flex ?? '—'}</Text>
              </View>
              <View style={styles.miniStat}>
                <Text style={styles.miniStatLabel}>Length</Text>
                <Text style={styles.miniStatValue}>
                  {ski.length ? `${ski.length}cm` : '—'}
                </Text>
              </View>
              <View style={styles.miniStat}>
                <Text style={styles.miniStatLabel}>Grind</Text>
                <Text style={styles.miniStatValue} numberOfLines={1}>
                  {ski.grind || '—'}
                </Text>
              </View>
            </View>
            {!!(ski.base || ski.build || ski.model) && (
              <View style={styles.metaRow}>
                {!!ski.model && <Text style={styles.metaText}>{ski.model}</Text>}
                {!!ski.base && (
                  <Text style={styles.metaText}>Base: {ski.base}</Text>
                )}
                {!!ski.build && (
                  <Text style={styles.metaText}>Build: {ski.build}</Text>
                )}
              </View>
            )}
          </View>
        </Card>

        {/* Stat row */}
        <View style={styles.statRow}>
          <View style={styles.statCell}>
            <StatCard
              compact
              value={waxLogs.length}
              label="Times waxed"
            />
          </View>
          <View style={styles.statCellSpacer} />
          <View style={styles.statCell}>
            <StatCard
              compact
              value={testLogs.length}
              label="Tests logged"
            />
          </View>
        </View>

        {/* Wax history */}
        <SectionHeader title="Wax history" />
        {waxLogs.length === 0 ? (
          <View style={styles.emptyHistory}>
            <Text style={styles.emptyHistoryText}>No wax logs yet</Text>
          </View>
        ) : (
          <Card padding={0} style={styles.historyCard}>
            {waxLogs.map((log, i) => (
              <View key={log.id} style={styles.historyRowWrap}>
                <ListItem
                  leading={
                    <View
                      style={[
                        styles.colorDot,
                        {backgroundColor: log.kickWax ? colors.warning : colors.red},
                      ]}
                    />
                  }
                  title={formatDate(log.date)}
                  subtitle={waxLogSubtitle(log)}
                  showDivider={i < waxLogs.length - 1}
                />
              </View>
            ))}
          </Card>
        )}

        {/* Test history */}
        <SectionHeader title="Test history" />
        {testLogs.length === 0 ? (
          <View style={styles.emptyHistory}>
            <Text style={styles.emptyHistoryText}>No tests yet</Text>
          </View>
        ) : (
          <Card padding={0} style={styles.historyCard}>
            {testLogs.map((log, i) => (
              <View key={log.id} style={styles.historyRowWrap}>
                <ListItem
                  leading={<RatingBadge value={log.glideRating} />}
                  title={testLogTitle(log)}
                  subtitle={testLogSubtitle(log)}
                  showDivider={i < testLogs.length - 1}
                />
              </View>
            ))}
          </Card>
        )}

        {/* Notes */}
        <SectionHeader title="Notes" />
        <Card>
          <Text style={styles.notes}>
            {ski.notes ? ski.notes : 'No notes yet'}
          </Text>
        </Card>
      </ScrollView>
      {!isCoachView && <TabBar role="athlete" />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.bg},
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  notFound: {
    ...typography.displayMd,
    color: colors.textSecondary,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing['4xl'],
  },

  hero: {
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  heroAccent: {
    height: 4,
    width: '100%',
  },
  heroBody: {
    padding: spacing.lg,
  },
  heroName: {
    ...typography.displayLg,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  heroPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.lg,
  },
  heroPillWrap: {
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  miniStatRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  miniStat: {
    flex: 1,
  },
  miniStatLabel: {
    ...typography.caption,
    color: colors.textTertiary,
    marginBottom: spacing.xs,
  },
  miniStatValue: {
    ...typography.headingMd,
    color: colors.textPrimary,
  },
  metaRow: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  metaText: {
    ...typography.bodySm,
    color: colors.textSecondary,
    marginBottom: 2,
  },

  statRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  statCell: {flex: 1},
  statCellSpacer: {width: spacing.md},

  historyCard: {
    paddingHorizontal: spacing.lg,
  },
  historyRowWrap: {},
  emptyHistory: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  emptyHistoryText: {
    ...typography.body,
    color: colors.textTertiary,
    fontStyle: 'italic',
  },

  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  ratingBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingBadgeText: {
    ...typography.bodySm,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  notes: {
    ...typography.body,
    color: colors.textPrimary,
    lineHeight: 22,
  },
});

export default SkiInfo;
