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

const mapAuthError = code => {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Wrong email or password';
    case 'auth/network-request-failed':
      return 'No connection — please try again';
    case 'auth/too-many-requests':
      return 'Too many attempts, try again in a minute';
    default:
      return 'Sign-in failed, please try again';
  }
};

const LoginScreen = ({navigation}) => {
  const {signIn} = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    if (!EMAIL_RE.test(email)) {
      setError('Please enter a valid email');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      // AuthProvider flips state; AuthLoadingScreen would route. Here we
      // explicitly replace so the user lands on Home immediately.
      navigation.replace('Home');
    } catch (err) {
      setError(mapAuthError(err && err.code));
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
      <Text style={styles.title}>Log in</Text>
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
      {!!error && <Text style={styles.errorText}>{error}</Text>}

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Login"
        style={[styles.button, submitting && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={submitting}>
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Go to Signup"
        onPress={() => navigation.navigate('Signup')}>
        <Text style={styles.linkText}>Don&apos;t have an account? Sign up</Text>
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

export default LoginScreen;
