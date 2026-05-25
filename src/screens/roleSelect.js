import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useAuth} from '../context/AuthContext';
import {updateProfile, setCoachByEmail} from '../services/userService';
import {Header, Card, Button, Input} from '../components/ui';
import {colors, spacing, typography} from '../theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RoleCard = ({icon, title, description, selected, onPress}) => (
  <Card
    onPress={onPress}
    accessibilityLabel={title}
    padding={spacing['2xl']}
    style={[
      styles.roleCard,
      selected && {
        borderColor: colors.red,
        backgroundColor: 'rgba(229, 57, 53, 0.06)',
      },
    ]}>
    <View style={styles.roleHeader}>
      <View
        style={[
          styles.roleIcon,
          selected && {backgroundColor: 'rgba(229, 57, 53, 0.16)'},
        ]}>
        <Ionicons name={icon} size={28} color={colors.red} />
      </View>
      <View style={styles.roleCheck}>
        {selected ? (
          <Ionicons name="checkmark-circle" size={26} color={colors.red} />
        ) : (
          <View style={styles.checkRing} />
        )}
      </View>
    </View>
    <Text style={styles.roleTitle}>{title}</Text>
    <Text style={styles.roleDescription}>{description}</Text>
  </Card>
);

const RoleSelectScreen = ({navigation}) => {
  const {user} = useAuth();
  const [role, setRole] = useState(null);
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
        await updateProfile(user.uid, {role: 'coach'});
        navigation.replace('CoachDashboard');
        return;
      }

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
      navigation.replace('Home');
    } catch (err) {
      setError(String(err.message || err));
      setSubmitting(false);
    }
  };

  const handleSkipCoach = async () => {
    setError('');
    if (!user) {
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
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <Header title="Choose your role" />
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled">
          <Text style={styles.intro}>
            How will you use NordicFleet?
          </Text>

          <RoleCard
            icon="person-outline"
            title="Athlete"
            description="Track your fleet, log wax and test sessions, share with your coach."
            selected={role === 'athlete'}
            onPress={() => setRole('athlete')}
          />
          <View style={{height: spacing.md}} />
          <RoleCard
            icon="people-outline"
            title="Coach"
            description="Review your athletes' fleets and waxing history."
            selected={role === 'coach'}
            onPress={() => setRole('coach')}
          />

          {role === 'athlete' && (
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
                You can add or change your coach later in Profile.
              </Text>
            </View>
          )}

          {!!error && <Text style={styles.error}>{error}</Text>}
        </ScrollView>

        <View style={styles.footer}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={!role}
            loading={submitting}
            icon="arrow-forward"
            iconRight
            onPress={handleSubmit}>
            Continue
          </Button>
          {role === 'athlete' && !!coachEmail && (
            <>
              <View style={{height: spacing.sm}} />
              <Button
                variant="ghost"
                size="md"
                fullWidth
                onPress={handleSkipCoach}
                disabled={submitting}>
                Skip — add a coach later
              </Button>
            </>
          )}
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
  },
  roleCard: {},
  roleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  roleIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(229, 57, 53, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleCheck: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkRing: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.borderStrong,
  },
  roleTitle: {
    ...typography.displayMd,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  roleDescription: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  coachBlock: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xs,
  },
  coachLabel: {
    ...typography.caption,
    color: colors.textTertiary,
    marginBottom: spacing.md,
  },
  coachHint: {
    ...typography.bodySm,
    color: colors.textTertiary,
    marginTop: spacing.sm,
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

export default RoleSelectScreen;
