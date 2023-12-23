import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Image, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Modal, Button } from 'react-native';

// Import your testData from a local JSON file or a backend service
import testData from '../testingdata.json'; // Ensure you have the correct path
import Footer from '../components/footer';

const ProfileScreen = ({ route }) => {
  const { userId } = route.params;
  // rest of your component code
  // Load user data from testData
  const user = testData.users.find(u => u.id === userId);
  
  // UseState hooks to manage user data and edit mode
  const [profile, setProfile] = useState(user);
  const [editField, setEditField] = useState(null);
  const [tempValue, setTempValue] = useState('');
  const [isSecureEntry, setIsSecureEntry] = useState(false);


  // UseEffect hook to set profile data when userId changes
  useEffect(() => {
    setProfile(testData.users.find(u => u.id === userId));
  }, [userId]);

  // Function to handle saving edited data
  const handleSave = () => {
    // Normally here you would make an API call to update user data on the server
    setProfile({ ...profile, [editField]: tempValue });
    setEditField(null); // Exit edit mode
  };

  // Function to render editable profile field
  const renderProfileField = (label, field, isSecureEntry = false) => {
    return (
      <View style={styles.profileField}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldValue}>{profile[field]}</Text>
        <TouchableOpacity
  style={styles.editButton}
  onPress={() => {
    const fieldValue = profile[field] !== undefined ? profile[field].toString() : '';
    setTempValue(fieldValue);
    setEditField(field);
  }}
>
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.profileHeader}>
          <Image source={require('../assets/profile.png')} style={styles.profileImage} />
          <Text style={styles.profileName}>{userId}</Text>
          <Text style={styles.profileLocation}>📍 Location: {userId.Location}</Text>
          <Text style={styles.profileEmail}>✉️ Email: {userId.email}</Text>
        </View>

        {/* Render profile fields */}
        {renderProfileField('Weight (kg):', 'weight')}
        {renderProfileField('Height:', 'height')}
        {renderProfileField('Password:', 'password', true)}

        {/* ... Add other profile fields here ... */}
        
        {/* Modal for editing profile fields */}
        {editField && (
          <Modal
            animationType="slide"
            transparent={true}
            visible={!!editField}
            onRequestClose={() => setEditField(null)}
          >
            <View style={styles.centeredView}>
              <View style={styles.modalView}>
              <TextInput
    style={styles.modalInput}
    value={tempValue}
    onChangeText={text => setTempValue(text)}
    secureTextEntry={isSecureEntry} // Use this only if you're editing a password or secure field
    keyboardType={isSecureEntry ? 'default' : 'numeric'}
  />
                <Button title="Save" onPress={handleSave} />
              </View>
            </View>
          </Modal>
        )}
      </ScrollView>
      <Footer />
    </SafeAreaView>
  );
};

// Add your styles here
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'black', // Sets the background color of the entire safe area
  },
  scrollView: {
    // If you need specific styling for the ScrollView, add here
  },
  profileHeader: {
    alignItems: 'center', // Centers the profile header content
    backgroundColor: '#282828', // Matches the profile header background color
    paddingBottom: 20, // Adds some padding at the bottom of the profile header
  },
  profileImage: {
    width: 140, // Adjust the size of the image as needed
    height: 140, // Make sure the height matches the width for a circle
    borderRadius: 70, // Half the width/height to make the image round
    marginTop: 20, // Adds space at the top inside the safe area
    borderColor: 'white', // If there is a border around the image
    borderWidth: 3, // Adjust the border width as needed
  },
  profileName: {
    color: 'white', // Sets the text color
    fontSize: 24, // Adjust the size as needed
    fontWeight: 'bold', // Makes the name bold
    marginTop: 10, // Adds space between the image and the name
  },
  profileLocation: {
    color: 'white', // Sets the text color
    fontSize: 16, // Adjust the size as needed
    marginTop: 5, // Adds space between the name and the location
  },
  profileEmail: {
    color: 'white', // Sets the text color
    fontSize: 16, // Adjust the size as needed
    marginTop: 5, // Adds space between the location and the email
  },
  profileField: {
    backgroundColor: '#282828', // Matches the profile fields background color
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginHorizontal: 20, // Adds horizontal space from the screen edges
    marginVertical: 10, // Adds space between each profile field
    borderRadius: 10, // Rounds the corners of the fields
  },
  // ... your other styles ...

  // Style for modal views
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  modalInput: {
    // Style for input inside modal
    // Adjust as needed based on your design
    borderWidth: 1,
    borderColor: 'grey',
    borderRadius: 5,
    padding: 10,
    color: 'black',
    fontSize: 16,
    width: '100%', // You may want to make the input full width of the modal
  },
  fieldLabel: {
    fontSize: 16,
    color: 'white', // White text color for the field label
    fontWeight: 'bold',
    marginBottom: 5,
  },
  fieldValue: {
    fontSize: 14,
    color: '#aaa', // Lighter grey text color for the field value
  },
  editButton: {
    backgroundColor: 'red', // Red background for the edit button
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-end', // Align button to the right
  },
  editButtonText: {
    color: 'white', // White text color for the edit button text
    fontSize: 14,
    fontWeight: 'bold',
  },
  // ... any additional styles ...
});

{/*const styles = StyleSheet.create({
   
    fieldLabel: {
      fontSize: 18,
      color: 'white',
      fontWeight: 'bold',
    },
    fieldValue: {
      fontSize: 16,
      color: 'white',
    },
    editButton: {
      backgroundColor: 'red',
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 20,
      alignSelf: 'flex-end',
    },
    editButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: 'bold',
    },
    footer: {
      backgroundColor: '#282828', // Set the background color for the footer
      padding: 10,
      borderTopWidth: 1,
      borderColor: '#ccc',
    },
    footerText: {
      textAlign: 'center',
      color: '#333',
    },
    // ... Your other styles ...
  
  profileField: {
    backgroundColor: '#333', // Assuming a dark grey background
    paddingVertical: 15, // Adjust to match the padding seen in the image
    paddingHorizontal: 20, // Adjust to match the padding seen in the image
    marginVertical: 10, // Space between fields
    borderRadius: 10, // Adjust if the corners are more rounded in the image
  },
  editButton: {
    backgroundColor: 'red', // The button color appears to be red
    paddingHorizontal: 20, // Horizontal padding, adjust to match the image
    paddingVertical: 10, // Vertical padding, adjust to match the image
    borderRadius: 20, // Rounded corners, adjust to match the image
    alignSelf: 'flex-end', // Align to the right side of the container
  },
  editButtonText: {
    color: 'white', // The button text color appears to be white
    fontSize: 16, // Adjust to match the size in the image
    fontWeight: 'bold', // The text appears bold
  },
  fieldLabel: {
    fontSize: 16,
    color: 'white', // White text color for the field label
    fontWeight: 'bold',
    marginBottom: 5,
  },
  fieldValue: {
    fontSize: 14,
    color: '#aaa', // Lighter grey text color for the field value
  },
  editButton: {
    backgroundColor: 'red', // Red background for the edit button
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-end', // Align button to the right
  },
  editButtonText: {
    color: 'white', // White text color for the edit button text
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: 'grey', // Grey border color for the input inside modal
    borderRadius: 5,
    padding: 10,
    color: 'black', // Black text color for input
    fontSize: 16,
  },

  // ... Any additional styles for modal, buttons, etc. ...
});*/}


export default ProfileScreen;
