import React, {useState, useMemo} from 'react';
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
import {useNavigation} from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import {useAuth} from '../context/AuthContext';
import {createSki} from '../services/skiService';
import {
  Header,
  Input,
  Button,
  Pill,
  SectionHeader,
} from '../components/ui';
import {colors, spacing, typography} from '../theme';

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
  const {user} = useAuth();
  const uid = user?.uid;

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

  const effectiveBrand = brandIsOther ? customBrand.trim() : brand;

  const isValid = useMemo(
    () => !!name.trim() && !!effectiveBrand && !!technique && !!type,
    [name, effectiveBrand, technique, type],
  );

  const handleSubmit = async () => {
    setError('');
    if (!isValid) {
      setError('Name, brand, technique, and type are required.');
      return;
    }
    if (!uid) {
      setError('Sign in to add a ski.');
      return;
    }
    setSubmitting(true);
    try {
      const newId = await createSki(uid, {
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
      });
      Toast.show({
        type: 'success',
        text1: 'Ski added',
        text2: name.trim(),
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
        title="Add ski"
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
          keyboardShouldPersistTaps="handled">
          <SectionHeader title="Identity" />
          <Input
            label="Ski name"
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
                keyboardType="numeric"
                suffix="cm"
              />
            </View>
            <View style={styles.row2Spacer} />
            <View style={styles.row2Cell}>
              <Input
                label="Flex"
                icon="pulse-outline"
                value={flex}
                onChangeText={setFlex}
                keyboardType="numeric"
                suffix="kg"
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
