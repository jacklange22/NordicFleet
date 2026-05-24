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
import Dropdown from '../components/dropdown';
import ProfileButton from '../components/profilebutton';
import Footer from '../components/footer';
import MultiSelectDropdown from '../components/checkboxDropdown';
import InputField from '../components/inputfield';
import SkiInputComponent from '../components/testInput';
import SkiSaveButton from '../components/skisaveButton';
import {useNavigation} from '@react-navigation/native';
import {useAuth} from '../context/AuthContext';
import useSkis from '../hooks/useSkis';
import {createTestLog} from '../services/testLogService';
import {firestore} from '../services/firebase';

const emptyTestEntry = () => ({
  glideWax: '',
  kickWax: '',
  glideRating: 5,
  kickRating: 5,
  stabilityRating: 5,
  climbingRating: 5,
  notes: '',
});

const TestingLogScreen = () => {
  const navigation = useNavigation();
  const {user} = useAuth();
  const uid = user?.uid;

  const {skis: skisForUser, loading: loadingSkis} = useSkis(uid);
  const [submitting, setSubmitting] = useState(false);

  const dropdownItems = useMemo(
    () => skisForUser.map(ski => ({id: ski.id, label: ski.name || ski.id})),
    [skisForUser],
  );

  const getTechniqueBySkiId = skiId => {
    const ski = skisForUser.find(s => s.id === skiId);
    return ski ? ski.technique : null;
  };

  const [selectedSkis, setSelectedSkis] = useState([]);
  const [testingLog, setTestingLog] = useState({
    humidity: '',
    temperature: '',
    snowType: '',
    surface: '',
  });
  const [skiTestEntries, setSkiTestEntries] = useState({});

  useEffect(() => {
    setSkiTestEntries(prev => {
      const next = {};
      for (const skiId of selectedSkis) {
        next[skiId] = prev[skiId] || emptyTestEntry();
      }
      return next;
    });
  }, [selectedSkis]);

  const handleSelectionDone = items => setSelectedSkis(items);

  const handleTestingLogChange = (field, value) => {
    setTestingLog(prev => ({...prev, [field]: value}));
  };

  const handleEntryChange = (skiId, partial) => {
    setSkiTestEntries(prev => ({
      ...prev,
      [skiId]: {...prev[skiId], ...partial},
    }));
  };

  const handleSubmit = async () => {
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
      createTestLog(uid, {
        skiId,
        date,
        temperature: testingLog.temperature,
        humidity: testingLog.humidity,
        snowType: testingLog.snowType,
        surface: testingLog.surface,
        ...skiTestEntries[skiId],
      }),
    );
    try {
      await Promise.all(writes);
    } catch (err) {
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

  const snowOptions = ['Old', 'New', 'Manmade'];
  const surfaceOptions = ['Hardpack', 'Powder', 'Corduroy', 'Slush'];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Testing Log</Text>
          <ProfileButton />
        </View>
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContentContainer}>
        <View style={styles.dropdownContainer}>
          <Text style={styles.dropdownLabel}>Snow:</Text>
          <Dropdown
            options={snowOptions}
            onSelect={v => handleTestingLogChange('snowType', v)}
            placeholder="Choose one"
          />
          <Text style={styles.dropdownLabel}>Surface:</Text>
          <Dropdown
            options={surfaceOptions}
            onSelect={v => handleTestingLogChange('surface', v)}
            placeholder="Choose one"
          />
          <Text style={styles.dropdownLabel}>Skis:</Text>
          {loadingSkis ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <MultiSelectDropdown
              items={dropdownItems}
              onSelectionDone={handleSelectionDone}
              label={'Select Skis Tested'}
            />
          )}
          <Text style={styles.dropdownLabel}>Temperature:</Text>
          <InputField
            placeholder="Enter temperature"
            keyboardType="numeric"
            onChangeText={text => handleTestingLogChange('temperature', text)}
            value={testingLog.temperature}
          />
          <Text style={styles.dropdownLabel}>Humidity:</Text>
          <InputField
            placeholder="Enter humidity"
            keyboardType="numeric"
            onChangeText={text => handleTestingLogChange('humidity', text)}
            value={testingLog.humidity}
          />
          <Text style={styles.dropdownLabel}>Tests:</Text>
          {selectedSkis.map(skiId => {
            const technique = getTechniqueBySkiId(skiId);
            const ski = skisForUser.find(s => s.id === skiId);
            return (
              <SkiInputComponent
                key={skiId}
                ski={ski ? ski.name : skiId}
                technique={technique}
                value={skiTestEntries[skiId] || emptyTestEntry()}
                onChange={partial => handleEntryChange(skiId, partial)}
              />
            );
          })}
        </View>
        <SkiSaveButton onPress={submitting ? () => {} : handleSubmit} />
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

export default TestingLogScreen;
