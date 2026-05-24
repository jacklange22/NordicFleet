import React, {useState, useEffect, useMemo} from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import ProfileButton from '../components/profilebutton';
import Footer from '../components/footer';
import MultiSelectDropdown from '../components/checkboxDropdown';
import WaxInputComponent from '../components/waxinput.js';
import SkiSaveButton from '../components/skisaveButton';
import {useNavigation} from '@react-navigation/native';
import {useAuth} from '../context/AuthContext';
import {subscribeSkis} from '../services/skiService';
import {createWaxLog} from '../services/waxLogService';
import {firestore} from '../services/firebase';

const emptyWaxEntry = () => ({
  binder: '',
  kickLayers: 1,
  kickWax: '',
  glideLayers: 1,
  glideWaxes: [''],
  notes: '',
});

const WaxLogScreen = () => {
  const navigation = useNavigation();
  const {user} = useAuth();
  const uid = user?.uid;

  const [skisForUser, setSkisForUser] = useState([]);
  const [loadingSkis, setLoadingSkis] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!uid) {
      setSkisForUser([]);
      setLoadingSkis(false);
      return;
    }
    setLoadingSkis(true);
    const unsub = subscribeSkis(uid, skis => {
      setSkisForUser(skis.filter(s => !s.retired));
      setLoadingSkis(false);
    });
    return unsub;
  }, [uid]);

  const dropdownItems = useMemo(
    () => skisForUser.map(ski => ({id: ski.id, label: ski.name || ski.id})),
    [skisForUser],
  );

  const [selectedSkis, setSelectedSkis] = useState([]);
  const [waxLog, setWaxLog] = useState({});
  const [skiWaxEntries, setSkiWaxEntries] = useState([]);

  const getTechniqueBySkiId = skiId => {
    const ski = skisForUser.find(s => s.id === skiId);
    return ski ? ski.technique : null;
  };

  useEffect(() => {
    setWaxLog(prev => {
      const next = {};
      for (const skiId of selectedSkis) {
        next[skiId] = prev[skiId] || emptyWaxEntry();
      }
      return next;
    });
    setSkiWaxEntries(selectedSkis);
  }, [selectedSkis]);

  const handleSelectionDone = items => setSelectedSkis(items);

  const handleEntryChange = (skiId, partial) => {
    setWaxLog(prev => ({
      ...prev,
      [skiId]: {...prev[skiId], ...partial},
    }));
  };

  const handleSavePress = async () => {
    if (!uid) {
      Alert.alert('Please sign in to save');
      return;
    }
    if (selectedSkis.length === 0) {
      Alert.alert('Please pick at least one ski');
      return;
    }
    setSubmitting(true);
    const date = firestore.FieldValue.serverTimestamp();
    const writes = selectedSkis.map(skiId =>
      createWaxLog(uid, {
        skiId,
        date,
        ...waxLog[skiId],
      }),
    );
    try {
      await Promise.all(writes);
    } catch (err) {
      // Offline-first: Firestore queues failed writes locally. Only show an
      // error for non-network failures.
      const code = err && err.code;
      if (code && !String(code).includes('unavailable')) {
        Alert.alert('Save failed', String(err.message || err));
        setSubmitting(false);
        return;
      }
    }
    setSubmitting(false);
    navigation.navigate('Home');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Waxing Log</Text>
          <ProfileButton />
        </View>
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContentContainer}>
        <View style={styles.dropdownContainer}>
          <Text style={styles.dropdownLabel}>Skis:</Text>
          {loadingSkis ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <MultiSelectDropdown
              items={dropdownItems}
              onSelectionDone={handleSelectionDone}
              label={'Select Skis Waxed'}
            />
          )}

          <Text style={styles.dropdownLabel}>Wax:</Text>
          {skiWaxEntries.map(skiId => {
            const technique = getTechniqueBySkiId(skiId);
            const ski = skisForUser.find(s => s.id === skiId);
            return (
              <WaxInputComponent
                key={skiId}
                ski={ski ? ski.name : skiId}
                technique={technique}
                value={waxLog[skiId] || emptyWaxEntry()}
                onChange={partial => handleEntryChange(skiId, partial)}
              />
            );
          })}
        </View>
        <SkiSaveButton onPress={submitting ? () => {} : handleSavePress} />
      </ScrollView>
      <Footer />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  container: {
    paddingHorizontal: 0,
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
  dropdownContainer: {
    paddingHorizontal: 10,
    paddingVertical: 20,
    textAlignVertical: 'center',
  },
  dropdownLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 20,
    paddingTop: 0,
  },
});

export default WaxLogScreen;
