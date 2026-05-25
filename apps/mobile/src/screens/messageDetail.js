import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';

import {useAuth} from '../context/AuthContext';
import {getMessage, markRead} from '../services/messageService';
import {getProfile} from '../services/userService';
import {subscribeSki} from '../services/skiService';
import {Header, Card, Avatar, ListItem, SectionHeader} from '../components/ui';
import {colors, spacing, typography} from '../theme';

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
      <Header title={msg.subject || 'Message'} />
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
                          ? () => navigation.navigate('SkiInfo', {skiId: id})
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
      </ScrollView>
    </SafeAreaView>
  );
};

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
});

export default MessageDetail;
