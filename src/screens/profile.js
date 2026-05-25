import React, {useState, useCallback} from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Modal,
  Pressable,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import Toast from 'react-native-toast-message';
import LoadingScreen from '../components/LoadingScreen';
import {useAuth} from '../context/AuthContext';
import useProfile from '../hooks/useProfile';
import useSkis from '../hooks/useSkis';
import useDashboardStats from '../hooks/useDashboardStats';
import {updateProfile} from '../services/userService';
import {seedCurrentUser} from '../services/seed';
import {auth} from '../services/firebase';
import {
  Header,
  Card,
  Avatar,
  StatCard,
  ListItem,
  SectionHeader,
  Button,
  Input,
  TabBar,
} from '../components/ui';
import {colors, radius, spacing, typography} from '../theme';

const NUMERIC_FIELDS = new Set(['weight', 'height']);

const FIELD_DEFS = [
  {key: 'weight', label: 'Weight', suffix: ' kg', icon: 'barbell-outline'},
  {key: 'height', label: 'Height', suffix: ' cm', icon: 'resize-outline'},
  {key: 'team', label: 'Team', icon: 'people-outline'},
  {key: 'location', label: 'Location', icon: 'location-outline'},
];

const keyboardTypeFor = field => {
  if (NUMERIC_FIELDS.has(field)) {
    return 'numeric';
  }
  return 'default';
};

const fieldDisplay = (def, profile) => {
  const v = profile?.[def.key];
  if (v === undefined || v === null || v === '') {
    return '—';
  }
  return `${v}${def.suffix || ''}`;
};

const ProfileScreen = () => {
  const navigation = useNavigation();
  const {user, signOut} = useAuth();
  const uid = user?.uid;

  const {profile, loading} = useProfile(uid);
  const {skis} = useSkis(uid);
  const {totalWaxes, totalTests} = useDashboardStats(uid);

  const [editField, setEditField] = useState(null);
  const [tempValue, setTempValue] = useState('');
  const [seeding, setSeeding] = useState(false);

  // Password change flow.
  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSubmitting, setPwSubmitting] = useState(false);

  const openEdit = def => {
    const v = profile?.[def.key];
    setTempValue(v !== undefined && v !== null ? String(v) : '');
    setEditField(def);
  };

  const handleSave = useCallback(async () => {
    if (!editField || !uid) {
      setEditField(null);
      return;
    }
    const next = NUMERIC_FIELDS.has(editField.key)
      ? tempValue === ''
        ? null
        : Number(tempValue)
      : tempValue;
    try {
      await updateProfile(uid, {[editField.key]: next});
      Toast.show({
        type: 'success',
        text1: 'Profile updated',
        text2: editField.label,
        position: 'top',
        visibilityTime: 1800,
      });
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

  if (loading) {
    return <LoadingScreen label="Loading profile…" />;
  }

  const isCoach = profile?.role === 'coach';
  const role = isCoach ? 'coach' : 'athlete';
  const displayName =
    profile?.name ||
    profile?.displayName ||
    profile?.email ||
    user?.email ||
    '';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <Header
        title="Profile"
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Settings"
            onPress={() => {}}
            hitSlop={8}
            style={({pressed}) => pressed && {opacity: 0.6}}>
            <Ionicons
              name="settings-outline"
              size={22}
              color={colors.textPrimary}
            />
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Hero */}
        <View style={styles.hero}>
          <Avatar
            uri={profile?.image}
            name={displayName}
            size={80}
          />
          <Text style={styles.heroName} numberOfLines={1}>
            {displayName || '—'}
          </Text>
          <Text style={styles.heroEmail} numberOfLines={1}>
            {profile?.email || user?.email || '—'}
          </Text>
        </View>

        {/* Stat row — athlete only */}
        {!isCoach && (
          <View style={styles.statRow}>
            <View style={styles.statCell}>
              <StatCard compact value={skis.length} label="Skis" />
            </View>
            <View style={styles.statCellSpacer} />
            <View style={styles.statCell}>
              <StatCard compact value={totalWaxes} label="Wax logs" />
            </View>
            <View style={styles.statCellSpacer} />
            <View style={styles.statCell}>
              <StatCard compact value={totalTests} label="Tests" />
            </View>
          </View>
        )}

        {/* Personal info */}
        <SectionHeader title="Personal info" />
        <Card padding={0}>
          {FIELD_DEFS.map((def, i) => (
            <View key={def.key} style={styles.rowOuter}>
              <ListItem
                icon={def.icon}
                title={`${def.label} (${def.suffix?.trim() || ''})`.replace(
                  / \(\)$/,
                  '',
                )}
                subtitle={fieldDisplay(def, profile)}
                onPress={() => openEdit(def)}
                accessibilityLabel={`Edit ${def.label}${
                  def.suffix ? ` (${def.suffix.trim()}):` : ''
                }`}
                right={
                  <Text style={styles.editAction}>Edit</Text>
                }
                showDivider={i < FIELD_DEFS.length - 1}
                chevron={false}
              />
            </View>
          ))}
        </Card>

        {/* Coach section — athletes only */}
        {!isCoach && (
          <>
            <SectionHeader title="Coach" />
            <Card padding={0}>
              <View style={styles.rowOuter}>
                {profile?.coachUid ? (
                  <ListItem
                    leading={
                      <Avatar
                        name={profile.coachName || profile.coachEmail || ''}
                        size={32}
                      />
                    }
                    title={profile.coachName || profile.coachEmail || 'Coach'}
                    subtitle={
                      profile.coachEmail && profile.coachName
                        ? profile.coachEmail
                        : 'Linked coach'
                    }
                    right={<Text style={styles.editAction}>Change</Text>}
                    onPress={() => {}}
                    accessibilityLabel="Change coach"
                    chevron={false}
                  />
                ) : (
                  <ListItem
                    icon="add-circle-outline"
                    title="Add a coach"
                    subtitle="Share your fleet with a coach"
                    onPress={() => {}}
                    accessibilityLabel="Add a coach"
                  />
                )}
              </View>
            </Card>
          </>
        )}

        {/* Account */}
        <SectionHeader title="Account" />
        <Card padding={0}>
          <View style={styles.rowOuter}>
            <ListItem
              icon="key-outline"
              title="Change password"
              onPress={() => setPwModalOpen(true)}
              accessibilityLabel="Change password"
              showDivider
            />
          </View>
          <View style={styles.rowOuter}>
            <ListItem
              icon="log-out-outline"
              iconColor={colors.red}
              title="Sign out"
              destructive
              onPress={handleSignOut}
              accessibilityLabel="Sign out"
              chevron={false}
            />
          </View>
        </Card>

        {__DEV__ && (
          <View style={styles.devRow}>
            <Button
              variant="secondary"
              size="md"
              icon="leaf-outline"
              loading={seeding}
              onPress={handleSeed}>
              Seed sample data
            </Button>
          </View>
        )}
      </ScrollView>

      {/* Edit-field modal */}
      <Modal
        animationType="fade"
        transparent
        visible={!!editField}
        onRequestClose={() => setEditField(null)}>
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {editField ? `Edit ${editField.label}` : ''}
            </Text>
            {editField && (
              <Input
                label={editField.label}
                icon={editField.icon}
                value={tempValue}
                onChangeText={setTempValue}
                keyboardType={keyboardTypeFor(editField.key)}
                autoCapitalize={
                  editField.key === 'location' || editField.key === 'team'
                    ? 'words'
                    : 'sentences'
                }
              />
            )}
            <View style={styles.modalActions}>
              <View style={styles.modalActionCell}>
                <Button
                  variant="ghost"
                  size="md"
                  fullWidth
                  onPress={() => setEditField(null)}>
                  Cancel
                </Button>
              </View>
              <View style={styles.modalActionCell}>
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  icon="checkmark"
                  onPress={handleSave}>
                  Save
                </Button>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Password modal */}
      <Modal
        animationType="fade"
        transparent
        visible={pwModalOpen}
        onRequestClose={() => setPwModalOpen(false)}>
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Change password</Text>
            <Input
              label="Current password"
              icon="lock-closed-outline"
              value={currentPw}
              onChangeText={setCurrentPw}
              secureTextEntry
              autoCapitalize="none"
            />
            <View style={{height: spacing.md}} />
            <Input
              label="New password"
              icon="key-outline"
              value={newPw}
              onChangeText={setNewPw}
              secureTextEntry
              autoCapitalize="none"
              error={pwError || undefined}
            />
            <View style={styles.modalActions}>
              <View style={styles.modalActionCell}>
                <Button
                  variant="ghost"
                  size="md"
                  fullWidth
                  disabled={pwSubmitting}
                  onPress={() => {
                    setPwModalOpen(false);
                    setCurrentPw('');
                    setNewPw('');
                    setPwError('');
                  }}>
                  Cancel
                </Button>
              </View>
              <View style={styles.modalActionCell}>
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  icon="checkmark"
                  loading={pwSubmitting}
                  onPress={handlePasswordSubmit}>
                  Update
                </Button>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <TabBar role={role} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.bg},
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  hero: {
    alignItems: 'center',
    paddingBottom: spacing.xl,
  },
  heroName: {
    ...typography.displayMd,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  heroEmail: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  statRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  statCell: {flex: 1},
  statCellSpacer: {width: spacing.sm},

  rowOuter: {
    paddingHorizontal: spacing.lg,
  },
  editAction: {
    ...typography.bodySm,
    color: colors.red,
    fontWeight: '600',
  },
  devRow: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  modalCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
  },
  modalTitle: {
    ...typography.displayMd,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: spacing.xl,
  },
  modalActionCell: {flex: 1, marginHorizontal: spacing.xs},
});

export default ProfileScreen;
