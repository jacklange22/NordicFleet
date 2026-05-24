import React, {useState, useCallback} from 'react';
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
  Alert,
  ActivityIndicator,
} from 'react-native';

import {useNavigation} from '@react-navigation/native';
import Footer from '../components/footer';
import LoadingScreen from '../components/LoadingScreen';
import {useAuth} from '../context/AuthContext';
import useProfile from '../hooks/useProfile';
import {updateProfile} from '../services/userService';
import {seedCurrentUser} from '../services/seed';
import {auth} from '../services/firebase';

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

const ProfileScreen = () => {
  const navigation = useNavigation();
  const {user, signOut} = useAuth();
  const uid = user?.uid;

  const {profile, loading} = useProfile(uid);
  const [editField, setEditField] = useState(null);
  const [tempValue, setTempValue] = useState('');
  const [seeding, setSeeding] = useState(false);

  // Password change flow.
  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSubmitting, setPwSubmitting] = useState(false);

  const handleSave = useCallback(async () => {
    if (!editField || !uid) {
      setEditField(null);
      return;
    }
    if (editField === 'password') {
      // Routed through the password modal, not the simple edit modal.
      setEditField(null);
      setPwModalOpen(true);
      return;
    }
    const next = NUMERIC_FIELDS.has(editField)
      ? tempValue === ''
        ? null
        : Number(tempValue)
      : tempValue;
    try {
      await updateProfile(uid, {[editField]: next});
    } catch (err) {
      Alert.alert('Save failed', String(err.message || err));
    } finally {
      setEditField(null);
    }
  }, [editField, tempValue, uid]);

  const handleSignOut = useCallback(() => {
    Alert.alert('Sign out?', 'You will need to log in again next time.', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
            navigation.reset({index: 0, routes: [{name: 'Welcome'}]});
          } catch (err) {
            Alert.alert('Sign-out failed', String(err.message || err));
          }
        },
      },
    ]);
  }, [signOut, navigation]);

  const handleSeed = useCallback(async () => {
    if (!uid) {
      return;
    }
    setSeeding(true);
    try {
      const result = await seedCurrentUser(uid);
      Alert.alert(
        'Seed complete',
        `Created ${result.created}, skipped ${result.skipped}.`,
      );
    } catch (err) {
      Alert.alert('Seed failed', String(err.message || err));
    } finally {
      setSeeding(false);
    }
  }, [uid]);

  const handlePasswordSubmit = useCallback(async () => {
    setPwError('');
    if (newPw.length < 6) {
      setPwError('New password must be at least 6 characters');
      return;
    }
    const currentUser = auth().currentUser;
    if (!currentUser || !currentUser.email) {
      setPwError('Not signed in');
      return;
    }
    setPwSubmitting(true);
    try {
      const cred = auth.EmailAuthProvider.credential(
        currentUser.email,
        currentPw,
      );
      await currentUser.reauthenticateWithCredential(cred);
      await currentUser.updatePassword(newPw);
      setPwModalOpen(false);
      setCurrentPw('');
      setNewPw('');
      Alert.alert('Password updated');
    } catch (err) {
      const code = err && err.code;
      if (
        code === 'auth/wrong-password' ||
        code === 'auth/invalid-credential'
      ) {
        setPwError('Current password is incorrect');
      } else if (code === 'auth/weak-password') {
        setPwError('New password is too weak');
      } else if (code === 'auth/network-request-failed') {
        setPwError('No connection — please try again');
      } else {
        setPwError('Could not change password, please try again');
      }
    } finally {
      setPwSubmitting(false);
    }
  }, [currentPw, newPw]);

  const renderProfileField = (label, field) => {
    return (
      <View style={styles.profileField} key={field}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldValue}>
          {SECURE_FIELDS.has(field)
            ? '•'.repeat(8)
            : profile && profile[field] !== undefined && profile[field] !== null
            ? String(profile[field])
            : '—'}
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Edit ${label}`}
          style={styles.editButton}
          onPress={() => {
            if (field === 'password') {
              setPwModalOpen(true);
              return;
            }
            const fieldValue =
              profile && profile[field] !== undefined && profile[field] !== null
                ? String(profile[field])
                : '';
            setTempValue(fieldValue);
            setEditField(field);
          }}>
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const isSecure = SECURE_FIELDS.has(editField);

  if (loading) {
    return <LoadingScreen label="Loading profile…" />;
  }

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
          <Text style={styles.profileName}>
            {profile?.displayName || profile?.email || user?.email || ''}
          </Text>
          <Text style={styles.profileLocation}>
            📍 Location: {profile?.location || '—'}
          </Text>
          <Text style={styles.profileEmail}>
            ✉️ Email: {profile?.email || user?.email || '—'}
          </Text>
        </View>

        {renderProfileField('Weight (kg):', 'weight')}
        {renderProfileField('Height:', 'height')}
        {renderProfileField('Team:', 'team')}
        {renderProfileField('Location:', 'location')}
        {renderProfileField('Password:', 'password')}

        {__DEV__ && (
          <View style={styles.seedRow}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Seed sample data"
              style={[styles.seedButton, seeding && styles.disabledButton]}
              onPress={handleSeed}
              disabled={seeding}>
              {seeding ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.seedButtonText}>Seed sample data</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.signOutRow}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Sign out"
            style={styles.signOutButton}
            onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign out</Text>
          </TouchableOpacity>
        </View>

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
                <Button
                  title="Cancel"
                  color="#777"
                  onPress={() => setEditField(null)}
                />
              </View>
            </View>
          </Modal>
        )}

        <Modal
          animationType="slide"
          transparent={true}
          visible={pwModalOpen}
          onRequestClose={() => setPwModalOpen(false)}>
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <Text style={styles.pwTitle}>Change password</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Current password"
                placeholderTextColor="#888"
                value={currentPw}
                onChangeText={setCurrentPw}
                secureTextEntry
                autoCapitalize="none"
              />
              <TextInput
                style={styles.modalInput}
                placeholder="New password"
                placeholderTextColor="#888"
                value={newPw}
                onChangeText={setNewPw}
                secureTextEntry
                autoCapitalize="none"
              />
              {!!pwError && <Text style={styles.pwError}>{pwError}</Text>}
              <Button
                title={pwSubmitting ? 'Saving…' : 'Update password'}
                onPress={handlePasswordSubmit}
                disabled={pwSubmitting}
              />
              <Button
                title="Cancel"
                color="#777"
                onPress={() => {
                  setPwModalOpen(false);
                  setCurrentPw('');
                  setNewPw('');
                  setPwError('');
                }}
              />
            </View>
          </View>
        </Modal>
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
  loading: {
    flex: 1,
  },
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
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 260,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: 'grey',
    borderRadius: 5,
    padding: 10,
    color: 'black',
    fontSize: 16,
    width: '100%',
    marginBottom: 12,
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
  seedRow: {
    alignItems: 'center',
    marginTop: 20,
  },
  seedButton: {
    backgroundColor: '#444',
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 20,
  },
  seedButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  signOutRow: {
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 90,
  },
  signOutButton: {
    backgroundColor: '#E53935',
    paddingHorizontal: 36,
    paddingVertical: 12,
    borderRadius: 24,
  },
  signOutText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  pwTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  pwError: {
    color: '#E53935',
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default ProfileScreen;
