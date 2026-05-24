import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Modal,
  Button,
} from 'react-native';

import testData from '../testingdata.json';
import Footer from '../components/footer';

const NUMERIC_FIELDS = new Set(['weight', 'height']);
const SECURE_FIELDS = new Set(['password']);

const keyboardTypeFor = field => {
  if (NUMERIC_FIELDS.has(field)) {
    return 'numeric';
  }
  if (field === 'email') {
    return 'email-address';
  }
  return 'default';
};

const ProfileScreen = ({route}) => {
  // Phase 3 swaps in useAuth(); for Phase 1 we still derive uid from route params.
  const userId = route?.params?.userId || 'user1';

  const user = testData.users.find(u => u.id === userId);
  const [profile, setProfile] = useState(user);
  const [editField, setEditField] = useState(null);
  const [tempValue, setTempValue] = useState('');

  useEffect(() => {
    setProfile(testData.users.find(u => u.id === userId));
  }, [userId]);

  const handleSave = () => {
    setProfile(prev => ({...prev, [editField]: tempValue}));
    setEditField(null);
  };

  const renderProfileField = (label, field) => {
    return (
      <View style={styles.profileField} key={field}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldValue}>
          {SECURE_FIELDS.has(field)
            ? '•'.repeat(8)
            : profile && profile[field] !== undefined
            ? String(profile[field])
            : ''}
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Edit ${label}`}
          style={styles.editButton}
          onPress={() => {
            const fieldValue =
              profile && profile[field] !== undefined
                ? String(profile[field])
                : '';
            setTempValue(SECURE_FIELDS.has(field) ? '' : fieldValue);
            setEditField(field);
          }}>
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const isSecure = SECURE_FIELDS.has(editField);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.profileHeader}>
          <Image
            source={require('../assets/profile.png')}
            style={styles.profileImage}
            accessibilityElementsHidden={true}
            importantForAccessibility="no"
          />
          <Text style={styles.profileName}>{profile?.email || userId}</Text>
          <Text style={styles.profileLocation}>
            📍 Location: {profile?.location || '—'}
          </Text>
          <Text style={styles.profileEmail}>
            ✉️ Email: {profile?.email || '—'}
          </Text>
        </View>

        {renderProfileField('Weight (kg):', 'weight')}
        {renderProfileField('Height:', 'height')}
        {renderProfileField('Team:', 'team')}
        {renderProfileField('Location:', 'location')}
        {renderProfileField('Password:', 'password')}

        {editField && (
          <Modal
            animationType="slide"
            transparent={true}
            visible={!!editField}
            onRequestClose={() => setEditField(null)}>
            <View style={styles.centeredView}>
              <View style={styles.modalView}>
                <TextInput
                  style={styles.modalInput}
                  value={tempValue}
                  onChangeText={text => setTempValue(text)}
                  secureTextEntry={isSecure}
                  keyboardType={keyboardTypeFor(editField)}
                  autoCapitalize={
                    editField === 'email' || isSecure ? 'none' : 'sentences'
                  }
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'black',
  },
  scrollView: {},
  profileHeader: {
    alignItems: 'center',
    backgroundColor: '#282828',
    paddingBottom: 20,
  },
  profileImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    marginTop: 20,
    borderColor: 'white',
    borderWidth: 3,
  },
  profileName: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
  },
  profileLocation: {
    color: 'white',
    fontSize: 16,
    marginTop: 5,
  },
  profileEmail: {
    color: 'white',
    fontSize: 16,
    marginTop: 5,
  },
  profileField: {
    backgroundColor: '#282828',
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 10,
  },
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
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: 'grey',
    borderRadius: 5,
    padding: 10,
    color: 'black',
    fontSize: 16,
    width: '100%',
  },
  fieldLabel: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  fieldValue: {
    fontSize: 14,
    color: '#aaa',
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
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;
