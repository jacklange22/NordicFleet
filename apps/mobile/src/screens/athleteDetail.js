import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  StatusBar,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';

import {useAuth} from '../context/AuthContext';
import {subscribeSkisForAthlete} from '../services/skiService';
import {sendMessage} from '../services/messageService';
import {
  Header,
  Card,
  Avatar,
  Pill,
  StatCard,
  SectionHeader,
  EmptyState,
  Input,
  Button,
} from '../components/ui';
import {colors, radius, spacing, typography} from '../theme';

const SkiRow = ({ski, onPress}) => {
  const tech = (ski.technique || '').toLowerCase();
  const accentColor = tech === 'skate' ? colors.redDim : colors.red;
  return (
    <Card
      onPress={onPress}
      accessibilityLabel={`Open ${ski.name || 'ski'}`}
      padding={0}
      style={styles.skiCardOuter}>
      <View style={styles.skiCardBody}>
        <View style={[styles.accentBar, {backgroundColor: accentColor}]} />
        <View style={styles.skiCardMain}>
          <Text style={styles.skiName} numberOfLines={1}>
            {ski.name || 'Unnamed ski'}
          </Text>
          <View style={styles.pillRow}>
            {!!ski.technique && (
              <View style={styles.pillWrap}>
                <Pill variant="ghost" color="neutral">
                  {ski.technique}
                </Pill>
              </View>
            )}
            {!!ski.type && (
              <View style={styles.pillWrap}>
                <Pill variant="ghost" color="neutral">
                  {ski.type}
                </Pill>
              </View>
            )}
            {!!ski.grind && (
              <View style={styles.pillWrap}>
                <Pill variant="ghost" color="neutral">
                  {ski.grind}
                </Pill>
              </View>
            )}
          </View>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.textTertiary}
          style={styles.chevron}
        />
      </View>
    </Card>
  );
};

const Spacer = () => <View style={styles.rowSpacer} />;

const AthleteDetailScreen = ({route}) => {
  const {user} = useAuth();
  const coachUid = user?.uid;
  const navigation = useNavigation();
  const {athleteUid, athleteEmail, athleteName} = route?.params || {};

  const [skis, setSkis] = useState([]);
  const [loading, setLoading] = useState(true);

  // Send-message modal state.
  const [msgOpen, setMsgOpen] = useState(false);
  const [msgSubject, setMsgSubject] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [msgSkiIds, setMsgSkiIds] = useState([]);
  const [msgError, setMsgError] = useState('');
  const [msgSubmitting, setMsgSubmitting] = useState(false);

  const toggleMsgSki = id =>
    setMsgSkiIds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id],
    );

  const closeMsgModal = () => {
    setMsgOpen(false);
    setMsgSubject('');
    setMsgBody('');
    setMsgSkiIds([]);
    setMsgError('');
  };

  const submitMessage = async () => {
    setMsgError('');
    if (!msgBody.trim()) {
      setMsgError('Write something before sending.');
      return;
    }
    setMsgSubmitting(true);
    try {
      await sendMessage({
        fromUid: coachUid,
        toUid: athleteUid,
        body: msgBody,
        subject: msgSubject,
        attachedSkiIds: msgSkiIds,
      });
      Toast.show({
        type: 'success',
        text1: 'Message sent',
        position: 'top',
        visibilityTime: 1800,
      });
      closeMsgModal();
    } catch (err) {
      setMsgError(String(err.message || err));
    } finally {
      setMsgSubmitting(false);
    }
  };

  useEffect(() => {
    if (!coachUid || !athleteUid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeSkisForAthlete(coachUid, athleteUid, list => {
      setSkis((list || []).filter(s => !s.retired));
      setLoading(false);
    });
    return unsub;
  }, [coachUid, athleteUid]);

  const headerLabel = athleteName || athleteEmail || 'Athlete';

  const goSki = useCallback(
    skiId => {
      navigation.navigate('SkiInfo', {skiId, ownerUid: athleteUid});
    },
    [navigation, athleteUid],
  );

  const renderRow = useCallback(
    ({item}) => <SkiRow ski={item} onPress={() => goSki(item.id)} />,
    [goSki],
  );

  const Heading = (
    <View>
      <View style={styles.identityRow}>
        <Avatar name={headerLabel} size={56} />
        <View style={styles.identityText}>
          <Text style={styles.identityName} numberOfLines={1}>
            {headerLabel}
          </Text>
          {!!athleteEmail && athleteEmail !== headerLabel && (
            <Text style={styles.identityEmail} numberOfLines={1}>
              {athleteEmail}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.statRow}>
        <View style={styles.statCell}>
          <StatCard compact value={skis.length} label="Skis" />
        </View>
        <View style={styles.statCellSpacer} />
        <View style={styles.statCell}>
          <StatCard compact value="—" label="Last wax" />
        </View>
        <View style={styles.statCellSpacer} />
        <View style={styles.statCell}>
          <StatCard compact value="—" label="Tests" />
        </View>
      </View>

      <Card
        style={styles.advisoryCta}
        padding={spacing.md}
        onPress={() =>
          navigation.navigate('ComposeAdvisory', {
            athleteUid,
            athleteName: athleteName || athleteEmail,
          })
        }
        accessibilityLabel="Send a race-day plan">
        <View style={styles.advisoryCtaRow}>
          <View style={styles.advisoryIconWrap}>
            <Ionicons name="flag-outline" size={22} color={colors.red} />
          </View>
          <View style={styles.advisoryText}>
            <Text style={styles.advisoryTitle}>Send a race-day plan</Text>
            <Text style={styles.advisorySubtitle}>
              Pick the skis + conditions for an upcoming event.
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.textTertiary}
          />
        </View>
      </Card>

      <SectionHeader title="Fleet" />
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <Header
        title={headerLabel}
        subtitle="Coach view"
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send message"
            hitSlop={8}
            onPress={() => setMsgOpen(true)}
            style={({pressed}) => [
              styles.headerAction,
              pressed && {opacity: 0.6},
            ]}>
            <Ionicons
              name="chatbubble-outline"
              size={22}
              color={colors.textPrimary}
            />
          </Pressable>
        }
      />
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.red} />
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.scroll}
          data={skis}
          keyExtractor={item => item.id}
          renderItem={renderRow}
          ListHeaderComponent={Heading}
          ItemSeparatorComponent={Spacer}
          ListEmptyComponent={
            <EmptyState
              icon="snow-outline"
              title="No skis yet"
              description="This athlete hasn't added any skis to their fleet yet."
            />
          }
        />
      )}

      {/* Send-message modal */}
      <Modal
        animationType="slide"
        transparent
        visible={msgOpen}
        onRequestClose={closeMsgModal}>
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Send a message</Text>
            <Input
              label="Subject (optional)"
              icon="text-outline"
              value={msgSubject}
              onChangeText={setMsgSubject}
              autoCapitalize="sentences"
            />
            <View style={styles.modalSpacer} />
            <Input
              label="Message"
              icon="chatbubble-outline"
              value={msgBody}
              onChangeText={setMsgBody}
              multiline
              autoCapitalize="sentences"
              error={msgError || undefined}
            />
            {skis.length > 0 && (
              <>
                <View style={styles.modalSpacer} />
                <Text style={styles.modalLabel}>Attach skis (optional)</Text>
                <View style={styles.attachChipRow}>
                  {skis.map(ski => {
                    const selected = msgSkiIds.includes(ski.id);
                    return (
                      <View key={ski.id} style={styles.attachChipWrap}>
                        <Pill
                          variant={selected ? 'solid' : 'outline'}
                          color="red"
                          onPress={() => toggleMsgSki(ski.id)}
                          accessibilityLabel={`Attach ${ski.name}`}>
                          {ski.name}
                        </Pill>
                      </View>
                    );
                  })}
                </View>
              </>
            )}
            <View style={styles.modalActions}>
              <View style={styles.modalActionCell}>
                <Button
                  variant="ghost"
                  size="md"
                  fullWidth
                  disabled={msgSubmitting}
                  onPress={closeMsgModal}>
                  Cancel
                </Button>
              </View>
              <View style={styles.modalActionCell}>
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  icon="send-outline"
                  loading={msgSubmitting}
                  onPress={submitMessage}
                  accessibilityLabel="Send the message">
                  Send
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
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing['4xl'],
    flexGrow: 1,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  identityText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  identityName: {
    ...typography.displayMd,
    color: colors.textPrimary,
  },
  identityEmail: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  statCell: {flex: 1},
  statCellSpacer: {width: spacing.sm},

  advisoryCta: {
    marginBottom: spacing.lg,
  },
  advisoryCtaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  advisoryIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  advisoryText: {flex: 1},
  advisoryTitle: {
    ...typography.headingMd,
    color: colors.textPrimary,
  },
  advisorySubtitle: {
    ...typography.bodySm,
    color: colors.textSecondary,
    marginTop: 2,
  },

  skiCardOuter: {overflow: 'hidden'},
  skiCardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 80,
  },
  accentBar: {
    width: 4,
    alignSelf: 'stretch',
    borderTopLeftRadius: radius.lg,
    borderBottomLeftRadius: radius.lg,
  },
  skiCardMain: {
    flex: 1,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  skiName: {
    ...typography.headingMd,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  pillWrap: {
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  chevron: {
    paddingRight: spacing.lg,
  },
  rowSpacer: {height: spacing.md},
  headerAction: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -spacing.sm,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing['2xl'],
  },
  modalTitle: {
    ...typography.displayMd,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  modalSpacer: {height: spacing.md},
  modalLabel: {
    ...typography.caption,
    color: colors.textTertiary,
    marginBottom: spacing.sm,
  },
  attachChipRow: {flexDirection: 'row', flexWrap: 'wrap'},
  attachChipWrap: {marginRight: spacing.sm, marginBottom: spacing.sm},
  modalActions: {flexDirection: 'row', marginTop: spacing.xl},
  modalActionCell: {flex: 1, marginHorizontal: spacing.xs},
});

export default AthleteDetailScreen;
