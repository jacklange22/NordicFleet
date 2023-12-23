import React, { useState } from 'react';
import { View, Text, TextInput, Button, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import Dropdown from '../components/dropdown';
import Footer from '../components/footer';
import ProfileButton from '../components/profilebutton';
import SaveButton from '../components/skisaveButton';
import SkiSaveButton from '../components/skisaveButton';
import { useNavigation } from '@react-navigation/native';

const AddSkiForm = () => {
    const navigation = useNavigation();
 const [newbeSki, setNewbeSki] = useState([]);
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

 const handleSubmit = () => {
    if (brand && model && base && build && grind && length && name && flex && notes){
    const ski = {
      brand,
      model,
      base,
      build,
      grind,
      length,
      name,
      flex,
      notes,
      length,
      technique,
    };
    setNewbeSki([...newbeSki, ski]);
    setBrand('');
    setModel('');
    setBase('');
    setBuild('');
    setGrind('');
    setLength('');
    setName('');
    setFlex('');
    setNotes('');
    setTechnique('');
    setType('');
    navigation.navigate('SkiInfo', {
        flex: flex,
        grind: grind,
        brand: brand,
        model: model,
        base: base,
        build: build,
        name: name,
        notes: notes,
        type: type,
        technique, technique,
        length, length,
      } );
    } else {
        // You can alert the user or show an error message that all fields are required
        alert('Please fill out all the fields.');}
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
          options={['Salomon','Atomic','Fisher','Madshus','Rossignol']}
          onSelect={setBrand}
          value={brand}
          />
          <Text style={styles.label}>Model:</Text>
          <TextInput
            style={styles.input}
            value={model}
            onChangeText={setModel}
            placeholder="Enter model"
          />
          <Text style={styles.label}>Base:</Text>
          <TextInput
            style={styles.input}
            value={base}
            onChangeText={setBase}
            placeholder="Enter base"
          />
          <Text style={styles.label}>Technique:</Text>
          <Dropdown placeholder="Technique?" options={['skate','classic']} onSelect={setTechnique} value = {technique}/>
          <Text style={styles.label}>Type:</Text>
          <Dropdown placeholder="Type?" options={['warm','universal','cold','zero']}
          onSelect={setType} value = {type}/>
          <Text style={styles.label}>Build:</Text>
          <TextInput
            style={styles.input}
            value={build}
            onChangeText={setBuild}
            placeholder="Enter build"
          />
          <Text style={styles.label}>Grind:</Text>
          <TextInput
            style={styles.input}
            value={grind}
            onChangeText={setGrind}
            placeholder="Enter grind"
          />
          <Text style={styles.label}>Length:</Text>
          <TextInput
            style={styles.input}
            value={length}
            onChangeText={setLength}
            placeholder="Enter length"
          />
          <Text style={styles.label}>Name:</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter name"
          />
          <Text style={styles.label}>Flex:</Text>
          <TextInput
            style={styles.input}
            value={flex}
            onChangeText={setFlex}
            placeholder="Enter flex"
          />
          <Text style={styles.label}>Notes:</Text>
          <TextInput
            style={styles.input}
            value={notes}
            onChangeText={setNotes}
            placeholder="Enter notes"
          />
          <SkiSaveButton onPress={handleSubmit}/>
        </View>
        <View>
        </View>
      </ScrollView>
      <Footer style={styles.Footer} />
    </SafeAreaView>
 );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#000', // Match the background color with the rest of the screen if needed
      },
 scrollViewContent: {
    width: '100%',
    backgroundColor: 'black',
 },
 infoContainer: {
    width: '100%',
    height: '100%'
 },
 header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16, // Only horizontal padding
    backgroundColor: '#282828', // Set the background color of the header
    height: 50, // Set the height of the header
    // Ensure there is no top margin/padding if you want content against the edges
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
 },
 label: {
    color: 'white',
    fontSize: 16,
    marginTop: 10,
 },
 Footer: {
    flex: 0.1,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: 'grey',
    alignItems: 'center',
    justifyContent: 'center',
 },
});

export default AddSkiForm;

