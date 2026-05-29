// WaxTruck — the wax-testing home (coaching capability, wax-truck mode).
//
// Lists the coach's saved wax tests newest-first with a status pill and
// a quick progress line, plus a "New test" affordance. Tapping a test
// opens the runner/arranger. This is the landing screen for wax-truck
// mode (see ModeContext + TabBar).

import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {bracketProgress} from '@nordicfleet/core';

import {useAuth} from '../context/AuthContext';
import {subscribeWaxTests} from '../services/waxTestService';
import {Header, Card, Button, EmptyState, TabBar} from '../components/ui';
import {colors, radius, spacing, typography} from '../theme';

const STATUS_META = {
  setup: {label: 'Setup', color: colors.textTertiary},
  running: {label: 'Running', color: colors.waxtruck},
  complete: {label: 'Complete', color: colors.success},
};

const WaxTruckScreen = () => {
  const navigation = useNavigation();
  const {user} = useAuth();
  const uid = user?.uid;
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setTests([]);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    const unsub = subscribeWaxTests(uid, list => {
      setTests(list);
      setLoading(false);
    });
    return unsub;
  }, [uid]);

  const renderItem = ({item}) => {
    const meta = STATUS_META[item.status] || STATUS_META.setup;
    const progress =
      item.bracket && Array.isArray(item.bracket.rounds)
        ? bracketProgress(item.bracket)
        : null;
    const combos = Array.isArray(item.combinations)
      ? item.combinations.length
      : 0;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${item.name}`}
        onPress={() =>
          navigation.navigate('WaxTestRunner', {testId: item.id})
        }
        style={({pressed}) => [pressed && {opacity: 0.7}]}>
        <Card style={styles.testCard}>
          <View style={styles.testHeader}>
            <Text style={styles.testName} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={[styles.statusPill, {borderColor: meta.color}]}>
              <Text style={[styles.statusText, {color: meta.color}]}>
                {meta.label}
              </Text>
            </View>
          </View>
          <Text style={styles.testMeta}>
            {combos} combination{combos === 1 ? '' : 's'}
            {progress
              ? progress.complete
                ? ' · winner decided'
                : ` · round ${progress.currentRound + 1} of ${progress.totalRounds}`
              : ''}
          </Text>
          {!!item.conditions?.locationLabel && (
            <View style={styles.locationRow}>
              <Ionicons
                name="location-outline"
                size={14}
                color={colors.textTertiary}
              />
              <Text style={styles.locationText} numberOfLines={1}>
                {item.conditions.locationLabel}
              </Text>
            </View>
          )}
        </Card>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <Header
        title="Wax Truck"
        subtitle="Head-to-head testing"
        left={null}
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="New wax test"
            onPress={() => navigation.navigate('WaxTestSetup')}
            hitSlop={8}
            style={({pressed}) => [
              styles.newBtn,
              pressed && {opacity: 0.6},
            ]}>
            <Ionicons name="add" size={24} color={colors.waxtruck} />
          </Pressable>
        }
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.waxtruck} />
        </View>
      ) : tests.length === 0 ? (
        <EmptyState
          icon="git-network-outline"
          title="No tests yet"
          description="Run a head-to-head bracket to find the fastest wax for today's snow. Build your combinations, then let the bracket decide."
          cta={{
            label: 'New wax test',
            icon: 'add',
            onPress: () => navigation.navigate('WaxTestSetup'),
          }}
        />
      ) : (
        <FlatList
          data={tests}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListFooterComponent={
            <View style={styles.footer}>
              <Button
                variant="secondary"
                size="md"
                icon="add"
                onPress={() => navigation.navigate('WaxTestSetup')}>
                New wax test
              </Button>
            </View>
          }
        />
      )}

      <TabBar />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.bg},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing['2xl'],
  },
  newBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testCard: {marginBottom: spacing.md},
  testHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  testName: {
    ...typography.headingLg,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.md,
  },
  statusPill: {
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '700',
  },
  testMeta: {
    ...typography.bodySm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  locationText: {
    ...typography.bodySm,
    color: colors.textTertiary,
    marginLeft: 4,
  },
  footer: {marginTop: spacing.md, alignItems: 'center'},
});

export default WaxTruckScreen;
