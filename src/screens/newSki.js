import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Dropdown from '../components/dropdown';
import Footer from '../components/footer';
import ProfileButton from '../components/profilebutton';
import SkiSaveButton from '../components/skisaveButton';
import {useNavigation} from '@react-navigation/native';
import {useAuth} from '../context/AuthContext';
import {createSki} from '../services/skiService';

const AddSkiForm = () => {
  const navigation = useNavigation();
  const {user} = useAuth();
  const uid = user?.uid;

  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [base, setBase] = useState('');
  const [build, setBuild] = useState('');
  const [grind, setGrind] = useState('');
  const [length, setLength] = useState('');
  const [name, setName] = useState('');
  const [flex, setFlex] = useState('');
  const [notes, setNotes] = useState('');
  const [technique, setTechnique] = useState('');
  const [type, setType] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (
      !brand ||
      !model ||
      !base ||
      !build ||
      !grind ||
      !length ||
      !name ||
      !flex ||
      !technique ||
      !type
    ) {
      Alert.alert('Please fill out all required fields.');
      return;
    }
    if (!uid) {
      Alert.alert('Please sign in to add a ski');
      return;
    }
    setSubmitting(true);
    try {
      const newId = await createSki(uid, {
        brand,
        model,
        base,
        build,
        grind,
        length,
        name,
        flex,
        notes,
        technique,
        type,
      });
      navigation.replace('SkiInfo', {skiId: newId});
    } catch (err) {
      Alert.alert('Could not save', String(err.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerText}>New Ski!</Text>
        <ProfileButton />
      </View>
      <ScrollView style={styles.scrollViewContent}>
        <View style={styles.infoContainer}>
          <Text style={styles.label}>Brand:</Text>
          <Dropdown
            placeholder="Select a Brand"
            options={['Salomon', 'Atomic', 'Fischer', 'Madshus', 'Rossignol']}
            onSelect={setBrand}
            value={brand}
          />
          <Text style={styles.label}>Model:</Text>
          <TextInput
            style={styles.input}
            value={model}
            onChangeText={setModel}
            placeholder="Enter model"
            placeholderTextColor="#888"
          />
          <Text style={styles.label}>Base:</Text>
          <TextInput
            style={styles.input}
            value={base}
            onChangeText={setBase}
            placeholder="Enter base"
            placeholderTextColor="#888"
          />
          <Text style={styles.label}>Technique:</Text>
          <Dropdown
            placeholder="Technique?"
            options={['Skate', 'Classic']}
            onSelect={setTechnique}
            value={technique}
          />
          <Text style={styles.label}>Type:</Text>
          <Dropdown
            placeholder="Type?"
            options={['warm', 'universal', 'cold', 'zero']}
            onSelect={setType}
            value={type}
          />
          <Text style={styles.label}>Build:</Text>
          <TextInput
            style={styles.input}
            value={build}
            onChangeText={setBuild}
            placeholder="Enter build"
            placeholderTextColor="#888"
          />
          <Text style={styles.label}>Grind:</Text>
          <TextInput
            style={styles.input}
            value={grind}
            onChangeText={setGrind}
            placeholder="Enter grind"
            placeholderTextColor="#888"
          />
          <Text style={styles.label}>Length:</Text>
          <TextInput
            style={styles.input}
            value={length}
            onChangeText={setLength}
            placeholder="Enter length"
            keyboardType="numeric"
            placeholderTextColor="#888"
          />
          <Text style={styles.label}>Name:</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter name"
            placeholderTextColor="#888"
          />
          <Text style={styles.label}>Flex:</Text>
          <TextInput
            style={styles.input}
            value={flex}
            onChangeText={setFlex}
            placeholder="Enter flex"
            keyboardType="numeric"
            placeholderTextColor="#888"
          />
          <Text style={styles.label}>Notes (optional):</Text>
          <TextInput
            style={styles.input}
            value={notes}
            onChangeText={setNotes}
            placeholder="Enter notes"
            placeholderTextColor="#888"
          />
          {submitting ? (
            <ActivityIndicator color="#fff" style={styles.spinner} />
          ) : (
            <SkiSaveButton onPress={handleSubmit} />
          )}
        </View>
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
  scrollViewContent: {
    width: '100%',
    backgroundColor: 'black',
  },
  infoContainer: {
    width: '100%',
    height: '100%',
    paddingHorizontal: 16,
    paddingBottom: 80,
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
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    color: 'white',
    paddingLeft: 10,
    borderRadius: 6,
  },
  label: {
    color: 'white',
    fontSize: 16,
    marginTop: 10,
  },
  spinner: {
    marginTop: 20,
  },
});

export default AddSkiForm;
