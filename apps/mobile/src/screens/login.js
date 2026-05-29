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
import {isValidEmail} from '@nordicfleet/core';
import {colors, spacing, typography} from '../theme';

const mapAuthError = code => {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Wrong email or password';
    case 'auth/invalid-email':
      return 'Please enter a valid email';
    case 'auth/network-request-failed':
      return 'No connection — please try again';
    case 'auth/too-many-requests':
      return 'Too many attempts, try again in a minute';
    case 'auth/user-disabled':
      return 'This account has been disabled';
    case 'auth/keychain-error':
      // The device couldn't reach the secure keychain Firebase Auth uses
      // to persist the session. Usually transient.
      return "Couldn't access secure storage — restart the app and try again";
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
    if (!isValidEmail(email)) {
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
      // Keep the real Firebase code visible in dev so a future failure
      // isn't hidden behind the friendly copy (the bug this whole flow
      // exists to prevent).
      console.warn('[auth] sign-in failed:', err && err.code);
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
              autoComplete="email"
              textContentType="username"
              autoCorrect={false}
            />
            <View style={styles.fieldSpacerLg} />
            <Input
              label="Password"
              icon="lock-closed-outline"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
              textContentType="password"
              autoCorrect={false}
            />

            <View style={styles.forgotRow}>
              <Button
                variant="ghost"
                size="sm"
                onPress={() => navigation.navigate('ForgotPassword')}
                accessibilityLabel="Forgot password">
                Forgot password?
              </Button>
            </View>

            {!!error && <Text style={styles.error}>{error}</Text>}

            <View style={styles.fieldSpacerXl} />
            <Button
              variant="primary"
              size="lg"
              fullWidth
              loading={submitting}
              icon="log-in-outline"
              onPress={handleLogin}>
              Sign in
            </Button>
            <View style={styles.fieldSpacerSm} />
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
  forgotRow: {
    alignSelf: 'flex-end',
    marginTop: spacing.sm,
    marginRight: -spacing.md,
  },
  fieldSpacerLg: {height: spacing.lg},
  fieldSpacerXl: {height: spacing.xl},
  fieldSpacerSm: {height: spacing.sm},
});

export default LoginScreen;
