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
import {subscribeMessagesForAthlete} from '../services/messageService';
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

const MessageRow = ({msg, onPress}) => (
  <Card
    onPress={onPress}
    accessibilityLabel={`Open message${msg.subject ? `: ${msg.subject}` : ''}`}
    style={styles.msgCard}>
    <View style={styles.msgRow}>
      {!msg.read && <View style={styles.unreadDot} />}
      <View style={styles.msgMain}>
        <View style={styles.msgTopRow}>
          <Text
            style={[styles.msgSubject, !msg.read && styles.msgSubjectUnread]}
            numberOfLines={1}>
            {msg.subject || 'Message from your coach'}
          </Text>
          <Text style={styles.msgDate}>{fmtDate(msg.createdAt)}</Text>
        </View>
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
    return subscribeMessagesForAthlete(uid, list => {
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
              description="Messages from your coach will appear here. Once a coach accepts your request they can send you wax tips, race recaps, and ski recommendations."
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
  msgTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
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
