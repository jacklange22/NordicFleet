import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {useAuth} from '../context/AuthContext';
import {updateProfile, setCoachByEmail} from '../services/userService';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * RoleSelectScreen — shown immediately after Signup. The user picks
 * athlete or coach; athletes may optionally enter their coach's email
 * to link up automatically.
 *
 * On commit, the profile's `role` (and `athleteIds=[]` for coaches) are
 * persisted, and the user is routed to Home (athlete) or CoachDashboard
 * (coach).
 */
const RoleSelectScreen = ({navigation}) => {
  const {user} = useAuth();
  const [role, setRole] = useState(null); // 'athlete' | 'coach'
  const [coachEmail, setCoachEmail] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (!user) {
      setError('Not signed in');
      return;
    }
    if (!role) {
      setError('Pick athlete or coach');
      return;
    }

    setSubmitting(true);
    try {
      if (role === 'coach') {
        await updateProfile(user.uid, {role: 'coach', athleteIds: []});
        navigation.replace('CoachDashboard');
        return;
      }

      // Athlete path. Update role first so subsequent setCoachByEmail
      // sees the correct shape.
      await updateProfile(user.uid, {role: 'athlete'});

      const trimmed = coachEmail.trim();
      if (trimmed) {
        if (!EMAIL_RE.test(trimmed)) {
          setError('Please enter a valid email');
          setSubmitting(false);
          return;
        }
        try {
          await setCoachByEmail(user.uid, trimmed);
        } catch (err) {
          const code = err && err.code;
          if (code === 'coach/not-found') {
            setError(
              'No account with that email. You can skip this and add a coach later.',
            );
          } else if (code === 'coach/not-a-coach') {
            setError('That account is not a coach.');
          } else if (code === 'coach/self-link') {
            setError('You cannot be your own coach.');
          } else {
            setError('Could not link coach, please try again');
          }
          setSubmitting(false);
          return;
        }
      }
      navigation.replace('Home');
    } catch (err) {
      setError(String(err.message || err));
      setSubmitting(false);
    }
  };

  const handleSkipCoachLink = async () => {
    setError('');
    if (!user) {
      setError('Not signed in');
      return;
    }
    setSubmitting(true);
    try {
      await updateProfile(user.uid, {role: 'athlete'});
      navigation.replace('Home');
    } catch (err) {
      setError(String(err.message || err));
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pick your role</Text>
      <Text style={styles.subtitle}>
        Athletes log their own waxes and tests. Coaches review their athletes'
        fleets read-only.
      </Text>

      <View style={styles.row}>
        <TouchableOpacity
          accessibilityRole="radio"
          accessibilityState={{selected: role === 'athlete'}}
          accessibilityLabel="Athlete"
          style={[styles.choice, role === 'athlete' && styles.choiceSelected]}
          onPress={() => setRole('athlete')}>
          <Text style={styles.choiceText}>Athlete</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="radio"
          accessibilityState={{selected: role === 'coach'}}
          accessibilityLabel="Coach"
          style={[styles.choice, role === 'coach' && styles.choiceSelected]}
          onPress={() => setRole('coach')}>
          <Text style={styles.choiceText}>Coach</Text>
        </TouchableOpacity>
      </View>

      {role === 'athlete' && (
        <>
          <Text style={styles.label}>
            Your coach's email (optional — add it later from Profile)
          </Text>
          <TextInput
            style={styles.input}
            placeholder="coach@example.com"
            placeholderTextColor="#888"
            value={coachEmail}
            onChangeText={setCoachEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!submitting}
          />
        </>
      )}

      {!!error && <Text style={styles.errorText}>{error}</Text>}

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Continue"
        style={[
          styles.button,
          (!role || submitting) && styles.buttonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={!role || submitting}>
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Continue</Text>
        )}
      </TouchableOpacity>

      {role === 'athlete' && !!coachEmail && (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Skip coach link for now"
          onPress={handleSkipCoachLink}
          disabled={submitting}>
          <Text style={styles.linkText}>Skip — add a coach later</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 30,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  choice: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#444',
    marginHorizontal: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  choiceSelected: {
    backgroundColor: '#E53935',
    borderColor: '#E53935',
  },
  choiceText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  label: {
    color: '#bbb',
    fontSize: 14,
    marginTop: 8,
    marginBottom: 6,
  },
  input: {
    height: 44,
    borderColor: '#444',
    borderWidth: 1,
    marginBottom: 12,
    padding: 10,
    color: '#fff',
    borderRadius: 8,
  },
  errorText: {
    color: '#E53935',
    marginBottom: 12,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#E53935',
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  linkText: {
    color: '#bbb',
    textAlign: 'center',
    textDecorationLine: 'underline',
    marginTop: 8,
  },
});

export default RoleSelectScreen;
