import React, {useState, useCallback, useEffect, useRef} from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Modal,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Linking,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';

import Toast from 'react-native-toast-message';
import {isValidEmail} from '@nordicfleet/core';
import LoadingScreen from '../components/LoadingScreen';
import {shareSnapshot} from '../services/shareService';
import {exportAndShareUserData} from '../services/dataExportService';
import FleetShareCard from '../components/share/FleetShareCard';
import {useAuth} from '../context/AuthContext';
import useProfile from '../hooks/useProfile';
import useSkis from '../hooks/useSkis';
import useDashboardStats from '../hooks/useDashboardStats';
import {
  updateProfile,
  removeCoach,
  getProfile,
  deleteAccount,
  setCoachCapability,
} from '../services/userService';
import {deriveIsCoach} from '@nordicfleet/core';
import {useMode} from '../context/ModeContext';
import {
  requestCoach,
  cancelRequest,
  subscribeOutgoingRequestsForAthlete,
  syncCoachIdFromRequests,
} from '../services/coachRequestService';
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

// Brief: decimal-pad for weight/height. iOS decimal-pad shows digits +
// the locale's decimal separator (no minus sign — fine for these, since
// negative weight/height isn't meaningful).
const keyboardTypeFor = field => {
  if (NUMERIC_FIELDS.has(field)) {
    return 'decimal-pad';
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
  const {setMode} = useMode();
  const uid = user?.uid;

  const {profile, loading} = useProfile(uid);
  const {skis} = useSkis(uid);
  const {totalWaxes, totalTests} = useDashboardStats(uid);

  const [coachingBusy, setCoachingBusy] = useState(false);

  const [editField, setEditField] = useState(null);
  const [tempValue, setTempValue] = useState('');

  // Password change flow.
  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSubmitting, setPwSubmitting] = useState(false);

  // Add / change coach flow.
  const [coachModalOpen, setCoachModalOpen] = useState(false);
  const [coachEmailInput, setCoachEmailInput] = useState('');
  const [coachError, setCoachError] = useState('');
  const [coachSubmitting, setCoachSubmitting] = useState(false);
  const [coachProfile, setCoachProfile] = useState(null);
  const [outgoingRequests, setOutgoingRequests] = useState([]);

  // Subscribe to the athlete's outgoing coach requests so the UI can
  // show pending / declined banners and so we can compensate the
  // accepted-cross-doc-write that Firestore rules don't let the coach
  // do directly. (See NOTES.md "Coach-acceptance flow".)
  useEffect(() => {
    if (!uid) {
      setOutgoingRequests([]);
      return;
    }
    return subscribeOutgoingRequestsForAthlete(uid, list => {
      setOutgoingRequests(list);
      // When a request transitions to accepted/ended, the athlete writes
      // its own coachId. Best-effort — failures are ignored (the next
      // snapshot fires the same path).
      syncCoachIdFromRequests(uid, list).catch(() => {});
    });
  }, [uid]);

  const pendingOutgoing = outgoingRequests.find(r => r.status === 'pending');
  const declinedOutgoing = outgoingRequests
    .filter(r => r.status === 'declined')
    .sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0))[0];

  // Delete account flow (App Store guideline 5.1.1(v)).
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePw, setDeletePw] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // Share fleet flow.
  const [sharing, setSharing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const fleetShareRef = useRef(null);

  const handleExportData = useCallback(async () => {
    if (!user?.uid) {
      return;
    }
    setExporting(true);
    try {
      await exportAndShareUserData(user.uid);
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Export failed',
        text2: String(err.message || err),
        position: 'top',
        visibilityTime: 2400,
      });
    } finally {
      setExporting(false);
    }
  }, [user?.uid]);

  const openLegal = useCallback(path => {
    const base =
      process.env.NORDICFLEET_MARKETING_URL || 'https://nordicfleet.com';
    Linking.openURL(`${base}${path}`).catch(() => {});
  }, []);

  const handleShareFleet = useCallback(async () => {
    setSharing(true);
    try {
      await shareSnapshot(fleetShareRef, 'my_fleet', {
        title: 'My fleet · NordicFleet',
        message: 'My ski fleet — shared from NordicFleet',
      });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Share failed',
        text2: String(err.message || err),
        position: 'top',
        visibilityTime: 2200,
      });
    } finally {
      setSharing(false);
    }
  }, []);

  // When the athlete profile has a coachId, fetch the coach's profile
  // (rules allow any auth'd user to read role=='coach' docs).
  useEffect(() => {
    const cId = profile?.coachId;
    if (!cId) {
      setCoachProfile(null);
      return;
    }
    let cancelled = false;
    getProfile(cId).then(p => {
      if (!cancelled) {
        setCoachProfile(p);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [profile?.coachId]);

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

  const openCoachModal = useCallback(() => {
    setCoachEmailInput('');
    setCoachError('');
    setCoachModalOpen(true);
  }, []);

  const closeCoachModal = useCallback(() => {
    setCoachModalOpen(false);
    setCoachEmailInput('');
    setCoachError('');
  }, []);

  const submitCoach = useCallback(async () => {
    setCoachError('');
    const trimmed = coachEmailInput.trim();
    if (!isValidEmail(trimmed)) {
      setCoachError('Please enter a valid email');
      return;
    }
    if (!uid) {
      setCoachError('Not signed in');
      return;
    }
    setCoachSubmitting(true);
    try {
      const myEmail = profile?.email || user?.email || '';
      await requestCoach(uid, myEmail, trimmed);
      Toast.show({
        type: 'success',
        text1: 'Request sent',
        text2: 'Your coach will see it on their dashboard.',
        position: 'top',
        visibilityTime: 2400,
      });
      closeCoachModal();
    } catch (err) {
      const code = err && err.code;
      if (code === 'coach/not-found') {
        setCoachError(
          'No coach account found with that email. Make sure your coach has signed up first.',
        );
      } else if (code === 'coach/self-link') {
        setCoachError('You cannot be your own coach.');
      } else if (code === 'coach/already-requested') {
        setCoachError(
          'You already have a pending or active request with this coach.',
        );
      } else {
        setCoachError("Couldn't send request, please try again.");
      }
    } finally {
      setCoachSubmitting(false);
    }
  }, [coachEmailInput, uid, closeCoachModal, profile?.email, user?.email]);

  const handleCancelRequest = useCallback(() => {
    if (!pendingOutgoing) {
      return;
    }
    Alert.alert(
      'Cancel request?',
      `Cancel your pending request to ${pendingOutgoing.coachEmail}?`,
      [
        {text: 'Keep', style: 'cancel'},
        {
          text: 'Cancel request',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelRequest(pendingOutgoing.id);
              Toast.show({
                type: 'success',
                text1: 'Request cancelled',
                position: 'top',
                visibilityTime: 1800,
              });
            } catch (err) {
              Alert.alert('Cancel failed', String(err.message || err));
            }
          },
        },
      ],
    );
  }, [pendingOutgoing]);

  const handleRemoveCoach = useCallback(() => {
    Alert.alert(
      'Remove coach?',
      'Your coach will no longer be able to see your fleet.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeCoach(uid);
              Toast.show({
                type: 'success',
                text1: 'Coach removed',
                position: 'top',
                visibilityTime: 1800,
              });
            } catch (err) {
              Alert.alert('Remove failed', String(err.message || err));
            }
          },
        },
      ],
    );
  }, [uid]);

  const handleDeleteAccountTap = useCallback(() => {
    // Two-step confirmation: first alert, then reauth modal.
    Alert.alert(
      'Delete your account?',
      'This permanently removes all your skis, wax logs, test logs, and profile data. This cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'I want to delete',
          style: 'destructive',
          onPress: () => {
            setDeletePw('');
            setDeleteError('');
            setDeleteModalOpen(true);
          },
        },
      ],
    );
  }, []);

  const closeDeleteModal = useCallback(() => {
    setDeleteModalOpen(false);
    setDeletePw('');
    setDeleteError('');
  }, []);

  const submitDeleteAccount = useCallback(async () => {
    setDeleteError('');
    const currentUser = auth().currentUser;
    if (!currentUser || !currentUser.email) {
      setDeleteError('Not signed in');
      return;
    }
    if (deletePw.length < 6) {
      setDeleteError('Enter your password to confirm');
      return;
    }
    setDeleteSubmitting(true);
    try {
      const cred = auth.EmailAuthProvider.credential(
        currentUser.email,
        deletePw,
      );
      await currentUser.reauthenticateWithCredential(cred);
      await deleteAccount();
      // After deleteAccount succeeds, auth state is null. Show the toast
      // before navigating because Toast lives at the App root and
      // unmounting the navigator wipes the screen anyway.
      Toast.show({
        type: 'success',
        text1: 'Account deleted',
        position: 'top',
        visibilityTime: 2200,
      });
      setDeleteModalOpen(false);
      setDeletePw('');
      navigation.reset({index: 0, routes: [{name: 'Welcome'}]});
    } catch (err) {
      const code = err && err.code;
      if (
        code === 'auth/wrong-password' ||
        code === 'auth/invalid-credential'
      ) {
        setDeleteError('Wrong password');
      } else if (code === 'auth/network-request-failed') {
        setDeleteError('No connection — please try again');
      } else if (code === 'auth/requires-recent-login') {
        setDeleteError('Please sign out, sign back in, and try again');
      } else {
        setDeleteError("Couldn't delete account, please try again");
      }
    } finally {
      setDeleteSubmitting(false);
    }
  }, [deletePw, navigation]);

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

  const enableCoaching = useCallback(async () => {
    if (!uid) {
      return;
    }
    setCoachingBusy(true);
    try {
      await setCoachCapability(uid, true);
      Alert.alert(
        'Coaching enabled',
        'Switch to Coaching mode anytime from the toggle above the tab bar to manage your athletes.',
      );
    } catch (err) {
      Alert.alert('Could not enable coaching', String(err.message || err));
    } finally {
      setCoachingBusy(false);
    }
  }, [uid]);

  const disableCoaching = useCallback(() => {
    if (!uid) {
      return;
    }
    Alert.alert(
      'Stop coaching?',
      'Your athletes will be unlinked from you and you’ll lose access to their fleets. Your own fleet and history stay exactly as they are.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Stop coaching',
          style: 'destructive',
          onPress: async () => {
            setCoachingBusy(true);
            try {
              const {clearedAthletes} = await setCoachCapability(uid, false);
              // Drop back to personal mode — coaching surface is gone.
              setMode('personal');
              Alert.alert(
                'Coaching turned off',
                clearedAthletes > 0
                  ? `Unlinked ${clearedAthletes} athlete${
                      clearedAthletes === 1 ? '' : 's'
                    }.`
                  : 'You can turn coaching back on anytime.',
              );
            } catch (err) {
              Alert.alert(
                'Could not stop coaching',
                String(err.message || err),
              );
            } finally {
              setCoachingBusy(false);
            }
          },
        },
      ],
    );
  }, [uid, setMode]);

  if (loading) {
    return <LoadingScreen label="Loading profile…" />;
  }

  const isCoach = deriveIsCoach(profile);
  const displayName =
    profile?.name ||
    profile?.displayName ||
    profile?.email ||
    user?.email ||
    '';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <Header title="Profile" />
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

        {/* Stat row — everyone has a personal fleet now */}
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

        {/* Coaching capability toggle — every user can become a coach. */}
        <SectionHeader title="Coaching" />
        <Card padding={spacing.lg} style={styles.coachingCard}>
          <View style={styles.coachingRow}>
            <View style={styles.coachingText}>
              <Text style={styles.coachingTitle}>Coach a team</Text>
              <Text style={styles.coachingDesc}>
                {isCoach
                  ? 'You can switch to Coaching mode from the toggle above the tab bar.'
                  : 'Turn on to manage other skiers’ fleets. Adds a coaching mode you can switch into.'}
              </Text>
            </View>
            <Switch
              value={isCoach}
              disabled={coachingBusy}
              onValueChange={next =>
                next ? enableCoaching() : disableCoaching()
              }
              trackColor={{true: colors.coaching, false: colors.border}}
              accessibilityLabel="Coach a team"
            />
          </View>
        </Card>

        {/* Coach link — every user can have a coach. */}
        <>
            <SectionHeader title="My coach" />
            <Card padding={0}>
              {profile?.coachId ? (
                <>
                  <View style={styles.rowOuter}>
                    <ListItem
                      leading={
                        <Avatar
                          name={
                            coachProfile?.displayName ||
                            coachProfile?.email ||
                            'Coach'
                          }
                          size={32}
                        />
                      }
                      title={
                        coachProfile?.displayName ||
                        coachProfile?.email ||
                        'Coach'
                      }
                      subtitle={
                        coachProfile?.email &&
                        coachProfile?.email !== coachProfile?.displayName
                          ? coachProfile.email
                          : 'Linked coach'
                      }
                      right={<Text style={styles.editAction}>Change</Text>}
                      onPress={openCoachModal}
                      accessibilityLabel="Change coach"
                      chevron={false}
                      showDivider
                    />
                  </View>
                  <View style={styles.rowOuter}>
                    <ListItem
                      icon="close-circle-outline"
                      iconColor={colors.red}
                      title="Remove coach"
                      destructive
                      onPress={handleRemoveCoach}
                      accessibilityLabel="Remove coach"
                      chevron={false}
                    />
                  </View>
                </>
              ) : pendingOutgoing ? (
                <View style={styles.rowOuter}>
                  <ListItem
                    icon="hourglass-outline"
                    iconColor={colors.warning}
                    title="Request pending"
                    subtitle={pendingOutgoing.coachEmail}
                    right={<Text style={styles.editAction}>Cancel</Text>}
                    onPress={handleCancelRequest}
                    accessibilityLabel="Cancel pending coach request"
                    chevron={false}
                  />
                </View>
              ) : declinedOutgoing ? (
                <>
                  <View style={styles.rowOuter}>
                    <ListItem
                      icon="close-circle-outline"
                      iconColor={colors.red}
                      title="Request declined"
                      subtitle={declinedOutgoing.coachEmail}
                      chevron={false}
                      showDivider
                    />
                  </View>
                  <View style={styles.rowOuter}>
                    <ListItem
                      icon="add-circle-outline"
                      title="Request another coach"
                      subtitle="Try a different email"
                      onPress={openCoachModal}
                      accessibilityLabel="Add a coach"
                    />
                  </View>
                </>
              ) : (
                <View style={styles.rowOuter}>
                  <ListItem
                    icon="add-circle-outline"
                    title="Add a coach"
                    subtitle="Send your coach a request"
                    onPress={openCoachModal}
                    accessibilityLabel="Add a coach"
                  />
                </View>
              )}
            </Card>
        </>

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
              icon="share-outline"
              title="Share my fleet"
              subtitle={sharing ? 'Preparing image…' : 'Send a snapshot of your skis'}
              onPress={handleShareFleet}
              accessibilityLabel="Share my fleet"
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

        {/* Privacy & data — export + legal + issue reporting */}
        <SectionHeader title="Privacy & data" />
        <Card padding={0}>
          <View style={styles.rowOuter}>
            <ListItem
              icon="download-outline"
              title="Export my data"
              subtitle={
                exporting ? 'Preparing export…' : 'Download everything as JSON'
              }
              onPress={handleExportData}
              accessibilityLabel="Export my data"
              showDivider
            />
          </View>
          <View style={styles.rowOuter}>
            <ListItem
              icon="shield-checkmark-outline"
              title="Privacy Policy"
              onPress={() => openLegal('/privacy')}
              accessibilityLabel="Privacy Policy"
              showDivider
            />
          </View>
          <View style={styles.rowOuter}>
            <ListItem
              icon="document-text-outline"
              title="Terms of Service"
              onPress={() => openLegal('/terms')}
              accessibilityLabel="Terms of Service"
              showDivider
            />
          </View>
          <View style={styles.rowOuter}>
            <ListItem
              icon="mail-outline"
              title="Report a problem"
              onPress={() =>
                Linking.openURL(
                  'mailto:support@nordicfleet.com?subject=NordicFleet%20issue%20report',
                ).catch(() => {})
              }
              accessibilityLabel="Report a problem"
              chevron={false}
            />
          </View>
        </Card>

        {/* Danger zone — App Store guideline 5.1.1(v): account deletion */}
        <SectionHeader title="Danger zone" />
        <Card padding={0}>
          <View style={styles.rowOuter}>
            <ListItem
              icon="trash-outline"
              iconColor={colors.red}
              title="Delete account"
              subtitle="Permanently removes all your data"
              destructive
              onPress={handleDeleteAccountTap}
              accessibilityLabel="Delete account"
              chevron={false}
            />
          </View>
        </Card>

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
            {editField && (() => {
              const isNumeric = NUMERIC_FIELDS.has(editField.key);
              return (
                <Input
                  label={editField.label}
                  icon={editField.icon}
                  value={tempValue}
                  onChangeText={setTempValue}
                  keyboardType={keyboardTypeFor(editField.key)}
                  suffix={isNumeric ? (editField.suffix || '').trim() : undefined}
                  autoCapitalize={
                    isNumeric
                      ? 'none'
                      : editField.key === 'location' || editField.key === 'team'
                      ? 'words'
                      : 'sentences'
                  }
                  autoCorrect={!isNumeric}
                />
              );
            })()}
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
              autoComplete="current-password"
              textContentType="password"
              autoCorrect={false}
            />
            <View style={styles.modalFieldSpacer} />
            <Input
              label="New password"
              icon="key-outline"
              value={newPw}
              onChangeText={setNewPw}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              passwordRules="minlength: 8; required: lower; required: upper; required: digit;"
              autoCorrect={false}
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

      {/* Delete-account reauth modal */}
      <Modal
        animationType="fade"
        transparent
        visible={deleteModalOpen}
        onRequestClose={closeDeleteModal}>
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Confirm deletion</Text>
            <Text style={styles.modalSubtitle}>
              For security, please enter your password. After deletion your
              data cannot be recovered.
            </Text>
            <View style={styles.modalFieldSpacer} />
            <Input
              label="Password"
              icon="lock-closed-outline"
              value={deletePw}
              onChangeText={setDeletePw}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="current-password"
              textContentType="password"
              autoCorrect={false}
              error={deleteError || undefined}
              editable={!deleteSubmitting}
            />
            <View style={styles.modalActions}>
              <View style={styles.modalActionCell}>
                <Button
                  variant="ghost"
                  size="md"
                  fullWidth
                  disabled={deleteSubmitting}
                  onPress={closeDeleteModal}>
                  Cancel
                </Button>
              </View>
              <View style={styles.modalActionCell}>
                <Button
                  variant="danger"
                  size="md"
                  fullWidth
                  icon="trash-outline"
                  loading={deleteSubmitting}
                  onPress={submitDeleteAccount}
                  accessibilityLabel="Confirm delete account">
                  Delete
                </Button>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add / change coach modal */}
      <Modal
        animationType="fade"
        transparent
        visible={coachModalOpen}
        onRequestClose={closeCoachModal}>
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {profile?.coachId ? 'Change coach' : 'Add a coach'}
            </Text>
            <Text style={styles.modalSubtitle}>
              Enter your coach's email. They need to have signed up for a
              NordicFleet coach account first.
            </Text>
            <View style={styles.modalFieldSpacer} />
            <Input
              label="Coach email"
              icon="mail-outline"
              value={coachEmailInput}
              onChangeText={setCoachEmailInput}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              error={coachError || undefined}
              editable={!coachSubmitting}
            />
            <View style={styles.modalActions}>
              <View style={styles.modalActionCell}>
                <Button
                  variant="ghost"
                  size="md"
                  fullWidth
                  disabled={coachSubmitting}
                  onPress={closeCoachModal}>
                  Cancel
                </Button>
              </View>
              <View style={styles.modalActionCell}>
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  icon="checkmark"
                  loading={coachSubmitting}
                  onPress={submitCoach}
                  accessibilityLabel="Save coach">
                  Save
                </Button>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Off-screen fleet share card for snapshot capture. */}
      {!isCoach && (
        <View pointerEvents="none" style={styles.shareCardHost}>
          <FleetShareCard
            ref={fleetShareRef}
            profile={profile}
            skis={skis}
            totalWaxes={totalWaxes}
            totalTests={totalTests}
          />
        </View>
      )}

      <TabBar />
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

  coachingCard: {marginBottom: spacing.sm},
  coachingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coachingText: {flex: 1, marginRight: spacing.md},
  coachingTitle: {
    ...typography.headingMd,
    color: colors.textPrimary,
  },
  coachingDesc: {
    ...typography.bodySm,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },

  rowOuter: {
    paddingHorizontal: spacing.lg,
  },
  editAction: {
    ...typography.bodySm,
    color: colors.red,
    fontWeight: '600',
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
  modalSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: -spacing.md,
    marginBottom: spacing.sm,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: spacing.xl,
  },
  modalActionCell: {flex: 1, marginHorizontal: spacing.xs},
  modalFieldSpacer: {height: spacing.md},
  shareCardHost: {
    position: 'absolute',
    left: -10000,
    top: 0,
    opacity: 0,
  },
});

export default ProfileScreen;
