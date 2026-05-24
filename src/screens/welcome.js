import React from 'react';
import {View, Text, Image, StyleSheet, StatusBar} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {Button} from '../components/ui';
import {colors, spacing, typography} from '../theme';

const FEATURES = [
  {
    icon: 'stats-chart-outline',
    text: 'Track every wax & test session',
  },
  {
    icon: 'people-outline',
    text: "Share your fleet with your coach",
  },
  {
    icon: 'cloud-offline-outline',
    text: 'Works offline, syncs automatically',
  },
];

const WelcomeScreen = ({navigation}) => (
  <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
    <StatusBar barStyle="light-content" />
    <View style={styles.heroBlock}>
      <Image
        source={require('../assets/nordicfleet.png')}
        style={styles.logo}
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
      <Text style={styles.title}>NordicFleet</Text>
      <Text style={styles.subtitle}>
        Track and manage your nordic skis like a pro team.
      </Text>
    </View>

    <View style={styles.featureBlock}>
      {FEATURES.map(f => (
        <View key={f.icon} style={styles.featureRow}>
          <View style={styles.featureIconWrap}>
            <Ionicons name={f.icon} size={20} color={colors.red} />
          </View>
          <Text style={styles.featureText}>{f.text}</Text>
        </View>
      ))}
    </View>

    <View style={styles.actions}>
      <Button
        variant="primary"
        size="lg"
        icon="arrow-forward"
        iconRight
        fullWidth
        onPress={() => navigation.navigate('Signup')}>
        Get started
      </Button>
      <View style={{height: spacing.sm}} />
      <Button
        variant="ghost"
        size="md"
        fullWidth
        onPress={() => navigation.navigate('Login')}>
        I already have an account
      </Button>
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing['2xl'],
    justifyContent: 'space-between',
    paddingBottom: spacing.lg,
  },
  heroBlock: {
    alignItems: 'center',
    paddingTop: spacing['4xl'],
  },
  logo: {
    width: 200,
    height: undefined,
    aspectRatio: 1298 / 852,
    resizeMode: 'contain',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.displayLg,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.bodyLg,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 22,
  },
  featureBlock: {
    paddingHorizontal: spacing.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  featureIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(229, 57, 53, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  featureText: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  actions: {
    paddingBottom: spacing.md,
  },
});

export default WelcomeScreen;
