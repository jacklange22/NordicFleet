import React, {useState, useMemo, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  Pressable,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import {useAuth} from '../context/AuthContext';
import useSkis from '../hooks/useSkis';
import useProfile from '../hooks/useProfile';
import useDashboardStats from '../hooks/useDashboardStats';
import {
  StatCard,
  Card,
  Avatar,
  TabBar,
  EmptyState,
  Input,
  Pill,
  SectionHeader,
} from '../components/ui';
import {colors, spacing, typography, radius} from '../theme';

const formatLastWax = d => {
  if (!d) {
    return '-';
  }
  const diff = Math.max(0, Date.now() - d.getTime());
  const day = 24 * 60 * 60 * 1000;
  const days = Math.floor(diff / day);
  if (days === 0) {
    const hours = Math.floor(diff / (60 * 60 * 1000));
    if (hours === 0) {
      return 'today';
    }
    return `${hours}h ago`;
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

const SkiSeparator = () => <View style={styles.rowSpacer} />;

const SkiCard = ({ski, onPress}) => {
  const tech = (ski.technique || '').toLowerCase();
  const accentColor = tech === 'skate' ? colors.redDim : colors.red;
  const name = (ski.name || '').trim();
  const brand = (ski.brand || '').trim();
  const model = (ski.model || '').trim();
  // With a display name, brand·model is a secondary line; without one, the
  // brand+model reads as the title (space-joined, like a product name).
  const title = name || [brand, model].filter(Boolean).join(' ') || 'Unnamed ski';
  const subtitle = name ? [brand, model].filter(Boolean).join(' · ') : '';
  return (
    <Card
      onPress={onPress}
      accessibilityLabel={`Open ${title}`}
      style={styles.skiCardOuter}
      padding={0}>
      <View style={styles.skiCardBody}>
        <View style={[styles.accentBar, {backgroundColor: accentColor}]} />
        <View style={styles.skiCardMain}>
          <Text style={styles.skiName} numberOfLines={1}>
            {title}
          </Text>
          {!!subtitle && (
            <Text style={styles.skiBrandModel} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
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
          size={22}
          color={colors.textTertiary}
          style={styles.chevron}
        />
      </View>
    </Card>
  );
};

const FilterChips = ({technique, setTechnique, type, setType}) => {
  const techs = ['Classic', 'Skate'];
  const types = ['Cold', 'Universal', 'Warm', 'Zero'];
  const toggle = (current, setter, value) =>
    setter(current?.toLowerCase() === value.toLowerCase() ? null : value);

  return (
    <View style={styles.filterChips}>
      <Text style={styles.filterChipsLabel}>Technique</Text>
      <View style={styles.chipRow}>
        {techs.map(t => (
          <View key={t} style={styles.chipWrap}>
            <Pill
              variant={
                technique?.toLowerCase() === t.toLowerCase()
                  ? 'solid'
                  : 'outline'
              }
              color="red"
              onPress={() => toggle(technique, setTechnique, t)}>
              {t}
            </Pill>
          </View>
        ))}
      </View>
      <Text style={[styles.filterChipsLabel, {marginTop: spacing.md}]}>
        Type
      </Text>
      <View style={styles.chipRow}>
        {types.map(t => (
          <View key={t} style={styles.chipWrap}>
            <Pill
              variant={
                type?.toLowerCase() === t.toLowerCase() ? 'solid' : 'outline'
              }
              color="red"
              onPress={() => toggle(type, setType, t)}>
              {t}
            </Pill>
          </View>
        ))}
      </View>
    </View>
  );
};

const HomeScreen = () => {
  const navigation = useNavigation();
  const {user} = useAuth();
  const uid = user?.uid;

  const {profile} = useProfile(uid);
  const {skis, loading: skisLoading} = useSkis(uid);
  const {
    lastWaxAt,
    totalTests,
    refresh: refreshStats,
    loading: statsLoading,
  } = useDashboardStats(uid);

  const [searchTerm, setSearchTerm] = useState('');
  const [technique, setTechnique] = useState(null);
  const [type, setType] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const greeting = useMemo(() => {
    const name = (profile?.name || '').trim();
    if (name) {
      const first = name.split(/\s+/)[0];
      return `Hi, ${first}`;
    }
    return 'Welcome back';
  }, [profile?.name]);

  const filteredSkis = useMemo(() => {
    let result = skis;
    if (searchTerm) {
      const needle = searchTerm.toLowerCase();
      result = result.filter(s =>
        (s.name || '').toLowerCase().includes(needle),
      );
    }
    if (technique) {
      result = result.filter(
        s => (s.technique || '').toLowerCase() === technique.toLowerCase(),
      );
    }
    if (type) {
      result = result.filter(
        s => (s.type || '').toLowerCase() === type.toLowerCase(),
      );
    }
    return result;
  }, [skis, searchTerm, technique, type]);

  const onRefresh = useCallback(() => {
    refreshStats();
  }, [refreshStats]);

  const goSki = useCallback(
    skiId => {
      navigation.navigate('SkiInfo', {skiId});
    },
    [navigation],
  );

  const renderSkiRow = useCallback(
    ({item}) => <SkiCard ski={item} onPress={() => goSki(item.id)} />,
    [goSki],
  );

  const filtersActive = !!(technique || type);

  const ListHeader = (
    <View style={styles.headerWrap}>
      <View style={styles.statsRow}>
        <View style={styles.statsCell}>
          <StatCard value={skis.length} label="Total skis" />
        </View>
        <View style={styles.statsCell}>
          <StatCard
            value={formatLastWax(lastWaxAt)}
            label="Last wax"
            valueStyle={styles.lastWaxValue}
          />
        </View>
        <View style={styles.statsCell}>
          <StatCard value={totalTests} label="Tests logged" />
        </View>
      </View>

      <SectionHeader
        title="Your fleet"
        action={{
          label: filtersOpen ? 'Hide' : 'Filter',
          onPress: () => setFiltersOpen(o => !o),
        }}
      />

      <Input
        label="Search skis"
        icon="search-outline"
        value={searchTerm}
        onChangeText={setSearchTerm}
        autoCapitalize="none"
      />

      {filtersOpen && (
        <FilterChips
          technique={technique}
          setTechnique={setTechnique}
          type={type}
          setType={setType}
        />
      )}

      {filtersActive && !filtersOpen && (
        <View style={styles.activeFilterRow}>
          {!!technique && (
            <View style={styles.chipWrap}>
              <Pill
                variant="solid"
                color="red"
                onPress={() => setTechnique(null)}>
                {technique} ×
              </Pill>
            </View>
          )}
          {!!type && (
            <View style={styles.chipWrap}>
              <Pill variant="solid" color="red" onPress={() => setType(null)}>
                {type} ×
              </Pill>
            </View>
          )}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <View style={styles.topBar}>
        <View style={styles.greetingWrap}>
          <Text style={styles.greetingHi} numberOfLines={1}>
            {greeting}
          </Text>
          <Text style={styles.greetingSub} numberOfLines={1}>
            How is the fleet today?
          </Text>
        </View>
        <Pressable
          onPress={() => navigation.navigate('Profile')}
          accessibilityRole="button"
          accessibilityLabel="Open profile"
          hitSlop={8}>
          <Avatar
            uri={profile?.image}
            name={profile?.name || user?.email || ''}
            size={40}
          />
        </Pressable>
      </View>

      {skisLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.red} />
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={filteredSkis}
          keyExtractor={item => item.id.toString()}
          renderItem={renderSkiRow}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={ListHeader}
          ItemSeparatorComponent={SkiSeparator}
          ListEmptyComponent={
            skis.length === 0 ? (
              <EmptyState
                icon="snow-outline"
                title="No skis in your fleet yet"
                description="Add your first ski to start tracking waxes and tests."
                cta={{
                  label: 'Add a ski',
                  icon: 'add',
                  onPress: () => navigation.navigate('newSki'),
                }}
              />
            ) : (
              <View style={styles.noMatchWrap}>
                <Text style={styles.noMatchText}>
                  No skis match your filters.
                </Text>
              </View>
            )
          }
          refreshControl={
            <RefreshControl
              refreshing={statsLoading}
              onRefresh={onRefresh}
              tintColor={colors.red}
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  greetingWrap: {
    flex: 1,
  },
  greetingHi: {
    ...typography.displayMd,
    color: colors.textPrimary,
  },
  greetingSub: {
    ...typography.bodySm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing['4xl'],
    flexGrow: 1,
  },
  headerWrap: {
    marginBottom: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  statsCell: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  lastWaxValue: {
    fontSize: 22,
    letterSpacing: -0.3,
  },
  skiCardOuter: {
    overflow: 'hidden',
  },
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
    marginBottom: 2,
  },
  skiBrandModel: {
    ...typography.bodySm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.xs,
  },
  pillWrap: {
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  chevron: {
    paddingRight: spacing.lg,
  },
  filterChips: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  filterChipsLabel: {
    ...typography.caption,
    color: colors.textTertiary,
    marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chipWrap: {
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  activeFilterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  noMatchWrap: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  noMatchText: {
    ...typography.body,
    color: colors.textTertiary,
  },
  rowSpacer: {
    height: spacing.md,
  },
});

export default HomeScreen;
