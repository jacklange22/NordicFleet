import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Switch,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useAuth} from '../context/AuthContext';
import {
  setCoachByEmail,
  setCoachCapability,
} from '../services/userService';
import {Header, Card, Button, Input} from '../components/ui';
import {isValidEmail} from '@nordicfleet/core';
import {colors, spacing, typography} from '../theme';

// Onboarding after signup. The capability model means there's no
// athlete-vs-coach fork: everyone is a skier with a personal fleet.
// We ask the one thing that actually branches the experience — "do
// you coach a team?" — defaulting to no, and offer the optional
// coach link that every user can set.
const OnboardingScreen = ({navigation}) => {
  const {user} = useAuth();
  const [coachesTeam, setCoachesTeam] = useState(false);
  const [coachEmail, setCoachEmail] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const finish = async () => {
    setError('');
    if (!user) {
      setError('Not signed in');
      return;
    }
    setSubmitting(true);
    try {
      // Set the coaching capability (default off).
      await setCoachCapability(user.uid, coachesTeam);

      // Optional coach link — available to everyone, coach or not.
      const trimmed = coachEmail.trim();
      if (trimmed) {
        if (!isValidEmail(trimmed)) {
          setError('Please enter a valid coach email');
          setSubmitting(false);
          return;
        }
        try {
          await setCoachByEmail(user.uid, trimmed);
        } catch (err) {
          const code = err && err.code;
          if (code === 'coach/not-found') {
            setError(
              'No coach account with that email. Skip for now and add a coach later in Profile.',
            );
          } else if (code === 'coach/self-link') {
            setError('You cannot be your own coach.');
          } else {
            setError('Could not link coach, please try again');
          }
          setSubmitting(false);
          return;
        }
      }
      // Everyone lands in their personal fleet first. Coaches can
      // switch to coaching mode from the toggle once they're in.
      navigation.replace('Home');
    } catch (err) {
      setError(String(err.message || err));
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <Header title="Get started" />
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled">
          <Text style={styles.intro}>
            NordicFleet starts with your own fleet — your skis, your wax
            and test logs. A couple of quick things to set up.
          </Text>

          <Card padding={spacing.xl} style={styles.coachToggleCard}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleIcon}>
                <Ionicons name="people-outline" size={24} color={colors.red} />
              </View>
              <View style={styles.toggleText}>
                <Text style={styles.toggleTitle}>Do you coach a team?</Text>
                <Text style={styles.toggleDesc}>
                  Turn this on if you also manage other skiers&apos; fleets.
                  You&apos;ll get a coaching mode you can switch into. You
                  can change this anytime in Profile.
                </Text>
              </View>
              <Switch
                value={coachesTeam}
                onValueChange={setCoachesTeam}
                trackColor={{true: colors.red, false: colors.border}}
                accessibilityLabel="Coach a team"
              />
            </View>
          </Card>

          <View style={styles.coachBlock}>
            <Text style={styles.coachLabel}>Link a coach (optional)</Text>
            <Input
              label="Coach email"
              icon="mail-outline"
              value={coachEmail}
              onChangeText={setCoachEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!submitting}
            />
            <Text style={styles.coachHint}>
              If a coach uses NordicFleet, link them now to share your
              fleet. You can add or change this later in Profile.
            </Text>
          </View>

          {!!error && <Text style={styles.error}>{error}</Text>}
        </ScrollView>

        <View style={styles.footer}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={submitting}
            icon="arrow-forward"
            iconRight
            onPress={finish}>
            Continue to my fleet
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.bg},
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing['3xl'],
  },
  intro: {
    ...typography.bodyLg,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xs,
    lineHeight: 24,
  },
  coachToggleCard: {marginBottom: spacing.xl},
  toggleRow: {flexDirection: 'row', alignItems: 'flex-start'},
  toggleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(229, 57, 53, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  toggleText: {flex: 1, marginRight: spacing.md},
  toggleTitle: {
    ...typography.headingMd,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  toggleDesc: {
    ...typography.bodySm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  coachBlock: {paddingHorizontal: spacing.xs},
  coachLabel: {
    ...typography.caption,
    color: colors.textTertiary,
    marginBottom: spacing.md,
  },
  coachHint: {
    ...typography.bodySm,
    color: colors.textTertiary,
    marginTop: spacing.sm,
    lineHeight: 18,
  },
  error: {
    ...typography.body,
    color: colors.red,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  footer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});

export default OnboardingScreen;
