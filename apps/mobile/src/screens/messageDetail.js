import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Pressable,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import {useAuth} from '../context/AuthContext';
import {getMessage, markRead} from '../services/messageService';
import {getProfile} from '../services/userService';
import {subscribeSki} from '../services/skiService';
import {Header, Card, Avatar, ListItem, Pill, SectionHeader} from '../components/ui';
import {colors, spacing, typography, radius} from '../theme';

const fmtFull = raw => {
  if (!raw) {
    return '';
  }
  let d = null;
  if (typeof raw.toDate === 'function') {
    d = raw.toDate();
  } else if (raw instanceof Date) {
    d = raw;
  } else if (typeof raw === 'string' || typeof raw === 'number') {
    const dd = new Date(raw);
    if (!isNaN(dd.getTime())) {
      d = dd;
    }
  }
  if (!d) {
    return '';
  }
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const MessageDetail = ({route}) => {
  const navigation = useNavigation();
  const {user} = useAuth();
  const uid = user?.uid;
  const messageId = route?.params?.messageId;

  const [msg, setMsg] = useState(null);
  const [sender, setSender] = useState(null);
  const [attachedSkis, setAttachedSkis] = useState({});

  useEffect(() => {
    if (!messageId) {
      return;
    }
    getMessage(messageId).then(m => {
      setMsg(m);
      if (m && uid === m.toUid && !m.read) {
        // Athlete-side: mark this as read on open.
        markRead(messageId).catch(() => {});
      }
      if (m?.fromUid) {
        getProfile(m.fromUid).then(setSender);
      }
    });
  }, [messageId, uid]);

  useEffect(() => {
    if (!msg || !uid) {
      return;
    }
    const unsubs = [];
    const ids = msg.attachedSkiIds || [];
    for (const skiId of ids) {
      // The athlete owns the attached skis (coach attaches by referencing
      // the athlete's skiIds). Read from users/{toUid}/skis/{skiId}.
      const unsub = subscribeSki(msg.toUid, skiId, data => {
        setAttachedSkis(prev => ({...prev, [skiId]: data}));
      });
      unsubs.push(unsub);
    }
    return () => unsubs.forEach(u => u());
  }, [msg, uid]);

  if (!msg) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar barStyle="light-content" />
        <Header title="Message" />
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.red} />
        </View>
      </SafeAreaView>
    );
  }

  const senderName =
    sender?.displayName || sender?.name || sender?.email || 'Coach';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <Header title={msg.subject || (msg.type === 'advisory' ? 'Race-day plan' : 'Message')} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.senderRow}>
          <Avatar name={senderName} size={40} />
          <View style={styles.senderText}>
            <Text style={styles.senderName} numberOfLines={1}>
              {senderName}
            </Text>
            <Text style={styles.senderTimestamp}>
              {fmtFull(msg.createdAt)}
            </Text>
          </View>
        </View>

        {msg.type === 'advisory' && msg.advisory ? (
          <AdvisoryView
            advisory={msg.advisory}
            body={msg.body}
            attachedSkis={attachedSkis}
            onOpenSki={skiId => navigation.navigate('SkiInfo', {skiId})}
          />
        ) : (
          <>
            <Card>
              <Text style={styles.body}>{msg.body}</Text>
            </Card>

            {msg.attachedSkiIds && msg.attachedSkiIds.length > 0 && (
              <>
                <SectionHeader title="Attached skis" />
                <Card padding={0}>
                  {msg.attachedSkiIds.map((id, i) => {
                    const ski = attachedSkis[id];
                    return (
                      <View key={id} style={styles.attachItem}>
                        <ListItem
                          icon="snow-outline"
                          title={ski?.name || 'Loading…'}
                          subtitle={
                            ski
                              ? [ski.technique, ski.type, ski.grind]
                                  .filter(Boolean)
                                  .join(' · ') || ''
                              : ''
                          }
                          onPress={
                            ski
                              ? () =>
                                  navigation.navigate('SkiInfo', {skiId: id})
                              : undefined
                          }
                          accessibilityLabel={`Open ${ski?.name || 'ski'}`}
                          showDivider={i < msg.attachedSkiIds.length - 1}
                        />
                      </View>
                    );
                  })}
                </Card>
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Advisory rendering ─────────────────────────────────────────────
const AdvisoryView = ({advisory, body, attachedSkis, onOpenSki}) => {
  const recs = advisory.skiRecommendations || [];
  const conditions = advisory.conditions || null;
  const daysUntil = daysFromTodayTo(advisory.eventDate);
  return (
    <>
      <Card style={styles.eventCard}>
        <View style={styles.eventHeaderRow}>
          <View style={styles.eventIconWrap}>
            <Ionicons name="flag" size={20} color={colors.red} />
          </View>
          <View style={styles.eventTextWrap}>
            <Text style={styles.eventTitle} numberOfLines={2}>
              {advisory.event}
            </Text>
            <Text style={styles.eventDate}>
              {formatEventDate(advisory.eventDate)}
              {daysUntil != null && daysUntil >= 0
                ? daysUntil === 0
                  ? ' · today'
                  : daysUntil === 1
                    ? ' · tomorrow'
                    : ` · in ${daysUntil} days`
                : ''}
            </Text>
          </View>
        </View>
      </Card>

      {conditions && hasAnyCondition(conditions) && (
        <>
          <SectionHeader title="Conditions" />
          <Card>
            <View style={styles.conditionsGrid}>
              {!!conditions.snowType && (
                <ConditionTile
                  label="Snow"
                  value={cap(conditions.snowType)}
                  icon="snow-outline"
                />
              )}
              {conditions.snowTemperature != null && (
                <ConditionTile
                  label="Snow temp"
                  value={`${conditions.snowTemperature}°C`}
                  icon="thermometer-outline"
                />
              )}
              {conditions.airTemperature != null && (
                <ConditionTile
                  label="Air temp"
                  value={`${conditions.airTemperature}°C`}
                  icon="cloud-outline"
                />
              )}
              {conditions.humidity != null && (
                <ConditionTile
                  label="Humidity"
                  value={`${conditions.humidity}%`}
                  icon="water-outline"
                />
              )}
              {conditions.newSnow && (
                <ConditionTile
                  label="Snow"
                  value="Falling / fresh"
                  icon="cloudy-night-outline"
                />
              )}
            </View>
            {!!conditions.notes && (
              <Text style={styles.conditionsNotes}>{conditions.notes}</Text>
            )}
          </Card>
        </>
      )}

      <SectionHeader title="Ski plan" />
      {recs.map(rec => {
        const ski = attachedSkis[rec.skiId];
        return (
          <RecCard
            key={rec.skiId}
            rec={rec}
            ski={ski}
            onPress={ski ? () => onOpenSki(rec.skiId) : undefined}
          />
        );
      })}

      {!!body && body !== advisory.event && (
        <>
          <SectionHeader title="Coach's note" />
          <Card>
            <Text style={styles.body}>{body}</Text>
          </Card>
        </>
      )}
    </>
  );
};

const ConditionTile = ({label, value, icon}) => (
  <View style={styles.conditionTile}>
    {!!icon && (
      <Ionicons
        name={icon}
        size={16}
        color={colors.textTertiary}
        style={styles.conditionIcon}
      />
    )}
    <View>
      <Text style={styles.conditionLabel}>{label}</Text>
      <Text style={styles.conditionValue}>{value}</Text>
    </View>
  </View>
);

const RecCard = ({rec, ski, onPress}) => {
  const isPrimary = rec.role === 'primary';
  const accent = isPrimary ? colors.red : colors.amber || '#F59E0B';
  return (
    <Card
      onPress={onPress}
      style={[styles.recCard, {borderColor: accent}]}
      padding={spacing.md}
      accessibilityLabel={`${ski?.name || 'Ski'}, ${rec.role}`}>
      <View style={styles.recRow}>
        <View style={styles.recMeta}>
          <View
            style={[
              styles.rolePill,
              {borderColor: accent, backgroundColor: accent},
            ]}>
            <Text style={[styles.rolePillText, {color: colors.bg}]}>
              {isPrimary ? 'Primary' : 'Backup'}
            </Text>
          </View>
          <Text style={styles.recName} numberOfLines={1}>
            {ski?.name || 'Loading…'}
          </Text>
          {!!ski && (
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
          )}
        </View>
        {!!onPress && (
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.textTertiary}
          />
        )}
      </View>
      {!!rec.notes && (
        <View style={styles.recNotesWrap}>
          <Text style={styles.recNotes}>{rec.notes}</Text>
        </View>
      )}
    </Card>
  );
};

function cap(s) {
  return typeof s === 'string' && s
    ? s[0].toUpperCase() + s.slice(1)
    : s;
}

function hasAnyCondition(c) {
  return (
    c &&
    (c.snowType ||
      c.snowTemperature != null ||
      c.airTemperature != null ||
      c.humidity != null ||
      c.newSnow ||
      c.notes)
  );
}

function formatEventDate(iso) {
  if (typeof iso !== 'string') return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function daysFromTodayTo(iso) {
  if (typeof iso !== 'string') return null;
  const event = new Date(iso);
  if (Number.isNaN(event.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  event.setHours(0, 0, 0, 0);
  return Math.round((event.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.bg},
  loadingWrap: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  senderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  senderText: {flex: 1, marginLeft: spacing.md},
  senderName: {
    ...typography.headingMd,
    color: colors.textPrimary,
  },
  senderTimestamp: {
    ...typography.bodySm,
    color: colors.textTertiary,
    marginTop: 2,
  },
  body: {
    ...typography.bodyLg,
    color: colors.textPrimary,
    lineHeight: 24,
  },
  attachItem: {paddingHorizontal: spacing.lg},

  // ─── Advisory views ────────────────────────────────────────────
  eventCard: {marginBottom: spacing.md},
  eventHeaderRow: {flexDirection: 'row', alignItems: 'center'},
  eventIconWrap: {
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
  eventTextWrap: {flex: 1},
  eventTitle: {
    ...typography.headingLg || typography.headingMd,
    color: colors.textPrimary,
  },
  eventDate: {
    ...typography.bodySm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  conditionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.sm,
  },
  conditionTile: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: '50%',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  conditionIcon: {marginRight: spacing.sm},
  conditionLabel: {
    ...typography.caption,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  conditionValue: {
    ...typography.body,
    color: colors.textPrimary,
    marginTop: 2,
  },
  conditionsNotes: {
    ...typography.bodySm,
    color: colors.textSecondary,
    marginTop: spacing.md,
    lineHeight: 20,
  },
  recCard: {
    marginBottom: spacing.sm,
    borderWidth: 1.5,
  },
  recRow: {flexDirection: 'row', alignItems: 'center'},
  recMeta: {flex: 1, marginRight: spacing.md},
  rolePill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
    marginBottom: spacing.xs,
  },
  rolePillText: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  recName: {
    ...typography.headingMd,
    color: colors.textPrimary,
  },
  pillRow: {flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.xs},
  pillWrap: {marginRight: spacing.xs, marginBottom: spacing.xs},
  recNotesWrap: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  recNotes: {
    ...typography.bodySm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});

export default MessageDetail;
