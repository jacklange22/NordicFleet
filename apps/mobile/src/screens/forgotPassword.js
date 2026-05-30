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
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useAuth} from '../context/AuthContext';
import {Header, Input, Button} from '../components/ui';
import {isValidEmail} from '@nordicfleet/core';
import {colors, spacing, typography} from '../theme';

const mapResetError = code => {
  switch (code) {
    case 'auth/user-not-found':
      return 'No account found with that email';
    case 'auth/invalid-email':
      return 'Please enter a valid email';
    case 'auth/network-request-failed':
      return 'No connection - please try again';
    case 'auth/too-many-requests':
      return 'Too many attempts, try again in a minute';
    default:
      return "Couldn't send reset email, please try again";
  }
};

const ForgotPasswordScreen = ({navigation}) => {
  const {sendPasswordResetEmail} = useAuth();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sentTo, setSentTo] = useState('');

  const handleSubmit = async () => {
    setError('');
    const trimmed = email.trim();
    if (!isValidEmail(trimmed)) {
      setError('Please enter a valid email');
      return;
    }
    setSubmitting(true);
    try {
      await sendPasswordResetEmail(trimmed);
      setSentTo(trimmed);
    } catch (err) {
      setError(mapResetError(err && err.code));
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackToSignIn = () => {
    if (navigation?.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Login');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <Header title="Reset password" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled">
          {sentTo ? (
            <View style={styles.successWrap}>
              <View style={styles.successBadge}>
                <Ionicons
                  name="checkmark-circle"
                  size={48}
                  color={colors.success}
                />
              </View>
              <Text style={styles.title}>Check your email</Text>
              <Text style={styles.subtitle}>
                We sent a reset link to {sentTo}. Tap the link to choose a
                new password.
              </Text>
              <View style={styles.successAction}>
                <Button
                  variant="ghost"
                  size="md"
                  fullWidth
                  icon="arrow-back"
                  onPress={handleBackToSignIn}
                  accessibilityLabel="Back to sign in">
                  Back to sign in
                </Button>
              </View>
            </View>
          ) : (
            <>
              <View style={styles.intro}>
                <Text style={styles.title}>Forgot your password?</Text>
                <Text style={styles.subtitle}>
                  Enter your email and we'll send you a reset link.
                </Text>
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

                {!!error && <Text style={styles.error}>{error}</Text>}

                <View style={styles.actionSpacer} />
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  icon="mail-unread-outline"
                  loading={submitting}
                  onPress={handleSubmit}
                  accessibilityLabel="Send reset link">
                  Send reset link
                </Button>
                <View style={styles.bottomSpacer} />
                <Button
                  variant="ghost"
                  size="md"
                  fullWidth
                  onPress={handleBackToSignIn}>
                  Back to sign in
                </Button>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.bg},
  flex: {flex: 1},
  scroll: {
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing['3xl'],
    paddingBottom: spacing['4xl'],
    flexGrow: 1,
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
    lineHeight: 22,
  },
  form: {},
  error: {
    ...typography.body,
    color: colors.red,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  actionSpacer: {height: spacing.xl},
  bottomSpacer: {height: spacing.sm},

  successWrap: {
    alignItems: 'center',
    paddingTop: spacing['3xl'],
  },
  successBadge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.32)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  successAction: {
    marginTop: spacing['2xl'],
    alignSelf: 'stretch',
  },
});

export default ForgotPasswordScreen;
