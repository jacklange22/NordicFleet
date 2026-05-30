import React, {useState, useCallback} from 'react';
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
  Linking,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import Toast from 'react-native-toast-message';

import {useAuth} from '../context/AuthContext';
import {exportAndShareUserData} from '../services/dataExportService';
import {deleteAccount} from '../services/userService';
import {auth} from '../services/firebase';
import {buildFeedbackMailto} from '@nordicfleet/core';
import {Header, Card, ListItem, SectionHeader, Button, Input} from '../components/ui';
import {colors, radius, spacing, typography} from '../theme';
import {BUILD_TAG} from '../buildInfo';
import {legalUrl, MARKETING_URL, FEEDBACK_EMAIL} from '../config/urls';

// Settings groups the account-management actions that used to clutter the
// Profile screen (issue #4): credentials, data/privacy, and the dangerous
// account-deletion. Reached from the gear in the Profile header.
const SettingsScreen = () => {
  const navigation = useNavigation();
  const {signOut} = useAuth();

  // Change-password flow.
  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSubmitting, setPwSubmitting] = useState(false);

  // Export flow.
  const [exporting, setExporting] = useState(false);

  // Delete-account flow (App Store guideline 5.1.1(v)) - two-step:
  // (1) a destructive Alert, then (2) a password reauth modal.
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePw, setDeletePw] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const openLegal = useCallback(path => {
    Linking.openURL(legalUrl(path)).catch(() => {});
  }, []);

  // Beta feedback / bug report. Opens the user's mail composer with a
  // draft (build tag + platform pre-filled) so reports carry version
  // context. We never claim it was sent - the user sends it. When no
  // feedback inbox is configured we open the marketing site instead of
  // drafting to an address we don't own.
  const openFeedback = useCallback(kind => {
    const mailto = buildFeedbackMailto(FEEDBACK_EMAIL, {
      kind,
      buildTag: BUILD_TAG,
      platform: Platform.OS,
    });
    Linking.openURL(mailto || MARKETING_URL).catch(() => {});
  }, []);

  const handleExportData = useCallback(async () => {
    const uid = auth().currentUser?.uid;
    if (!uid) {
      return;
    }
    setExporting(true);
    try {
      await exportAndShareUserData(uid);
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
  }, []);

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
        setPwError('No connection - please try again');
      } else {
        setPwError('Could not change password, please try again');
      }
    } finally {
      setPwSubmitting(false);
    }
  }, [currentPw, newPw]);

  const handleDeleteAccountTap = useCallback(() => {
    // Step 1 of 3: a destructive Alert that spells out what is lost.
    Alert.alert(
      'Delete your account?',
      'This permanently erases your skis, wax logs, test logs, coaching links, and profile. It cannot be undone and your data cannot be recovered.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete forever',
          style: 'destructive',
          onPress: () => {
            // Step 2 of 3: an explicit second confirmation, so a single
            // accidental tap can never reach the destructive action.
            Alert.alert(
              'Are you absolutely sure?',
              'There is no undo. Your account and everything in it will be gone for good.',
              [
                {text: 'Cancel', style: 'cancel'},
                {
                  text: 'Yes, delete forever',
                  style: 'destructive',
                  onPress: () => {
                    // Step 3 of 3: password reauth modal.
                    setDeletePw('');
                    setDeleteError('');
                    setDeleteModalOpen(true);
                  },
                },
              ],
            );
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
      // before navigating because Toast lives at the App root.
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
        setDeleteError('No connection - please try again');
      } else if (code === 'auth/requires-recent-login') {
        setDeleteError('Please sign out, sign back in, and try again');
      } else {
        setDeleteError("Couldn't delete account, please try again");
      }
    } finally {
      setDeleteSubmitting(false);
    }
  }, [deletePw, navigation]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <Header title="Settings" />
      <ScrollView contentContainerStyle={styles.scroll}>
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

        {/* Privacy & data - export + legal + issue reporting */}
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
              chevron={false}
            />
          </View>
        </Card>

        {/* Feedback - beta entry point. Opens a mail draft (or the site
            when no inbox is configured); nothing is sent automatically. */}
        <SectionHeader title="Feedback" />
        <Card padding={0}>
          <View style={styles.rowOuter}>
            <ListItem
              icon="chatbox-ellipses-outline"
              title="Send beta feedback"
              subtitle="Tell us what is working and what is not"
              onPress={() => openFeedback('feedback')}
              accessibilityLabel="Send beta feedback"
              showDivider
            />
          </View>
          <View style={styles.rowOuter}>
            <ListItem
              icon="bug-outline"
              title="Report a problem"
              onPress={() => openFeedback('bug')}
              accessibilityLabel="Report a problem"
              chevron={false}
            />
          </View>
        </Card>

        {/* Danger zone - App Store guideline 5.1.1(v): account deletion */}
        <SectionHeader title="Danger zone" />
        <Card padding={0}>
          <View style={styles.rowOuter}>
            <ListItem
              icon="trash-outline"
              iconColor={colors.red}
              title="Delete account"
              subtitle="Permanently erases all your data"
              destructive
              onPress={handleDeleteAccountTap}
              accessibilityLabel="Delete account"
              chevron={false}
            />
          </View>
        </Card>

        {/* Build label - proves the phone is running THIS build. Shown in
            both Debug and Release (the user runs Release on device). Bump
            BUILD_TAG in src/buildInfo.js per build. */}
        <Text style={styles.buildTag} accessibilityLabel={`Build ${BUILD_TAG}`}>
          {__DEV__ ? 'DEV' : 'Build'} · {BUILD_TAG}
        </Text>
      </ScrollView>

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

      {/* Delete-account reauth modal (step 2 of 2) */}
      <Modal
        animationType="fade"
        transparent
        visible={deleteModalOpen}
        onRequestClose={closeDeleteModal}>
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>This is permanent</Text>
            <Text style={styles.modalSubtitle}>
              Enter your password to permanently delete your account. There is
              no undo and your data cannot be recovered.
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
                  Delete forever
                </Button>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.bg},
  buildTag: {
    ...typography.caption,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  rowOuter: {
    paddingHorizontal: spacing.lg,
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
});

export default SettingsScreen;
