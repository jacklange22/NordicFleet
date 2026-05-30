import React, {useState, useMemo, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Pressable,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useAuth} from '../context/AuthContext';
import {createSki, getSki, updateSki} from '../services/skiService';
import {isOCRAvailable} from '../services/ocrService';
import {
  Header,
  Input,
  Button,
  Pill,
  Card,
  SectionHeader,
} from '../components/ui';
import {colors, spacing, typography, radius} from '../theme';

const BRAND_OPTIONS = [
  'Fischer',
  'Salomon',
  'Atomic',
  'Madshus',
  'Rossignol',
];
const TECHNIQUE_OPTIONS = ['Classic', 'Skate'];
const TYPE_OPTIONS = ['Cold', 'Universal', 'Warm', 'Zero'];

const ChipGroup = ({options, value, onChange, accessibilityLabel}) => (
  <View
    style={styles.chipRow}
    accessibilityLabel={accessibilityLabel}
    accessibilityRole="radiogroup">
    {options.map(opt => {
      const selected = value?.toLowerCase() === opt.toLowerCase();
      return (
        <View key={opt} style={styles.chipWrap}>
          <Pill
            variant={selected ? 'solid' : 'outline'}
            color="red"
            onPress={() => onChange(selected ? '' : opt)}
            accessibilityLabel={opt}>
            {opt}
          </Pill>
        </View>
      );
    })}
  </View>
);

const AddSkiForm = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {user} = useAuth();
  const uid = user?.uid;

  // Edit mode: same form, pre-filled, saves with updateSki instead of create.
  const editSkiId = route?.params?.editSkiId || null;
  const isEditing = !!editSkiId;

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [customBrand, setCustomBrand] = useState('');
  const [brandIsOther, setBrandIsOther] = useState(false);
  const [model, setModel] = useState('');
  const [technique, setTechnique] = useState('');
  const [type, setType] = useState('');
  const [length, setLength] = useState('');
  const [flex, setFlex] = useState('');
  const [base, setBase] = useState('');
  const [build, setBuild] = useState('');
  const [grind, setGrind] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill when editing an existing ski.
  useEffect(() => {
    if (!isEditing || !uid) {
      return undefined;
    }
    let cancelled = false;
    getSki(uid, editSkiId).then(ski => {
      if (cancelled || !ski) {
        return;
      }
      setName(ski.name || '');
      setModel(ski.model || '');
      setTechnique(ski.technique || '');
      setType(ski.type || '');
      setLength(ski.length != null ? String(ski.length) : '');
      setFlex(ski.flex != null ? String(ski.flex) : '');
      setBase(ski.base || '');
      setBuild(ski.build || '');
      setGrind(ski.grind || '');
      setNotes(ski.notes || '');
      if (BRAND_OPTIONS.includes(ski.brand)) {
        setBrand(ski.brand);
      } else if (ski.brand) {
        setBrandIsOther(true);
        setCustomBrand(ski.brand);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isEditing, uid, editSkiId]);

  const effectiveBrand = brandIsOther ? customBrand.trim() : brand;

  const isValid = useMemo(
    () => !!name.trim() && !!effectiveBrand && !!technique && !!type,
    [name, effectiveBrand, technique, type],
  );

  const handleSubmit = async () => {
    setError('');
    if (!isValid) {
      setError('Display name, brand, technique, and type are required.');
      return;
    }
    if (!uid) {
      setError('Sign in to add a ski.');
      return;
    }
    setSubmitting(true);
    const data = {
      name: name.trim(),
      brand: effectiveBrand,
      model: model.trim(),
      technique,
      type,
      length,
      flex,
      base: base.trim(),
      build: build.trim(),
      grind: grind.trim(),
      notes: notes.trim(),
    };
    try {
      if (isEditing) {
        await updateSki(uid, editSkiId, data);
        Toast.show({
          type: 'success',
          text1: 'Ski updated',
          text2: name.trim(),
          position: 'top',
          visibilityTime: 2000,
        });
        navigation.replace('SkiInfo', {skiId: editSkiId});
      } else {
        const newId = await createSki(uid, data);
        Toast.show({
          type: 'success',
          text1: 'Ski added',
          text2: name.trim(),
          position: 'top',
          visibilityTime: 2200,
        });
        navigation.replace('SkiInfo', {skiId: newId});
      }
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleBrandSelect = b => {
    setBrandIsOther(false);
    setBrand(prev => (prev === b ? '' : b));
  };

  const handleOther = () => {
    setBrand('');
    setBrandIsOther(o => !o);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <Header
        title={isEditing ? 'Edit ski' : 'Add ski'}
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Save"
            disabled={!isValid || submitting}
            onPress={handleSubmit}
            hitSlop={8}
            style={({pressed}) => [
              styles.headerSave,
              (!isValid || submitting) && {opacity: 0.4},
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
          {isOCRAvailable() && (
            <Card
              style={styles.scanCard}
              padding={spacing.md}
              onPress={() => navigation.navigate('ScanSki')}
              accessibilityLabel="Scan ski sticker with the camera">
              <View style={styles.scanRow}>
                <View style={styles.scanIconWrap}>
                  <Ionicons name="scan-outline" size={24} color={colors.red} />
                </View>
                <View style={styles.scanText}>
                  <Text style={styles.scanTitle}>Scan the sticker</Text>
                  <Text style={styles.scanSubtitle}>
                    Auto-fill brand, model, length, and flex from a photo.
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textTertiary}
                />
              </View>
            </Card>
          )}
          <SectionHeader title="Identity" />
          <Text style={styles.sectionHint}>
            The display name is whatever you'll recognize in your fleet. Brand
            and model are the manufacturer's - both show on the ski card.
          </Text>
          <Input
            label="Display name"
            placeholder="e.g. Cold skate, Race classic"
            icon="bookmark-outline"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
          <View style={styles.fieldSpacer} />
          <Text style={styles.miniLabel}>Brand</Text>
          <View style={styles.chipRow}>
            {BRAND_OPTIONS.map(b => {
              const selected = brand === b;
              return (
                <View key={b} style={styles.chipWrap}>
                  <Pill
                    variant={selected ? 'solid' : 'outline'}
                    color="red"
                    onPress={() => handleBrandSelect(b)}>
                    {b}
                  </Pill>
                </View>
              );
            })}
            <View style={styles.chipWrap}>
              <Pill
                variant={brandIsOther ? 'solid' : 'outline'}
                color="red"
                onPress={handleOther}>
                Other
              </Pill>
            </View>
          </View>
          {brandIsOther && (
            <>
              <View style={styles.fieldSpacer} />
              <Input
                label="Brand name"
                icon="business-outline"
                value={customBrand}
                onChangeText={setCustomBrand}
                autoCapitalize="words"
              />
            </>
          )}
          <View style={styles.fieldSpacer} />
          <Input
            label="Model"
            placeholder="e.g. Speedmax 3D, Redster S9"
            icon="layers-outline"
            value={model}
            onChangeText={setModel}
            autoCapitalize="words"
          />

          <SectionHeader title="Specs" />
          <Text style={styles.miniLabel}>Technique</Text>
          <ChipGroup
            options={TECHNIQUE_OPTIONS}
            value={technique}
            onChange={setTechnique}
            accessibilityLabel="Technique"
          />
          <View style={styles.fieldSpacer} />
          <Text style={styles.miniLabel}>Type</Text>
          <ChipGroup
            options={TYPE_OPTIONS}
            value={type}
            onChange={setType}
            accessibilityLabel="Type"
          />
          <View style={styles.fieldSpacer} />
          <View style={styles.row2}>
            <View style={styles.row2Cell}>
              <Input
                label="Length"
                icon="resize-outline"
                value={length}
                onChangeText={setLength}
                keyboardType="number-pad"
                suffix="cm"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <View style={styles.row2Spacer} />
            <View style={styles.row2Cell}>
              <Input
                label="Flex"
                icon="pulse-outline"
                value={flex}
                onChangeText={setFlex}
                keyboardType="number-pad"
                suffix="kg"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <SectionHeader title="Setup" />
          <Input
            label="Base"
            icon="snow-outline"
            value={base}
            onChangeText={setBase}
            autoCapitalize="words"
          />
          <View style={styles.fieldSpacer} />
          <Input
            label="Build"
            icon="construct-outline"
            value={build}
            onChangeText={setBuild}
            autoCapitalize="words"
          />
          <View style={styles.fieldSpacer} />
          <Input
            label="Grind"
            icon="grid-outline"
            value={grind}
            onChangeText={setGrind}
            autoCapitalize="words"
          />

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
            onPress={handleSubmit}>
            Save ski
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
    paddingBottom: spacing['4xl'],
  },
  scanCard: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  scanRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scanIconWrap: {
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
  scanText: {flex: 1},
  scanTitle: {
    ...typography.headingMd,
    color: colors.textPrimary,
  },
  scanSubtitle: {
    ...typography.bodySm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  headerSave: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  headerSaveText: {
    ...typography.headingMd,
    color: colors.red,
  },
  miniLabel: {
    ...typography.caption,
    color: colors.textTertiary,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  sectionHint: {
    ...typography.bodySm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
    lineHeight: 18,
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
  row2: {
    flexDirection: 'row',
  },
  row2Cell: {flex: 1},
  row2Spacer: {width: spacing.md},
  error: {
    ...typography.body,
    color: colors.red,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});

export default AddSkiForm;
