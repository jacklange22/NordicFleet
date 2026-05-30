import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import {useAuth} from '../context/AuthContext';
import {subscribeMessagesForUser} from '../services/messageService';
import {Header, Card, EmptyState, TabBar} from '../components/ui';
import {colors, spacing, typography} from '../theme';

const fmtDate = raw => {
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
  const now = Date.now();
  const diff = now - d.getTime();
  const day = 24 * 60 * 60 * 1000;
  if (diff < day) {
    return d.toLocaleTimeString(undefined, {hour: 'numeric', minute: '2-digit'});
  }
  if (diff < 7 * day) {
    return d.toLocaleDateString(undefined, {weekday: 'short'});
  }
  return d.toLocaleDateString(undefined, {month: 'short', day: 'numeric'});
};

const MessageRow = ({msg, onPress}) => {
  const isSent = msg.direction === 'sent';
  // Unread dot only for messages YOU received and have not opened. A message
  // you sent is never "unread" for you (its read flag tracks the recipient).
  const showUnread = !isSent && !msg.read;
  const subject = isSent
    ? msg.subject || 'You sent a message'
    : msg.subject || 'Message from your coach';
  return (
    <Card
      onPress={onPress}
      accessibilityLabel={`Open ${isSent ? 'sent ' : ''}message${
        msg.subject ? `: ${msg.subject}` : ''
      }`}
      style={styles.msgCard}>
      <View style={styles.msgRow}>
        {showUnread && <View style={styles.unreadDot} />}
        <View style={styles.msgMain}>
          <View style={styles.msgMetaRow}>
            <Text style={styles.msgDirection}>
              {isSent ? (msg.read ? 'Sent · Read' : 'Sent') : 'Received'}
            </Text>
            <Text style={styles.msgDate}>{fmtDate(msg.createdAt)}</Text>
          </View>
          <Text
            style={[styles.msgSubject, showUnread && styles.msgSubjectUnread]}
            numberOfLines={1}>
            {subject}
          </Text>
          <Text style={styles.msgPreview} numberOfLines={2}>
            {msg.body}
          </Text>
          {!!(msg.attachedSkiIds && msg.attachedSkiIds.length) && (
            <View style={styles.attachRow}>
              <Ionicons
                name="link-outline"
                size={14}
                color={colors.textTertiary}
              />
              <Text style={styles.attachText}>
                {msg.attachedSkiIds.length} ski
                {msg.attachedSkiIds.length === 1 ? '' : 's'} attached
              </Text>
            </View>
          )}
        </View>
      </View>
    </Card>
  );
};

const Spacer = () => <View style={styles.rowSpacer} />;

const MessagesScreen = () => {
  const navigation = useNavigation();
  const {user} = useAuth();
  const uid = user?.uid;

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setMessages([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    return subscribeMessagesForUser(uid, list => {
      setMessages(list);
      setLoading(false);
    });
  }, [uid]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <Header title="Messages" left={null} />
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.red} />
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.scroll}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <MessageRow
              msg={item}
              onPress={() =>
                navigation.navigate('MessageDetail', {messageId: item.id})
              }
            />
          )}
          ItemSeparatorComponent={Spacer}
          ListEmptyComponent={
            <EmptyState
              icon="chatbubble-outline"
              title="No messages yet"
              description="Messages you send and receive appear here. A coach can send you wax tips, race recaps, and ski recommendations once you are linked."
            />
          }
        />
      )}
      <TabBar />
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
    flexGrow: 1,
  },
  msgCard: {},
  msgRow: {flexDirection: 'row', alignItems: 'flex-start'},
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.red,
    marginTop: 8,
    marginRight: spacing.md,
  },
  msgMain: {flex: 1},
  msgMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  msgDirection: {
    ...typography.caption,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  msgSubject: {
    ...typography.headingMd,
    color: colors.textSecondary,
    flex: 1,
    marginRight: spacing.sm,
  },
  msgSubjectUnread: {color: colors.textPrimary, fontWeight: '700'},
  msgDate: {
    ...typography.bodySm,
    color: colors.textTertiary,
  },
  msgPreview: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 21,
  },
  attachRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  attachText: {
    ...typography.bodySm,
    color: colors.textTertiary,
    marginLeft: spacing.xs,
  },
  rowSpacer: {height: spacing.md},
});

export default MessagesScreen;
