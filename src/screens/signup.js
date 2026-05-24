import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import {useAuth} from '../context/AuthContext';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const mapSignupError = code => {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with that email already exists';
    case 'auth/weak-password':
      return 'Password is too weak';
    case 'auth/network-request-failed':
      return 'No connection — please try again';
    case 'auth/too-many-requests':
      return 'Too many attempts, try again in a minute';
    case 'auth/invalid-email':
      return 'Please enter a valid email';
    default:
      return 'Sign-up failed, please try again';
  }
};

const SignupScreen = ({navigation}) => {
  const {signUp} = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async () => {
    setError('');
    if (!EMAIL_RE.test(email)) {
      setError('Please enter a valid email');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setSubmitting(true);
    try {
      await signUp(email.trim(), password);
      navigation.replace('Home');
    } catch (err) {
      setError(mapSignupError(err && err.code));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/nordicfleet.png')}
        style={styles.logo}
        accessibilityElementsHidden={true}
        importantForAccessibility="no"
      />
      <Text style={styles.title}>Create account</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!submitting}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#888"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!submitting}
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        placeholderTextColor="#888"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        editable={!submitting}
      />
      {!!error && <Text style={styles.errorText}>{error}</Text>}

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Sign up"
        style={[styles.button, submitting && styles.buttonDisabled]}
        onPress={handleSignup}
        disabled={submitting}>
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign up</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Go to Login"
        onPress={() => navigation.navigate('Login')}>
        <Text style={styles.linkText}>Already have an account? Log in</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#000',
  },
  logo: {
    width: '100%',
    height: undefined,
    aspectRatio: 1298 / 852,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    height: 44,
    borderColor: '#444',
    borderWidth: 1,
    marginBottom: 16,
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
    opacity: 0.6,
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

export default SignupScreen;
