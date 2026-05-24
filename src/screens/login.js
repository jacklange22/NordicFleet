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
      navigation.replace('Home');
    } catch (err) {
      setError(mapAuthError(err && err.code));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <Header title="Sign in" />
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled">
          <View style={styles.intro}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Pick up where you left off.</Text>
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

            {!!error && <Text style={styles.error}>{error}</Text>}

            <View style={{height: spacing.xl}} />
            <Button
              variant="primary"
              size="lg"
              fullWidth
              loading={submitting}
              icon="log-in-outline"
              onPress={handleLogin}>
              Sign in
            </Button>
            <View style={{height: spacing.sm}} />
            <Button
              variant="ghost"
              size="md"
              fullWidth
              onPress={() => navigation.navigate('Signup')}>
              Don't have an account? Create one
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

export default LoginScreen;
