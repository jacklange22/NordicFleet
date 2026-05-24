import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAuth} from '../context/AuthContext';
import {Header, Input, Button} from '../components/ui';
import {colors, spacing, typography} from '../theme';

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
      navigation.replace('RoleSelect');
    } catch (err) {
      setError(mapSignupError(err && err.code));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <Header title="Create account" />
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled">
          <View style={styles.intro}>
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>Start tracking your fleet.</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Email"
              icon="mail-outline"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={{height: spacing.lg}} />
            <Input
              label="Password"
              icon="lock-closed-outline"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
            <View style={{height: spacing.lg}} />
            <Input
              label="Confirm Password"
              icon="lock-closed-outline"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            {!!error && <Text style={styles.error}>{error}</Text>}

            <View style={{height: spacing.xl}} />
            <Button
              variant="primary"
              size="lg"
              fullWidth
              loading={submitting}
              icon="person-add-outline"
              onPress={handleSignup}>
              Sign up
            </Button>
            <View style={{height: spacing.sm}} />
            <Button
              variant="ghost"
              size="md"
              fullWidth
              onPress={() => navigation.navigate('Login')}>
              Already have an account? Sign in
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.bg},
  scroll: {
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing['3xl'],
    paddingBottom: spacing['4xl'],
  },
  intro: {marginBottom: spacing['3xl']},
  title: {
    ...typography.displayMd,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.bodyLg,
    color: colors.textSecondary,
  },
  form: {},
  error: {
    ...typography.body,
    color: colors.red,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
});

export default SignupScreen;
