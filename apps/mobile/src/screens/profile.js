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
  Pressable,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import Toast from 'react-native-toast-message';
import {
  isValidEmail,
  formatWeight,
  formatHeight,
  weightFromMetric,
  weightToMetric,
  heightFromMetric,
  heightToMetric,
  normalizeWeightUnit,
  normalizeHeightUnit,
} from '@nordicfleet/core';
import LoadingScreen from '../components/LoadingScreen';
import {shareSnapshot, fleetShareMessage} from '../services/shareService';
import FleetShareCard from '../components/share/FleetShareCard';
import {useAuth} from '../context/AuthContext';
import useProfile from '../hooks/useProfile';
import useSkis from '../hooks/useSkis';
import useDashboardStats from '../hooks/useDashboardStats';
import {
  updateProfile,
  removeCoach,
  getProfile,
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
import {
  Header,
  Card,
  Avatar,
  StatCard,
  ListItem,
  SectionHeader,
  Button,
  Input,
  Pill,
  TabBar,
} from '../components/ui';
import {colors, radius, spacing, typography} from '../theme';

const NUMERIC_FIELDS = new Set(['weight', 'height']);

// weight/height are stored in metric (kg/cm); `unitKind` drives the
// per-user display unit (see the Units section + @nordicfleet/core).
const FIELD_DEFS = [
  {key: 'weight', label: 'Weight', unitKind: 'weight', icon: 'barbell-outline'},
  {key: 'height', label: 'Height', unitKind: 'height', icon: 'resize-outline'},
  {key: 'team', label: 'Team', icon: 'people-outline'},
  {key: 'location', label: 'Location', icon: 'location-outline'},
];

// The active display unit ('kg'/'lb'/'cm'/'in') for a field, or '' for
// plain text fields.
const unitFor = (def, weightUnit, heightUnit) => {
  if (def.unitKind === 'weight') {
    return weightUnit;
  }
  if (def.unitKind === 'height') {
    return heightUnit;
  }
  return '';
};

// Brief: decimal-pad for weight/height. iOS decimal-pad shows digits +
// the locale's decimal separator (no minus sign - fine for these, since
// negative weight/height isn't meaningful).
const keyboardTypeFor = field => {
  if (NUMERIC_FIELDS.has(field)) {
    return 'decimal-pad';
  }
  return 'default';
};

const fieldDisplay = (def, profile, weightUnit, heightUnit) => {
  const v = profile?.[def.key];
  if (v === undefined || v === null || v === '') {
    return '-';
  }
  if (def.unitKind === 'weight') {
    return formatWeight(v, weightUnit) || '-';
  }
  if (def.unitKind === 'height') {
    return formatHeight(v, heightUnit) || '-';
  }
  return `${v}`;
};

const ProfileScreen = () => {
  const navigation = useNavigation();
  const {user} = useAuth();
  const {setMode} = useMode();
  const uid = user?.uid;

  const {profile, loading} = useProfile(uid);
  const {skis} = useSkis(uid);
  const {totalWaxes, totalTests} = useDashboardStats(uid);

  // Display units for body metrics (stored value stays metric). Default
  // to kg/cm when the profile carries no preference yet.
  const weightUnit = normalizeWeightUnit(profile?.weightUnit);
  const heightUnit = normalizeHeightUnit(profile?.heightUnit);

  const [coachingBusy, setCoachingBusy] = useState(false);

  const [editField, setEditField] = useState(null);
  const [tempValue, setTempValue] = useState('');

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
      // its own coachId. Best-effort - failures are ignored (the next
      // snapshot fires the same path).
      syncCoachIdFromRequests(uid, list).catch(() => {});
    });
  }, [uid]);

  const pendingOutgoing = outgoingRequests.find(r => r.status === 'pending');
  const declinedOutgoing = outgoingRequests
    .filter(r => r.status === 'declined')
    .sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0))[0];

  // Share fleet flow.
  const [sharing, setSharing] = useState(false);
  const fleetShareRef = useRef(null);

  const handleShareFleet = useCallback(async () => {
    setSharing(true);
    try {
      await shareSnapshot(fleetShareRef, 'my_fleet', {
        title: 'My fleet · NordicFleet',
        message: fleetShareMessage(),
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
    let display = '';
    if (v !== undefined && v !== null && v !== '') {
      if (def.unitKind === 'weight') {
        const n = weightFromMetric(v, weightUnit);
        display = n === null ? '' : String(n);
      } else if (def.unitKind === 'height') {
        const n = heightFromMetric(v, heightUnit);
        display = n === null ? '' : String(n);
      } else {
        display = String(v);
      }
    }
    setTempValue(display);
    setEditField(def);
  };

  const handleSave = useCallback(async () => {
    if (!editField || !uid) {
      setEditField(null);
      return;
    }
    // weight/height are entered in the user's display unit and converted
    // back to metric (kg/cm) before storage.
    let next;
    if (editField.unitKind === 'weight') {
      next = tempValue === '' ? null : weightToMetric(tempValue, weightUnit);
    } else if (editField.unitKind === 'height') {
      next = tempValue === '' ? null : heightToMetric(tempValue, heightUnit);
    } else {
      next = tempValue;
    }
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
  }, [editField, tempValue, uid, weightUnit, heightUnit]);

  // Switching a display unit only rewrites the preference; the stored
  // metric value is unchanged, so the figure simply re-renders converted.
  const changeUnit = useCallback(
    async (field, value) => {
      if (!uid) {
        return;
      }
      try {
        await updateProfile(uid, {[field]: value});
      } catch (err) {
        Alert.alert('Save failed', String(err.message || err));
      }
    },
    [uid],
  );

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
              // Drop back to personal mode - coaching surface is gone.
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
      <Header
        title="Profile"
        right={
          <Pressable
            onPress={() => navigation.navigate('Settings')}
            accessibilityRole="button"
            accessibilityLabel="Settings"
            hitSlop={10}
            style={({pressed}) => [styles.gearButton, pressed && {opacity: 0.6}]}>
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
            {displayName || '-'}
          </Text>
          <Text style={styles.heroEmail} numberOfLines={1}>
            {profile?.email || user?.email || '-'}
          </Text>
        </View>

        {/* Stat row - everyone has a personal fleet now */}
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
          {FIELD_DEFS.map((def, i) => {
            const unit = unitFor(def, weightUnit, heightUnit);
            return (
              <View key={def.key} style={styles.rowOuter}>
                <ListItem
                  icon={def.icon}
                  title={unit ? `${def.label} (${unit})` : def.label}
                  subtitle={fieldDisplay(def, profile, weightUnit, heightUnit)}
                  onPress={() => openEdit(def)}
                  accessibilityLabel={`Edit ${def.label}${
                    unit ? ` (${unit}):` : ''
                  }`}
                  right={<Text style={styles.editAction}>Edit</Text>}
                  showDivider={i < FIELD_DEFS.length - 1}
                  chevron={false}
                />
              </View>
            );
          })}
        </Card>

        {/* Measurement units */}
        <SectionHeader title="Units" />
        <Card padding={spacing.lg}>
          <View style={styles.unitRow}>
            <Text style={styles.unitRowLabel}>Weight</Text>
            <View style={styles.unitChoices}>
              {['kg', 'lb'].map(u => (
                <View key={u} style={styles.unitChoiceWrap}>
                  <Pill
                    variant={weightUnit === u ? 'solid' : 'outline'}
                    color="red"
                    onPress={() => changeUnit('weightUnit', u)}
                    accessibilityLabel={`Weight in ${
                      u === 'kg' ? 'kilograms' : 'pounds'
                    }`}>
                    {u}
                  </Pill>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.unitDivider} />
          <View style={styles.unitRow}>
            <Text style={styles.unitRowLabel}>Height</Text>
            <View style={styles.unitChoices}>
              {['cm', 'in'].map(u => (
                <View key={u} style={styles.unitChoiceWrap}>
                  <Pill
                    variant={heightUnit === u ? 'solid' : 'outline'}
                    color="red"
                    onPress={() => changeUnit('heightUnit', u)}
                    accessibilityLabel={`Height in ${
                      u === 'cm' ? 'centimetres' : 'inches'
                    }`}>
                    {u}
                  </Pill>
                </View>
              ))}
            </View>
          </View>
        </Card>

        {/* Coaching capability toggle - every user can become a coach. */}
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

        {/* Coach link - every user can have a coach. */}
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
                    title={isCoach ? 'Add your own coach' : 'Add a coach'}
                    subtitle={
                      isCoach
                        ? 'Link a coach who advises you - separate from the athletes you coach'
                        : 'Send a request to the coach who trains you'
                    }
                    onPress={openCoachModal}
                    accessibilityLabel="Add a coach"
                  />
                </View>
              )}
            </Card>
        </>

        {/* Share */}
        <SectionHeader title="Share" />
        <Card padding={0}>
          <View style={styles.rowOuter}>
            <ListItem
              icon="share-outline"
              title="Share my fleet"
              subtitle={
                sharing ? 'Preparing image…' : 'Send a snapshot of your skis'
              }
              onPress={handleShareFleet}
              accessibilityLabel="Share my fleet"
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
                  suffix={
                    isNumeric
                      ? unitFor(editField, weightUnit, heightUnit)
                      : undefined
                  }
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
              {profile?.coachId
                ? 'Change coach'
                : isCoach
                ? 'Add your own coach'
                : 'Add a coach'}
            </Text>
            <Text style={styles.modalSubtitle}>
              Enter the email of the coach who advises you. They need to have
              signed up for a NordicFleet coach account first.
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
  unitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  unitRowLabel: {
    ...typography.bodyLg,
    color: colors.textPrimary,
  },
  unitChoices: {
    flexDirection: 'row',
  },
  unitChoiceWrap: {
    marginLeft: spacing.sm,
  },
  unitDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  gearButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -spacing.sm,
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
