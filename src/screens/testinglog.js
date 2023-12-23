import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, Button, ScrollView, CheckBox, SafeAreaView, ImageBackground, TextInput } from 'react-native';
import Dropdown from '../components/dropdown';
import ProfileButton from '../components/profilebutton';
import Footer from '../components/footer';
import testData from '../testingdata.json'; // Ensure you have the correct path
import MultiSelectDropdown from '../components/checkboxDropdown';
import InputField from '../components/inputfield';
import SkiInputComponent from '../components/testInput';
import SkiSaveButton from '../components/skisaveButton';
import { useNavigation } from '@react-navigation/native';

const TestingLogScreen = () => {
  const navigation = useNavigation();
  const getUserSkis = (userId) => {
    const user = testData.users.find(user => user.id === userId);
    return user ? user.skis.map(ski => ski.id) : [];
  };
  
  const userSkis = getUserSkis("user1"); // This will now be an array of ski IDs for user1
  
  const handleSelectionDone = (items) => {
      // Update the state with the selected items
      setSelectedSkis(items);
      console.log(items); // Log the selected items to see if it's correct
      // Optionally, perform other actions like navigating away or updating a server via API
    };

    const getTechniqueBySkiId = (userId, skiId) => {
      // Assuming 'testData' is your data structure
      const user = testData.users.find(user => user.id === userId);
      if (!user) return null;
    
      const ski = user.skis.find(ski => ski.id === skiId);
      return ski ? ski.technique : null;
    };
    
    // Usage
    


  const [selectedSkis, setSelectedSkis] = useState([]); // Array of selected ski IDs
  const [testingLog, setTestingLog] = useState({
    humidity: '',
    temperature: '',
    snowType: '',
    surface: '',
  }); // Testing log data
  const [skiTestEntries, setSkiTestEntries] = useState([]); // Array of ski test entry objects

  // Generate ski test entries for selected skis
  useEffect(() => {
    const generateSkiTestEntries = () => {
      const entries = [];
      for (const ski of selectedSkis) {
        const entry = {
          id: ski,
          ski,
          glidewax: '',
          kickwax: '',
          notes: '',
        };
        entries.push(entry);
      }
      setSkiTestEntries(entries);
    };

    generateSkiTestEntries();
  }, [selectedSkis]);

  const handleSubmit = () => {
    if (testingLog && selectedSkis && skiTestEntries){
    navigation.navigate('Home');
  } else {
      // You can alert the user or show an error message that all fields are required
      alert('Please fill out all the fields.');}
      };

  // Handle changes to testing log data
  const handleTestingLogChange = (field, value) => {
    setTestingLog((prevTestingLog) => ({
      ...prevTestingLog,
      [field]: value,
    }));
  };

  // Handle changes to ski test entry data
  const handleSkiTestEntryChange = (entryId, field, value) => {
    setSkiTestEntries((prevSkiTestEntries) => {
      const updatedEntries = prevSkiTestEntries.map((entry) => {
        if (entry.id === entryId) {
          return {
            ...entry,
            [field]: value,
          };
        }
        return entry;
      });
      return updatedEntries;
    });
  };

  // Submit testing log
  const handleSubmitTestingLog = () => {
    // TODO: Implement API call to submit testing log
    alert('Testing log submitted!');
  };

  const snowOptions = ['Old', 'New', 'Manmade'];
  const SurfaceOptions = ['hardpack','Powder','Corduroy','Slush']

  const handleSnowTypeSelect = (selectedSnowType) => {
    handleTestingLogChange('snowType', selectedSnowType);
  };



  return (
    <SafeAreaView style={styles.safeArea}>
    <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Testing Log</Text>
          <ProfileButton />

        </View>
    </View>
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContentContainer}>
    <View style={styles.dropdownContainer}>
        <Text style={styles.dropdownLabel}>Snow:</Text>
        <Dropdown 
          options={snowOptions} 
          onSelect={handleSnowTypeSelect} 
          placeholder="Choose one"
        />
        <Text style={styles.dropdownLabel}>Surface:</Text>
        <Dropdown 
          options={SurfaceOptions} 
          onSelect={handleSnowTypeSelect} 
          placeholder="Choose one"
        />
        <Text style={styles.dropdownLabel}>Skis:</Text>
      <MultiSelectDropdown items={userSkis} onSelectionDone={handleSelectionDone} label={'Select Skis Tested'} />
      <Text style={styles.dropdownLabel}>Temperature:</Text>
      <InputField
  placeholder="Enter temperature"
  keyboardType="numeric" // For numeric input
  onChangeText={(text) => console.log('Temperature:', text)}
  value={testingLog.temperature} // You should have a state variable to manage this value
/>
<Text style={styles.dropdownLabel}>Humidity:</Text>
<InputField
  placeholder="Enter humidity"
  keyboardType="numeric" // For numeric input
  onChangeText={(text) => console.log('Humidity:', text)}
  value={testingLog.humidity} // You should have a state variable to manage this value
/>
<Text style={styles.dropdownLabel}>Tests:</Text>
{/*<SkiInputComponent ski = "117" technique = "Classic" />
<SkiInputComponent ski = "334" technique = "Skate" />*/}
{selectedSkis.map((skiId) => {
          const technique = getTechniqueBySkiId('user1',skiId);
          console.log('map',skiId,technique)
          return (
            <SkiInputComponent
              key={skiId}
              ski={skiId}
              technique={technique}
              // Include any other props your SkiInputComponent needs
            />
          );
        })}
      </View>
      <SkiSaveButton onPress={handleSubmit}/>
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
            backgroundColor: '#000', // Match the background color with the rest of the screen if needed
          },

        container: {
          paddingHorizontal: 0,
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
        dropdownContainer: {
          paddingHorizontal: 10,
          paddingVertical: 20,
          textAlignVertical : 'center',
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
            position: 'absolute', // Position your footer absolutely
            left: 0,
            right: 0,
            bottom: 35, // At the bottom of the SafeAreaView
            // Add any additional styling for your footer
          },
          scrollView: {
            // Styles for the ScrollView itself
            flex: 1,
          },
          scrollContentContainer: {
            paddingBottom: 100, // Or any value that gives you the desired scroll space
            paddingTop: 0,
          },
      });

export default TestingLogScreen;