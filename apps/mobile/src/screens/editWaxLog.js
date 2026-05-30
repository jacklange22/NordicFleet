import React, {useState, useEffect, useMemo} from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import Toast from 'react-native-toast-message';

import {useAuth} from '../context/AuthContext';
import useSkis from '../hooks/useSkis';
import useUnsavedGuard from '../hooks/useUnsavedGuard';
import {waxLogHasContent} from '@nordicfleet/core';
import {getWaxLog, updateWaxLog} from '../services/waxLogService';
import {WaxEntryCard, emptyWaxEntry} from './waxinglog';
import {Header, Button, TabBar} from '../components/ui';
import {colors, spacing, typography} from '../theme';

const EditWaxLogScreen = ({route}) => {
  const navigation = useNavigation();
  const {user} = useAuth();
  const uid = user?.uid;
  const logId = route?.params?.logId;
  const skiId = route?.params?.skiId;

  // includeRetired so a log on a retired ski is still editable.
  const {skis} = useSkis(uid, {includeRetired: true});

  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [dirty, setDirty] = useState(false);

  // Warn before a tab tap / back discards an in-progress edit.
  useUnsavedGuard(dirty);

  const ski = useMemo(
    () =>
      skis.find(s => s.id === skiId) || {
        id: skiId,
        name: 'Ski',
        technique: '',
      },
    [skis, skiId],
  );

  useEffect(() => {
    let active = true;
    if (!uid || !logId) {
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    getWaxLog(uid, logId)
      .then(log => {
        if (!active) {
          return;
        }
        if (log) {
          const base = emptyWaxEntry();
          setEntry({
            ...base,
            binder: log.binder || '',
            kickLayers: log.kickLayers ?? base.kickLayers,
            kickWax: log.kickWax || '',
            glideLayers: log.glideLayers ?? base.glideLayers,
            glideWaxes:
              Array.isArray(log.glideWaxes) && log.glideWaxes.length
                ? log.glideWaxes
                : base.glideWaxes,
            notes: log.notes || '',
          });
        } else {
          setEntry(null);
        }
        setLoading(false);
      })
      .catch(() => {
        if (active) {
          setError('Could not load this wax log.');
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [uid, logId]);

  const handleChange = partial => {
    setEntry(prev => ({...prev, ...partial}));
    setDirty(true);
  };

  const canSave = !!uid && !!logId && !!entry && !submitting;

  const handleSave = async () => {
    setError('');
    if (!uid || !logId || !entry) {
      return;
    }
    if (!waxLogHasContent(entry)) {
      setError('Add a wax (binder, kick, or glide) or a note before saving.');
      return;
    }
    setSubmitting(true);
    const technique = (ski.technique || '').toLowerCase();
    const payload = {
      ...entry,
      binder: entry.binder && entry.binder !== 'None' ? entry.binder : null,
    };
    if (technique === 'skate') {
      payload.kickLayers = 0;
      payload.kickWax = null;
    }
    try {
      await updateWaxLog(uid, logId, payload);
    } catch (err) {
      const code = err && err.code;
      if (code && !String(code).includes('unavailable')) {
        setError(String(err.message || err));
        setSubmitting(false);
        return;
      }
    }
    setSubmitting(false);
    setDirty(false); // saved - don't prompt on the goBack pop
    Toast.show({
      type: 'success',
      text1: 'Wax updated',
      position: 'top',
      visibilityTime: 2000,
    });
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <Header
        title="Edit wax"
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Save"
            disabled={!canSave}
            onPress={handleSave}
            hitSlop={8}
            style={({pressed}) => [
              styles.headerSave,
              !canSave && {opacity: 0.4},
              pressed && {opacity: 0.6},
            ]}>
            <Text style={styles.headerSaveText}>Save</Text>
          </Pressable>
        }
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled">
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={colors.red} />
            </View>
          ) : !entry ? (
            <Text style={styles.notFound}>This wax log could not be found.</Text>
          ) : (
            <>
              <WaxEntryCard
                ski={ski}
                entry={entry}
                onChange={handleChange}
                collapsible={false}
                expanded
                onToggle={() => {}}
              />

              {!!error && <Text style={styles.error}>{error}</Text>}

              <View style={styles.fieldSpacer} />
              <Button
                variant="primary"
                size="lg"
                fullWidth
                icon="checkmark"
                loading={submitting}
                disabled={!entry}
                onPress={handleSave}>
                Save changes
              </Button>
            </>
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
  headerSave: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  headerSaveText: {
    ...typography.headingMd,
    color: colors.red,
  },
  loadingWrap: {
    paddingVertical: spacing['4xl'],
    alignItems: 'center',
  },
  notFound: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing['4xl'],
  },
  fieldSpacer: {height: spacing.lg},
  error: {
    ...typography.body,
    color: colors.red,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});

export default EditWaxLogScreen;
