import React, {useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import {useAuth} from '../context/AuthContext';
import useSkis from '../hooks/useSkis';
import {
  subscribeSuggestionsForAthlete,
  acceptSuggestion,
  rejectSuggestion,
} from '../services/fleetSuggestionService';
import {
  Header,
  Card,
  Button,
  Pill,
  EmptyState,
  TabBar,
} from '../components/ui';
import {colors, spacing, typography} from '../theme';

const TARGET_LABEL = {ski: 'Ski', waxLog: 'Wax log', testLog: 'Test log'};
const STATUS_COLOR = {pending: 'red', accepted: 'neutral', rejected: 'neutral'};

const fieldLabel = key =>
  key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');

const SuggestionCard = ({item, targetName, onAccept, onReject, busy}) => {
  const changes = item.suggestedChanges || {};
  const changeKeys = Object.keys(changes);
  return (
    <Card style={styles.card}>
      <View style={styles.cardHead}>
        <Text style={styles.targetName} numberOfLines={1}>
          {targetName}
        </Text>
        <Pill variant="ghost" color={STATUS_COLOR[item.status] || 'neutral'}>
          {item.status}
        </Pill>
      </View>
      <Text style={styles.targetType}>
        {TARGET_LABEL[item.targetType] || 'Item'} suggestion from your coach
      </Text>

      {changeKeys.length > 0 && (
        <View style={styles.changes}>
          {changeKeys.map(k => (
            <Text key={k} style={styles.changeLine}>
              {fieldLabel(k)}: {String(changes[k])}
            </Text>
          ))}
        </View>
      )}
      {!!item.comment && <Text style={styles.comment}>{item.comment}</Text>}

      {item.status === 'pending' && (
        <View style={styles.actions}>
          <View style={styles.actionCell}>
            <Button
              variant="ghost"
              size="md"
              fullWidth
              disabled={busy}
              onPress={() => onReject(item)}
              accessibilityLabel={`Reject suggestion for ${targetName}`}>
              Reject
            </Button>
          </View>
          <View style={styles.actionCell}>
            <Button
              variant="primary"
              size="md"
              fullWidth
              icon="checkmark"
              loading={busy}
              onPress={() => onAccept(item)}
              accessibilityLabel={`Accept suggestion for ${targetName}`}>
              Accept
            </Button>
          </View>
        </View>
      )}
    </Card>
  );
};

const Spacer = () => <View style={styles.spacer} />;

const SuggestionsScreen = () => {
  const {user} = useAuth();
  const uid = user?.uid;
  const {skis} = useSkis(uid, {includeRetired: true});

  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const skiNameById = useMemo(() => {
    const m = new Map();
    skis.forEach(s => {
      m.set(
        s.id,
        (s.name || '').trim() ||
          [s.brand, s.model].filter(Boolean).join(' ').trim() ||
          'Unnamed ski',
      );
    });
    return m;
  }, [skis]);

  useEffect(() => {
    if (!uid) {
      setSuggestions([]);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    return subscribeSuggestionsForAthlete(uid, list => {
      setSuggestions(list);
      setLoading(false);
    });
  }, [uid]);

  const targetNameFor = item =>
    item.targetType === 'ski'
      ? skiNameById.get(item.targetId) || 'A ski'
      : TARGET_LABEL[item.targetType] || 'An item';

  const handleAccept = async item => {
    setBusyId(item.id);
    try {
      await acceptSuggestion(item);
      Toast.show({
        type: 'success',
        text1: 'Suggestion applied',
        position: 'top',
        visibilityTime: 2000,
      });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Could not apply',
        text2: String(err.message || err),
        position: 'top',
        visibilityTime: 2400,
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async item => {
    setBusyId(item.id);
    try {
      await rejectSuggestion(item.id);
    } catch {
      // ignore - the next snapshot reflects the truth
    } finally {
      setBusyId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <Header title="Coach suggestions" />
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.red} />
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.scroll}
          data={suggestions}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <SuggestionCard
              item={item}
              targetName={targetNameFor(item)}
              onAccept={handleAccept}
              onReject={handleReject}
              busy={busyId === item.id}
            />
          )}
          ItemSeparatorComponent={Spacer}
          ListEmptyComponent={
            <EmptyState
              icon="bulb-outline"
              title="No suggestions yet"
              description="When your coach suggests a change to a ski, wax, or test, it shows up here for you to accept or reject."
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
  card: {},
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  targetName: {
    ...typography.headingMd,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  targetType: {
    ...typography.bodySm,
    color: colors.textTertiary,
    marginTop: 2,
  },
  changes: {
    marginTop: spacing.md,
    backgroundColor: colors.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  changeLine: {
    ...typography.body,
    color: colors.textPrimary,
  },
  comment: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    marginTop: spacing.lg,
  },
  actionCell: {flex: 1, marginHorizontal: spacing.xs},
  spacer: {height: spacing.md},
});

export default SuggestionsScreen;
