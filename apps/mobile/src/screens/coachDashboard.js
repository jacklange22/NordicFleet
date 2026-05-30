import React, {useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  StatusBar,
  Pressable,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import Toast from 'react-native-toast-message';
import {useAuth} from '../context/AuthContext';
import {subscribeAthletesForCoach} from '../services/userService';
import {
  subscribePendingRequestsForCoach,
  respondToRequest,
} from '../services/coachRequestService';
import {
  Header,
  Card,
  Avatar,
  StatCard,
  Input,
  SectionHeader,
  EmptyState,
  TabBar,
  Button,
} from '../components/ui';
import {colors, spacing, typography} from '../theme';

const AthleteCard = ({athlete, onPress}) => {
  const name = athlete.displayName || athlete.email || athlete.uid;
  return (
    <Card
      onPress={onPress}
      accessibilityLabel={`Open ${name}`}
      style={styles.athleteCard}>
      <View style={styles.athleteRow}>
        <Avatar name={name} size={40} />
        <View style={styles.athleteMain}>
          <Text style={styles.athleteName} numberOfLines={1}>
            {name}
          </Text>
          {!!athlete.email && (
            <Text style={styles.athleteEmail} numberOfLines={1}>
              {athlete.email}
            </Text>
          )}
          {!!athlete.team && (
            <Text style={styles.athleteTeam} numberOfLines={1}>
              {athlete.team}
            </Text>
          )}
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.textTertiary}
        />
      </View>
    </Card>
  );
};

const CoachDashboardScreen = () => {
  const {user} = useAuth();
  const uid = user?.uid;
  const navigation = useNavigation();

  const [athletes, setAthletes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [respondingId, setRespondingId] = useState(null);

  useEffect(() => {
    if (!uid) {
      setAthletes([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeAthletesForCoach(uid, list => {
      setAthletes(list);
      setLoading(false);
    });
    return unsub;
  }, [uid]);

  useEffect(() => {
    if (!uid) {
      setPendingRequests([]);
      return;
    }
    return subscribePendingRequestsForCoach(uid, setPendingRequests);
  }, [uid]);

  const handleRespond = async (requestId, accept) => {
    setRespondingId(requestId);
    try {
      await respondToRequest(requestId, accept);
      Toast.show({
        type: 'success',
        text1: accept ? 'Request accepted' : 'Request declined',
        position: 'top',
        visibilityTime: 1800,
      });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Action failed',
        text2: String(err.message || err),
        position: 'top',
        visibilityTime: 2400,
      });
    } finally {
      setRespondingId(null);
    }
  };

  const filtered = useMemo(() => {
    if (!searchTerm) {
      return athletes;
    }
    const needle = searchTerm.toLowerCase();
    return athletes.filter(a => {
      const name = (a.displayName || '').toLowerCase();
      const email = (a.email || '').toLowerCase();
      const team = (a.team || '').toLowerCase();
      return (
        name.includes(needle) ||
        email.includes(needle) ||
        team.includes(needle)
      );
    });
  }, [athletes, searchTerm]);

  const openAthlete = athlete => {
    navigation.navigate('AthleteDetail', {
      athleteUid: athlete.uid,
      athleteEmail: athlete.email,
      athleteName: athlete.displayName,
    });
  };

  const Heading = (
    <View>
      <View style={styles.statRow}>
        <View style={styles.statCell}>
          <StatCard compact value={athletes.length} label="Athletes" />
        </View>
        <View style={styles.statCellSpacer} />
        <View style={styles.statCell}>
          <StatCard compact value="-" label="Total skis" />
        </View>
        <View style={styles.statCellSpacer} />
        <View style={styles.statCell}>
          <StatCard compact value="-" label="Tests / wk" />
        </View>
      </View>
      <View style={styles.inviteCta}>
        <Button
          variant="secondary"
          size="md"
          fullWidth
          icon="person-add-outline"
          onPress={() => navigation.navigate('InviteAthletes')}
          accessibilityLabel="Invite athletes">
          Invite athletes
        </Button>
      </View>
      {pendingRequests.length > 0 && (
        <>
          <SectionHeader title="Pending requests" />
          {pendingRequests.map(req => (
            <Card key={req.id} style={styles.requestCard}>
              <View style={styles.requestRow}>
                <Avatar name={req.athleteEmail || 'Athlete'} size={40} />
                <View style={styles.requestText}>
                  <Text style={styles.athleteName} numberOfLines={1}>
                    {req.athleteEmail}
                  </Text>
                  <Text style={styles.athleteEmail} numberOfLines={1}>
                    Wants you as their coach
                  </Text>
                </View>
              </View>
              <View style={styles.requestActions}>
                <View style={styles.requestActionCell}>
                  <Button
                    variant="ghost"
                    size="sm"
                    fullWidth
                    disabled={respondingId === req.id}
                    onPress={() => handleRespond(req.id, false)}
                    accessibilityLabel={`Decline ${req.athleteEmail}`}>
                    Decline
                  </Button>
                </View>
                <View style={styles.requestActionCell}>
                  <Button
                    variant="primary"
                    size="sm"
                    fullWidth
                    icon="checkmark"
                    loading={respondingId === req.id}
                    onPress={() => handleRespond(req.id, true)}
                    accessibilityLabel={`Accept ${req.athleteEmail}`}>
                    Accept
                  </Button>
                </View>
              </View>
            </Card>
          ))}
        </>
      )}
      <SectionHeader title="Athletes" />
      <Input
        label="Search athletes"
        icon="search-outline"
        value={searchTerm}
        onChangeText={setSearchTerm}
        autoCapitalize="none"
      />
      <View style={styles.afterSearch} />
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <Header
        title="My athletes"
        left={null}
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open profile"
            onPress={() => navigation.navigate('Profile')}
            hitSlop={8}
            style={({pressed}) => pressed && {opacity: 0.6}}>
            <Ionicons
              name="person-circle-outline"
              size={24}
              color={colors.textPrimary}
            />
          </Pressable>
        }
      />
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.red} />
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.scroll}
          data={filtered}
          keyExtractor={item => item.uid}
          renderItem={({item}) => (
            <AthleteCard athlete={item} onPress={() => openAthlete(item)} />
          )}
          ListHeaderComponent={Heading}
          ItemSeparatorComponent={Spacer}
          ListEmptyComponent={
            athletes.length === 0 ? (
              <EmptyState
                icon="people-outline"
                title="No athletes yet"
                description="Share your account email with athletes so they can add you as their coach during signup."
              />
            ) : (
              <View style={styles.noMatchWrap}>
                <Text style={styles.noMatchText}>
                  No athletes match your search.
                </Text>
              </View>
            )
          }
        />
      )}
      <TabBar />
    </SafeAreaView>
  );
};

const Spacer = () => <View style={styles.rowSpacer} />;

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.bg},
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing['4xl'],
    flexGrow: 1,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  statCell: {flex: 1},
  statCellSpacer: {width: spacing.sm},

  inviteCta: {marginBottom: spacing.md},

  afterSearch: {height: spacing.lg},

  athleteCard: {},
  athleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  athleteMain: {
    flex: 1,
    marginLeft: spacing.md,
  },
  athleteName: {
    ...typography.headingMd,
    color: colors.textPrimary,
  },
  athleteEmail: {
    ...typography.bodySm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  athleteTeam: {
    ...typography.bodySm,
    color: colors.textTertiary,
    marginTop: 2,
  },
  rowSpacer: {height: spacing.md},
  requestCard: {
    marginBottom: spacing.md,
  },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  requestText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  requestActions: {
    flexDirection: 'row',
  },
  requestActionCell: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  noMatchWrap: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  noMatchText: {
    ...typography.body,
    color: colors.textTertiary,
  },
});

export default CoachDashboardScreen;
