import React, {useEffect, useState, useMemo} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';

import {useAuth} from '../context/AuthContext';
import useSkis from '../hooks/useSkis';
import {subscribeAllWaxLogs} from '../services/waxLogService';
import {Header, Card, ListItem, EmptyState, TabBar} from '../components/ui';
import {colors, spacing} from '../theme';

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

const waxLogSubtitle = log => {
  const dateStr = formatDate(log.date);
  const rel = relativeDate(log.date);
  const datePart = rel && dateStr ? `${dateStr} · ${rel}` : dateStr || rel || '';
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
  return datePart ? `${datePart} · ${parts.join(' · ')}` : parts.join(' · ');
};

const Spacer = () => <View style={styles.spacer} />;

const WaxHistoryScreen = () => {
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
    return subscribeAllWaxLogs(uid, list => {
      setLogs(list);
      setLoading(false);
    });
  }, [uid]);

  const renderRow = ({item}) => {
    const skiName = skiNameById.get(item.skiId) || 'Unknown ski';
    return (
      <Card padding={0} style={styles.rowCard}>
        <ListItem
          leading={
            <View
              style={[
                styles.colorDot,
                {backgroundColor: item.kickWax ? colors.warning : colors.red},
              ]}
            />
          }
          title={skiName}
          subtitle={waxLogSubtitle(item)}
          onPress={() => navigation.navigate('SkiInfo', {skiId: item.skiId})}
          accessibilityLabel={`Open ${skiName}`}
        />
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <Header title="Wax history" />
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
              icon="color-fill-outline"
              title="No wax logs yet"
              description="Every wax you log on a ski shows up here. Open a ski and add a wax to start your history."
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
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});

export default WaxHistoryScreen;
