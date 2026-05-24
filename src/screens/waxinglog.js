import React, {useState, useEffect, useMemo} from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import ProfileButton from '../components/profilebutton';
import Footer from '../components/footer';
import testData from '../testingdata.json';
import MultiSelectDropdown from '../components/checkboxDropdown';
import WaxInputComponent from '../components/waxinput.js';
import SkiSaveButton from '../components/skisaveButton';
import {useNavigation} from '@react-navigation/native';

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

  // userId still hard-coded here in Phase 1 — Phase 3 swaps it for AuthContext.
  const userId = 'user1';

  const skisForUser = useMemo(() => {
    const user = testData.users.find(u => u.id === userId);
    return user ? user.skis : [];
  }, [userId]);

  // checkboxDropdown now expects {id, label} items.
  const dropdownItems = useMemo(
    () => skisForUser.map(ski => ({id: ski.id, label: ski.name})),
    [skisForUser],
  );

  const [selectedSkis, setSelectedSkis] = useState([]); // array of ski IDs
  // Lifted state — one wax-log entry per selected ski, keyed by ski ID.
  const [waxLog, setWaxLog] = useState({});
  const [skiWaxEntries, setSkiWaxEntries] = useState([]);

  const getTechniqueBySkiId = skiId => {
    const ski = skisForUser.find(s => s.id === skiId);
    return ski ? ski.technique : null;
  };

  // Rebuild the wax-entry map when the selected-ski set changes.
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

  const handleSelectionDone = items => {
    setSelectedSkis(items);
  };

  const handleEntryChange = (skiId, partial) => {
    setWaxLog(prev => ({
      ...prev,
      [skiId]: {...prev[skiId], ...partial},
    }));
  };

  const handleSavePress = () => {
    // Phase 4 wires this to Firestore. Phase 1 just collects the data.
    const payload = selectedSkis.map(skiId => ({
      skiId,
      ...waxLog[skiId],
    }));
    // eslint-disable-next-line no-undef
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      // intentional: payload would otherwise be unused in Phase 1
      void payload;
    }
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
          <MultiSelectDropdown
            items={dropdownItems}
            onSelectionDone={handleSelectionDone}
            label={'Select Skis Waxed'}
          />

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
        <SkiSaveButton onPress={handleSavePress} />
      </ScrollView>
      <View style={styles.Footer}>
        <Footer />
      </View>
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
  checkboxText: {
    fontSize: 14,
  },
  Footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 35,
  },
  scrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 100,
    paddingTop: 0,
  },
});

export default WaxLogScreen;
