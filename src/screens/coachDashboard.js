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
import {useAuth} from '../context/AuthContext';
import {subscribeAthletesForCoach} from '../services/userService';
import {useNavigation} from '@react-navigation/native';

/**
 * Coach dashboard — primary landing for users with role='coach'.
 * Lists every athlete linked via the coach's athleteIds.
 *
 * No new-ski / wax-log / test-log footer entries: coaches consume data,
 * they don't produce it. The only navigation out is to Profile (sign out)
 * or into an individual athlete's detail screen.
 */
const CoachDashboardScreen = () => {
  const {user} = useAuth();
  const uid = user?.uid;
  const navigation = useNavigation();

  const [athletes, setAthletes] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const renderAthleteRow = ({item}) => (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`Open ${item.email || item.displayName || 'athlete'}`}
      style={styles.athleteRow}
      onPress={() =>
        navigation.navigate('AthleteDetail', {
          athleteUid: item.uid,
          athleteEmail: item.email,
          athleteName: item.displayName,
        })
      }>
      <View style={styles.athleteInfo}>
        <Text style={styles.athleteName}>
          {item.displayName || item.email || item.uid}
        </Text>
        {!!item.team && <Text style={styles.athleteTeam}>{item.team}</Text>}
      </View>
      <Text style={styles.arrow}>→</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerText}>My Athletes</Text>
        <ProfileButton />
      </View>

      {loading ? (
        <ActivityIndicator color="#fff" style={styles.loading} />
      ) : (
        <FlatList
          style={styles.list}
          data={athletes}
          keyExtractor={item => item.uid}
          renderItem={renderAthleteRow}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No athletes yet.</Text>
              <Text style={styles.emptySubText}>
                Share your account email with athletes so they can add you as
                their coach during signup.
              </Text>
            </View>
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
  headerText: {
    fontSize: 24,
    color: '#fff',
  },
  loading: {
    flex: 1,
    marginTop: 40,
  },
  list: {
    flex: 1,
  },
  athleteRow: {
    backgroundColor: '#333',
    padding: 20,
    borderRadius: 10,
    marginBottom: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'grey',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  athleteInfo: {
    flex: 1,
  },
  athleteName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  athleteTeam: {
    color: '#aaa',
    fontSize: 13,
    marginTop: 4,
  },
  arrow: {
    fontSize: 24,
    color: 'white',
    paddingHorizontal: 10,
  },
  empty: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#fff',
    fontSize: 16,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  emptySubText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default CoachDashboardScreen;
