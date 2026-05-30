import React, {useEffect, useState, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';

import {useAuth} from '../context/AuthContext';
import useSkis from '../hooks/useSkis';
import {subscribeAllTestLogs} from '../services/testLogService';
import {Header, Card, ListItem, EmptyState, TabBar} from '../components/ui';
import {colors, spacing, typography} from '../theme';

const formatDate = raw => {
  if (!raw) {
    return '';
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
    return '';
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

const ratingColor = score => {
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

const RatingBadge = ({value}) => (
  <View style={[styles.ratingBadge, {backgroundColor: ratingColor(value)}]}>
    <Text style={styles.ratingBadgeText}>
      {value === null || value === undefined || value === '' ? '-' : value}
    </Text>
  </View>
);

const testLogSubtitle = log => {
  const dateStr = formatDate(log.date);
  const rel = relativeDate(log.date);
  const datePart = rel && dateStr ? `${dateStr} · ${rel}` : dateStr || rel || '';
  const cond = [];
  if (log.snowType) {
    cond.push(log.snowType);
  }
  if (log.surface) {
    cond.push(log.surface);
  }
  if (log.temperature !== null && log.temperature !== undefined) {
    cond.push(`${log.temperature}°C`);
  }
  if (log.humidity !== null && log.humidity !== undefined) {
    cond.push(`${log.humidity}% humidity`);
  }
  const condPart = cond.length ? cond.join(', ') : 'No conditions recorded';
  return datePart ? `${datePart} · ${condPart}` : condPart;
};

const Spacer = () => <View style={styles.spacer} />;

const TestHistoryScreen = () => {
  const navigation = useNavigation();
  const {user} = useAuth();
  const uid = user?.uid;
  const {skis} = useSkis(uid);

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const skiNameById = useMemo(() => {
    const m = new Map();
    skis.forEach(s => {
      const label =
        (s.name || '').trim() ||
        [s.brand, s.model].filter(Boolean).join(' ').trim() ||
        'Unnamed ski';
      m.set(s.id, label);
    });
    return m;
  }, [skis]);

  useEffect(() => {
    if (!uid) {
      setLogs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    return subscribeAllTestLogs(uid, list => {
      setLogs(list);
      setLoading(false);
    });
  }, [uid]);

  const renderRow = ({item}) => {
    const skiName = skiNameById.get(item.skiId) || 'Unknown ski';
    return (
      <Card padding={0} style={styles.rowCard}>
        <ListItem
          leading={<RatingBadge value={item.glideRating} />}
          title={skiName}
          subtitle={testLogSubtitle(item)}
          onPress={() => navigation.navigate('SkiInfo', {skiId: item.skiId})}
          accessibilityLabel={`Open ${skiName}`}
        />
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <Header title="Test history" />
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.red} />
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.scroll}
          data={logs}
          keyExtractor={item => item.id}
          renderItem={renderRow}
          ItemSeparatorComponent={Spacer}
          ListEmptyComponent={
            <EmptyState
              icon="thermometer-outline"
              title="No tests yet"
              description="Every ski test you log shows up here. Open a ski and log a test to start tracking what works."
            />
          }
        />
      )}
      <TabBar />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.bg},
  loadingWrap: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing['4xl'],
    flexGrow: 1,
  },
  rowCard: {},
  spacer: {height: spacing.md},
  ratingBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingBadgeText: {
    ...typography.bodySm,
    color: colors.textPrimary,
    fontWeight: '700',
  },
});

export default TestHistoryScreen;
