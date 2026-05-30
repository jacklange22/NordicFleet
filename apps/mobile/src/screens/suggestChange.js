import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import Toast from 'react-native-toast-message';

import {useAuth} from '../context/AuthContext';
import {createSuggestion} from '../services/fleetSuggestionService';
import {Header, Card, Input, Button, SectionHeader} from '../components/ui';
import {colors, spacing, typography} from '../theme';

// Coach proposes a change to one of an athlete's skis. The athlete reviews
// and accepts/rejects it (Coach suggestions inbox); nothing is written to the
// athlete's ski until they accept. Rules require the coach to have comment
// (or edit) permission.
const SuggestChangeScreen = ({route}) => {
  const navigation = useNavigation();
  const {user} = useAuth();
  const coachUid = user?.uid;
  const skiId = route?.params?.skiId;
  const athleteUid = route?.params?.ownerUid;
  const skiName = route?.params?.skiName || 'this ski';

  const [flex, setFlex] = useState('');
  const [grind, setGrind] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const buildChanges = () => {
    const changes = {};
    const f = flex.trim();
    if (f !== '' && Number.isFinite(Number(f))) {
      changes.flex = Number(f);
    }
    if (grind.trim() !== '') {
      changes.grind = grind.trim();
    }
    return changes;
  };

  const handleSubmit = async () => {
    if (!coachUid || !athleteUid || !skiId) {
      return;
    }
    const changes = buildChanges();
    if (Object.keys(changes).length === 0 && !comment.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Add a change or a comment',
        position: 'top',
        visibilityTime: 2200,
      });
      return;
    }
    setSubmitting(true);
    try {
      await createSuggestion({
        coachUid,
        athleteUid,
        targetType: 'ski',
        targetId: skiId,
        suggestedChanges: changes,
        comment,
      });
      Toast.show({
        type: 'success',
        text1: 'Suggestion sent',
        text2: 'Your athlete can accept or reject it.',
        position: 'top',
        visibilityTime: 2200,
      });
      navigation.goBack();
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Could not suggest',
        text2: String(err.message || err),
        position: 'top',
        visibilityTime: 2600,
      });
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <Header title="Suggest a change" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled">
          <Text style={styles.intro}>
            Propose a change to {skiName}. Your athlete reviews it and chooses
            whether to apply it - nothing changes until they accept.
          </Text>

          <SectionHeader title="Suggested values (optional)" />
          <Card>
            <Input
              label="Flex"
              icon="barbell-outline"
              value={flex}
              onChangeText={setFlex}
              keyboardType="decimal-pad"
              suffix="kg"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.fieldSpacer} />
            <Input
              label="Grind"
              icon="layers-outline"
              value={grind}
              onChangeText={setGrind}
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </Card>

          <SectionHeader title="Comment" />
          <Card>
            <Input
              label="Note to your athlete"
              icon="create-outline"
              value={comment}
              onChangeText={setComment}
              multiline
            />
          </Card>

          <View style={styles.fieldSpacer} />
          <Button
            variant="primary"
            size="lg"
            fullWidth
            icon="send"
            loading={submitting}
            onPress={handleSubmit}>
            Send suggestion
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
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
  intro: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 21,
  },
  fieldSpacer: {height: spacing.lg},
});

export default SuggestChangeScreen;
