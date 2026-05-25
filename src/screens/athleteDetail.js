import React, {useEffect, useState, useCallback} from 'react';
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
import Ionicons from 'react-native-vector-icons/Ionicons';

import {useAuth} from '../context/AuthContext';
import {subscribeSkisForAthlete} from '../services/skiService';
import {
  Header,
  Card,
  Avatar,
  Pill,
  StatCard,
  SectionHeader,
  EmptyState,
} from '../components/ui';
import {colors, radius, spacing, typography} from '../theme';

const SkiRow = ({ski, onPress}) => {
  const tech = (ski.technique || '').toLowerCase();
  const accentColor = tech === 'skate' ? colors.redDim : colors.red;
  return (
    <Card
      onPress={onPress}
      accessibilityLabel={`Open ${ski.name || 'ski'}`}
      padding={0}
      style={styles.skiCardOuter}>
      <View style={styles.skiCardBody}>
        <View style={[styles.accentBar, {backgroundColor: accentColor}]} />
        <View style={styles.skiCardMain}>
          <Text style={styles.skiName} numberOfLines={1}>
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
            {!!ski.grind && (
              <View style={styles.pillWrap}>
                <Pill variant="ghost" color="neutral">
                  {ski.grind}
                </Pill>
              </View>
            )}
          </View>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.textTertiary}
          style={styles.chevron}
        />
      </View>
    </Card>
  );
};

const Spacer = () => <View style={styles.rowSpacer} />;

const AthleteDetailScreen = ({route}) => {
  const {user} = useAuth();
  const coachUid = user?.uid;
  const navigation = useNavigation();
  const {athleteUid, athleteEmail, athleteName} = route?.params || {};

  const [skis, setSkis] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!coachUid || !athleteUid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeSkisForAthlete(coachUid, athleteUid, list => {
      setSkis((list || []).filter(s => !s.retired));
      setLoading(false);
    });
    return unsub;
  }, [coachUid, athleteUid]);

  const headerLabel = athleteName || athleteEmail || 'Athlete';

  const goSki = useCallback(
    skiId => {
      navigation.navigate('SkiInfo', {skiId, ownerUid: athleteUid});
    },
    [navigation, athleteUid],
  );

  const renderRow = useCallback(
    ({item}) => <SkiRow ski={item} onPress={() => goSki(item.id)} />,
    [goSki],
  );

  const Heading = (
    <View>
      <View style={styles.identityRow}>
        <Avatar name={headerLabel} size={56} />
        <View style={styles.identityText}>
          <Text style={styles.identityName} numberOfLines={1}>
            {headerLabel}
          </Text>
          {!!athleteEmail && athleteEmail !== headerLabel && (
            <Text style={styles.identityEmail} numberOfLines={1}>
              {athleteEmail}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.statRow}>
        <View style={styles.statCell}>
          <StatCard compact value={skis.length} label="Skis" />
        </View>
        <View style={styles.statCellSpacer} />
        <View style={styles.statCell}>
          <StatCard compact value="—" label="Last wax" />
        </View>
        <View style={styles.statCellSpacer} />
        <View style={styles.statCell}>
          <StatCard compact value="—" label="Tests" />
        </View>
      </View>

      <SectionHeader title="Fleet" />
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <Header
        title={headerLabel}
        subtitle="Coach view"
        right={
          <Avatar
            name={headerLabel}
            size={32}
          />
        }
      />
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.red} />
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.scroll}
          data={skis}
          keyExtractor={item => item.id}
          renderItem={renderRow}
          ListHeaderComponent={Heading}
          ItemSeparatorComponent={Spacer}
          ListEmptyComponent={
            <EmptyState
              icon="snow-outline"
              title="No skis yet"
              description="This athlete hasn't added any skis to their fleet yet."
            />
          }
        />
      )}
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
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing['4xl'],
    flexGrow: 1,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  identityText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  identityName: {
    ...typography.displayMd,
    color: colors.textPrimary,
  },
  identityEmail: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  statCell: {flex: 1},
  statCellSpacer: {width: spacing.sm},

  skiCardOuter: {overflow: 'hidden'},
  skiCardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 80,
  },
  accentBar: {
    width: 4,
    alignSelf: 'stretch',
    borderTopLeftRadius: radius.lg,
    borderBottomLeftRadius: radius.lg,
  },
  skiCardMain: {
    flex: 1,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  skiName: {
    ...typography.headingMd,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  pillWrap: {
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  chevron: {
    paddingRight: spacing.lg,
  },
  rowSpacer: {height: spacing.md},
});

export default AthleteDetailScreen;
