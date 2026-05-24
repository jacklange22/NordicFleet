import React, {useEffect, useState} from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import ProfileButton from '../components/profilebutton.js';
import SkiItem from '../components/skiitem.js';
import {useAuth} from '../context/AuthContext';
import {subscribeSkisForAthlete} from '../services/skiService';
import {useNavigation} from '@react-navigation/native';

/**
 * AthleteDetail — read-only view of an athlete's ski fleet, for coaches.
 *
 * Reuses the regular SkiItem row component so the visual is consistent
 * with the athlete's own Home. Tapping a ski navigates to SkiInfo in
 * coach mode (which suppresses edit affordances). Logging buttons in the
 * footer are not shown.
 *
 * Route params: { athleteUid, athleteEmail, athleteName }
 */
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTextSmall}>Fleet</Text>
          <Text style={styles.headerText}>{headerLabel}</Text>
        </View>
        <ProfileButton />
      </View>

      <View style={styles.backRow}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Back to athlete list"
          onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← All athletes</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#fff" style={styles.loading} />
      ) : (
        <FlatList
          style={styles.list}
          data={skis}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <SkiItem
              skiId={item.id}
              ownerUid={athleteUid}
              name={item.name}
              technique={item.technique}
              type={item.type}
              grind={item.grind}
            />
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              This athlete hasn't added any skis yet.
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#282828',
    height: 50,
  },
  headerTextSmall: {
    fontSize: 11,
    color: '#aaa',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  headerText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '600',
  },
  backRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  backText: {
    color: '#E53935',
    fontSize: 14,
  },
  loading: {
    flex: 1,
    marginTop: 40,
  },
  list: {
    flex: 1,
  },
  emptyText: {
    color: '#777',
    textAlign: 'center',
    marginTop: 40,
    fontStyle: 'italic',
    paddingHorizontal: 30,
  },
});

export default AthleteDetailScreen;
