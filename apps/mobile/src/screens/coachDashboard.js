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

import {useAuth} from '../context/AuthContext';
import {subscribeAthletesForCoach} from '../services/userService';
import {
  Header,
  Card,
  Avatar,
  StatCard,
  Input,
  SectionHeader,
  EmptyState,
  TabBar,
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
          <StatCard compact value="—" label="Total skis" />
        </View>
        <View style={styles.statCellSpacer} />
        <View style={styles.statCell}>
          <StatCard compact value="—" label="Tests / wk" />
        </View>
      </View>
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
            accessibilityLabel="Settings"
            onPress={() => navigation.navigate('Profile')}
            hitSlop={8}
            style={({pressed}) => pressed && {opacity: 0.6}}>
            <Ionicons
              name="settings-outline"
              size={22}
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
      <TabBar role="coach" />
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
