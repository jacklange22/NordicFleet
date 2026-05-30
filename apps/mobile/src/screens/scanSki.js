// ScanSki - camera → OCR → review-and-save flow for adding a ski.
//
// The user lands here from the AddSki screen ("Scan sticker" CTA),
// snaps or picks an image, the NFOCR native module runs Apple Vision
// on it, the sticker parser figures out which line is brand / model /
// length / etc., and the user lands on a review form that's already
// 80% filled out. Tap Save and we createSki() and bounce to SkiInfo
// just like the manual form.
//
// Three phases:
//   idle       - hero + "Take photo" / "Choose from library"
//   processing - thumbnail + spinner ("Reading sticker…")
//   review     - thumbnail (small) + editable fields with confidence
//                badges + Save
//
// Failure handling: any phase can return to idle with a Toast. The
// user is never trapped in a "loading forever" state.

import React, {useState, useMemo} from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Pressable,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import Toast from 'react-native-toast-message';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {parseStickerText, toSkiInput} from '@nordicfleet/core';
import {useAuth} from '../context/AuthContext';
import {createSki} from '../services/skiService';
import {recognizeTextLines, isOCRAvailable} from '../services/ocrService';
import {
  Header,
  Input,
  Button,
  Pill,
  Card,
  SectionHeader,
  EmptyState,
} from '../components/ui';
import {colors, spacing, typography, radius} from '../theme';

const TECHNIQUE_OPTIONS = ['Classic', 'Skate'];
const TYPE_OPTIONS = ['Cold', 'Universal', 'Warm', 'Zero'];

const CONFIDENCE_COLOR = {
  high: colors.success || '#22C55E',
  medium: '#F59E0B',
  low: colors.textTertiary,
};

const CONFIDENCE_LABEL = {
  high: 'Detected',
  medium: 'Likely',
  low: 'Maybe',
};

// ─── Confidence chip - small dot + word, sits next to a field label ───
const ConfidenceChip = ({confidence}) => {
  if (!confidence) {
    return null;
  }
  return (
    <View style={styles.confChip}>
      <View
        style={[
          styles.confDot,
          {backgroundColor: CONFIDENCE_COLOR[confidence] || colors.textTertiary},
        ]}
      />
      <Text style={styles.confText}>{CONFIDENCE_LABEL[confidence]}</Text>
    </View>
  );
};

const ScanSkiScreen = () => {
  const navigation = useNavigation();
  const {user} = useAuth();
  const uid = user?.uid;

  const [phase, setPhase] = useState('idle'); // idle | processing | review
  const [imageUri, setImageUri] = useState(null);
  const [parsed, setParsed] = useState(null); // ParsedSticker
  const [error, setError] = useState('');

  // Editable state - initialized from parsed when we enter review.
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [technique, setTechnique] = useState('');
  const [type, setType] = useState('');
  const [length, setLength] = useState('');
  const [flex, setFlex] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const ocrAvailable = isOCRAvailable();

  const isValid = useMemo(
    () =>
      !!brand.trim() && !!model.trim() && !!technique && !!type,
    [brand, model, technique, type],
  );

  const startWithImage = async uri => {
    setImageUri(uri);
    setPhase('processing');
    setError('');
    try {
      const lines = await recognizeTextLines(uri);
      const p = parseStickerText(lines);
      const prefill = toSkiInput(p);
      setParsed(p);
      // Pre-fill - toSkiInput already returns plain values.
      setBrand(prefill.brand || '');
      setModel(prefill.model || '');
      setTechnique(prefill.technique || '');
      setType(prefill.type || '');
      setLength(prefill.length != null ? String(prefill.length) : '');
      setFlex(prefill.flex != null ? String(prefill.flex) : '');
      setNotes('');
      setPhase('review');
    } catch (err) {
      console.warn('[ScanSki] OCR failed', err);
      setError(
        err && err.message
          ? err.message
          : 'Could not read the sticker. Try a clearer photo.',
      );
      setPhase('idle');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.9,
        includeBase64: false,
        saveToPhotos: false,
        cameraType: 'back',
      });
      if (result.didCancel || !result.assets || result.assets.length === 0) {
        return;
      }
      const uri = result.assets[0].uri;
      if (!uri) {
        return;
      }
      await startWithImage(uri);
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Camera unavailable',
        text2: String(err?.message || err),
        position: 'top',
        visibilityTime: 2400,
      });
    }
  };

  const handlePickFromLibrary = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.9,
        includeBase64: false,
        selectionLimit: 1,
      });
      if (result.didCancel || !result.assets || result.assets.length === 0) {
        return;
      }
      const uri = result.assets[0].uri;
      if (!uri) {
        return;
      }
      await startWithImage(uri);
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Library unavailable',
        text2: String(err?.message || err),
        position: 'top',
        visibilityTime: 2400,
      });
    }
  };

  const handleRetake = () => {
    setPhase('idle');
    setImageUri(null);
    setParsed(null);
    setError('');
  };

  const handleSave = async () => {
    if (!isValid) {
      setError('Brand, model, technique, and type are required.');
      return;
    }
    if (!uid) {
      setError('Sign in to add a ski.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const name = `${brand.trim()} ${model.trim()}`.trim();
      const newId = await createSki(uid, {
        name,
        brand: brand.trim(),
        model: model.trim(),
        technique,
        type,
        length,
        flex,
        notes: notes.trim(),
      });
      Toast.show({
        type: 'success',
        text1: 'Ski added from sticker',
        text2: name,
        position: 'top',
        visibilityTime: 2200,
      });
      navigation.replace('SkiInfo', {skiId: newId});
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <Header
        title="Scan ski sticker"
        left={
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
          </Pressable>
        }
      />

      {phase === 'idle' && (
        <ScrollView contentContainerStyle={styles.idleScroll}>
          {!ocrAvailable ? (
            <EmptyState
              icon="phone-portrait-outline"
              title="OCR is iOS-only"
              description="Sticker scanning uses Apple Vision and only runs on iPhone. On other devices, add your ski manually."
              cta={{
                label: 'Add manually',
                icon: 'create-outline',
                onPress: () => navigation.replace('newSki'),
              }}
            />
          ) : (
            <View style={styles.hero}>
              <View style={styles.heroIconWrap}>
                <Ionicons name="scan-outline" size={64} color={colors.red} />
              </View>
              <Text style={styles.heroTitle}>Snap the sticker</Text>
              <Text style={styles.heroSubtitle}>
                Aim at the white sticker on the topsheet of your ski.
                Brand, model, length, and flex auto-fill - you confirm
                before saving.
              </Text>
              {!!error && <Text style={styles.error}>{error}</Text>}

              <View style={styles.actionsWrap}>
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  icon="camera-outline"
                  onPress={handleTakePhoto}>
                  Take photo
                </Button>
                <View style={styles.actionSpacer} />
                <Button
                  variant="secondary"
                  size="lg"
                  fullWidth
                  icon="images-outline"
                  onPress={handlePickFromLibrary}>
                  Choose from library
                </Button>
              </View>
              <View style={styles.fineprint}>
                <Text style={styles.fineprintText}>
                  Photos stay on your device - Vision runs offline.
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {phase === 'processing' && (
        <View style={styles.processing}>
          {!!imageUri && (
            <Image source={{uri: imageUri}} style={styles.processingImage} />
          )}
          <ActivityIndicator color={colors.red} size="large" />
          <Text style={styles.processingText}>Reading sticker…</Text>
        </View>
      )}

      {phase === 'review' && (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={styles.reviewScroll}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled">
            {!!imageUri && (
              <Card style={styles.previewCard} padding={spacing.sm}>
                <View style={styles.previewRow}>
                  <Image source={{uri: imageUri}} style={styles.previewThumb} />
                  <View style={styles.previewMeta}>
                    <Text style={styles.previewTitle}>What we read</Text>
                    <Text style={styles.previewSub}>
                      {parsed && parsed.rawLines?.length
                        ? `${parsed.rawLines.length} line${parsed.rawLines.length === 1 ? '' : 's'} detected`
                        : 'no lines detected'}
                    </Text>
                    <Pressable
                      onPress={handleRetake}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel="Retake photo">
                      <Text style={styles.retakeLink}>↻ Retake</Text>
                    </Pressable>
                  </View>
                </View>
              </Card>
            )}

            <SectionHeader title="Identity" />
            <FieldLabel
              text="Brand"
              confidence={parsed?.brand?.confidence}
            />
            <Input
              icon="business-outline"
              value={brand}
              onChangeText={setBrand}
              autoCapitalize="words"
            />
            <View style={styles.fieldSpacer} />
            <FieldLabel
              text="Model"
              confidence={parsed?.model?.confidence}
            />
            <Input
              icon="layers-outline"
              value={model}
              onChangeText={setModel}
              autoCapitalize="words"
            />

            <SectionHeader title="Specs" />
            <FieldLabel
              text="Technique"
              confidence={parsed?.technique?.confidence}
            />
            <ChipRow
              options={TECHNIQUE_OPTIONS}
              value={technique}
              onChange={setTechnique}
            />
            <View style={styles.fieldSpacer} />
            <FieldLabel
              text="Type"
              confidence={parsed?.type?.confidence}
            />
            <ChipRow options={TYPE_OPTIONS} value={type} onChange={setType} />
            <View style={styles.fieldSpacer} />

            <View style={styles.row2}>
              <View style={styles.row2Cell}>
                <FieldLabel
                  text="Length"
                  confidence={parsed?.length?.confidence}
                />
                <Input
                  icon="resize-outline"
                  value={length}
                  onChangeText={setLength}
                  keyboardType="number-pad"
                  suffix="cm"
                />
              </View>
              <View style={styles.row2Spacer} />
              <View style={styles.row2Cell}>
                <FieldLabel
                  text="Flex"
                  confidence={parsed?.flex?.confidence}
                />
                <Input
                  icon="pulse-outline"
                  value={flex}
                  onChangeText={setFlex}
                  keyboardType="number-pad"
                  suffix="kg"
                />
              </View>
            </View>

            <SectionHeader title="Notes" />
            <Input
              label="Notes (optional)"
              icon="create-outline"
              value={notes}
              onChangeText={setNotes}
              multiline
            />

            {!!error && <Text style={styles.error}>{error}</Text>}

            <View style={styles.fieldSpacer} />
            <Button
              variant="primary"
              size="lg"
              fullWidth
              icon="checkmark"
              loading={submitting}
              disabled={!isValid}
              onPress={handleSave}>
              Save ski
            </Button>
            <View style={styles.fieldSpacer} />
            <Button
              variant="ghost"
              size="md"
              fullWidth
              icon="refresh"
              onPress={handleRetake}>
              Try a different photo
            </Button>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
};

// ─── Helpers ────────────────────────────────────────────────────────
const FieldLabel = ({text, confidence}) => (
  <View style={styles.fieldLabelRow}>
    <Text style={styles.miniLabel}>{text}</Text>
    <ConfidenceChip confidence={confidence} />
  </View>
);

const ChipRow = ({options, value, onChange}) => (
  <View style={styles.chipRow} accessibilityRole="radiogroup">
    {options.map(opt => {
      const selected = value?.toLowerCase() === opt.toLowerCase();
      return (
        <View key={opt} style={styles.chipWrap}>
          <Pill
            variant={selected ? 'solid' : 'outline'}
            color="red"
            onPress={() => onChange(selected ? '' : opt)}>
            {opt}
          </Pill>
        </View>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.bg},
  flex: {flex: 1},
  idleScroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  hero: {
    flex: 1,
    paddingTop: spacing['3xl'],
    alignItems: 'center',
  },
  heroIconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  heroTitle: {
    ...typography.displayMd,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  heroSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 340,
    marginBottom: spacing['2xl'],
  },
  actionsWrap: {
    width: '100%',
    paddingHorizontal: spacing.lg,
  },
  actionSpacer: {height: spacing.md},
  fineprint: {marginTop: spacing.xl, paddingHorizontal: spacing.lg},
  fineprintText: {
    ...typography.caption,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  processing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  processingImage: {
    width: 200,
    height: 200,
    borderRadius: radius.lg,
    marginBottom: spacing['2xl'],
  },
  processingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.lg,
  },
  reviewScroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  previewCard: {marginTop: spacing.lg, marginBottom: spacing.md},
  previewRow: {flexDirection: 'row', alignItems: 'center'},
  previewThumb: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    marginRight: spacing.md,
  },
  previewMeta: {flex: 1},
  previewTitle: {...typography.headingMd, color: colors.textPrimary},
  previewSub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.xs,
  },
  retakeLink: {
    ...typography.bodySm,
    color: colors.red,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  miniLabel: {
    ...typography.caption,
    color: colors.textTertiary,
    flex: 1,
  },
  confChip: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  confText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.xs,
  },
  chipWrap: {
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  fieldSpacer: {height: spacing.lg},
  row2: {flexDirection: 'row'},
  row2Cell: {flex: 1},
  row2Spacer: {width: spacing.md},
  error: {
    ...typography.body,
    color: colors.red,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});

export default ScanSkiScreen;
