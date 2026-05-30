import React, {useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Alert,
  Linking,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Share from 'react-native-share';
import Toast from 'react-native-toast-message';

import {useAuth} from '../context/AuthContext';
import useProfile from '../hooks/useProfile';
import {parseEmailList, buildInviteMailto} from '@nordicfleet/core';
import {
  createInvites,
  subscribeInvitesForCoach,
  revokeInvite,
} from '../services/inviteService';
import {APP_URL} from '../config/urls';
import {
  Header,
  Card,
  Input,
  Button,
  Pill,
  ListItem,
  EmptyState,
  SectionHeader,
  TabBar,
} from '../components/ui';
import {colors, spacing, typography} from '../theme';

const STATUS_COLOR = {
  pending: 'red',
  accepted: 'red',
  revoked: 'neutral',
};

const InviteAthletesScreen = () => {
  const {user} = useAuth();
  const uid = user?.uid;
  const {profile} = useProfile(uid);
  const coachName = (profile?.name || profile?.displayName || '').trim();

  const [text, setText] = useState('');
  const [creating, setCreating] = useState(false);
  const [invites, setInvites] = useState([]);

  useEffect(() => {
    if (!uid) {
      setInvites([]);
      return undefined;
    }
    return subscribeInvitesForCoach(uid, setInvites);
  }, [uid]);

  const {emails, invalid} = useMemo(() => parseEmailList(text), [text]);

  // Per-invite signup link. Redemption is via the existing coach-request
  // flow (athlete enters the coach email); the token is a tracking id.
  const linkFor = inv =>
    `${APP_URL}/signup?invite=${encodeURIComponent(inv.token || '')}`;

  const handleCreate = async () => {
    if (!uid || emails.length === 0) {
      return;
    }
    setCreating(true);
    try {
      await createInvites(uid, coachName, emails);
      setText('');
      Toast.show({
        type: 'success',
        text1: 'Invite links created',
        text2: `${emails.length} invite${emails.length === 1 ? '' : 's'}`,
        position: 'top',
        visibilityTime: 2200,
      });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Could not create invites',
        text2: String(err.message || err),
        position: 'top',
        visibilityTime: 2400,
      });
    } finally {
      setCreating(false);
    }
  };

  const shareLink = async inv => {
    const link = linkFor(inv);
    const message = coachName
      ? `${coachName} invited you to NordicFleet. Get started: ${link}`
      : `You are invited to NordicFleet. Get started: ${link}`;
    try {
      await Share.open({title: 'NordicFleet invite', message});
    } catch {
      // user cancelled the share sheet - not an error
    }
  };

  const emailDraft = inv => {
    const url = buildInviteMailto([inv.email], {
      coachName,
      inviteLink: linkFor(inv),
    });
    Linking.openURL(url).catch(() => {});
  };

  const confirmRevoke = inv => {
    Alert.alert(
      'Revoke invite?',
      `The link for ${inv.email} will stop being offered. You can create a new one later.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: () => revokeInvite(inv.id).catch(() => {}),
        },
      ],
    );
  };

  const canCreate = !!uid && emails.length > 0 && !creating;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <Header title="Invite athletes" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled">
          <Card>
            <Input
              label="Athlete emails"
              icon="mail-outline"
              value={text}
              onChangeText={setText}
              placeholder="Paste emails, separated by commas or new lines"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              multiline
            />
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>
                {emails.length} valid
                {invalid.length > 0 ? `, ${invalid.length} to fix` : ''}
              </Text>
            </View>
            {invalid.length > 0 && (
              <View style={styles.invalidRow}>
                {invalid.slice(0, 6).map((bad, i) => (
                  <View key={`${bad}-${i}`} style={styles.invalidChipWrap}>
                    <Pill variant="outline" color="neutral">
                      {bad}
                    </Pill>
                  </View>
                ))}
              </View>
            )}
            <View style={styles.fieldSpacer} />
            <Button
              variant="primary"
              size="lg"
              fullWidth
              icon="link-outline"
              loading={creating}
              disabled={!canCreate}
              onPress={handleCreate}>
              Create invite links
            </Button>
            <Text style={styles.hint}>
              Links are created for you to copy or open in an email draft.
              Nothing is emailed automatically.
            </Text>
          </Card>

          <SectionHeader title="Invites" />
          {invites.length === 0 ? (
            <EmptyState
              icon="people-outline"
              title="No invites yet"
              description="Paste a few athlete emails above and create invite links to share."
            />
          ) : (
            <Card padding={0}>
              {invites.map((inv, i) => (
                <View key={inv.id} style={styles.inviteRow}>
                  <ListItem
                    title={inv.email}
                    subtitle={`Invite link ready${
                      inv.status === 'revoked' ? ' (revoked)' : ''
                    }`}
                    right={
                      <Pill
                        variant="ghost"
                        color={STATUS_COLOR[inv.status] || 'neutral'}>
                        {inv.status}
                      </Pill>
                    }
                    showDivider={i < invites.length - 1}
                  />
                  {inv.status !== 'revoked' && (
                    <View style={styles.actionRow}>
                      <View style={styles.actionWrap}>
                        <Button
                          variant="secondary"
                          size="sm"
                          icon="share-outline"
                          onPress={() => shareLink(inv)}>
                          Copy link
                        </Button>
                      </View>
                      <View style={styles.actionWrap}>
                        <Button
                          variant="secondary"
                          size="sm"
                          icon="mail-outline"
                          onPress={() => emailDraft(inv)}>
                          Email draft
                        </Button>
                      </View>
                      <View style={styles.actionWrap}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onPress={() => confirmRevoke(inv)}>
                          Revoke
                        </Button>
                      </View>
                    </View>
                  )}
                </View>
              ))}
            </Card>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      <TabBar />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.bg},
  flex: {flex: 1},
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  metaRow: {marginTop: spacing.sm},
  metaText: {
    ...typography.bodySm,
    color: colors.textTertiary,
  },
  invalidRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
  },
  invalidChipWrap: {marginRight: spacing.sm, marginBottom: spacing.sm},
  fieldSpacer: {height: spacing.lg},
  hint: {
    ...typography.bodySm,
    color: colors.textTertiary,
    marginTop: spacing.md,
  },
  inviteRow: {paddingHorizontal: spacing.lg},
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingBottom: spacing.md,
  },
  actionWrap: {marginRight: spacing.sm, marginBottom: spacing.sm},
});

export default InviteAthletesScreen;
