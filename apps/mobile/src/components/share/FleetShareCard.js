import React, {forwardRef} from 'react';
import {View, Text, StyleSheet, Image} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {colors, radius, spacing, typography} from '../../theme';

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
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * 1080×2400 tall share card: athlete name + headline stats + a compact
 * row per ski. Renders all skis (no truncation). Caller passes ref via
 * forwardRef so shareSnapshot can capture it.
 */
const FleetShareCard = forwardRef(
  ({profile, skis = [], totalWaxes = 0, totalTests = 0}, ref) => {
    const displayName =
      profile?.displayName ||
      (profile?.email ? profile.email.split('@')[0] : 'My fleet');

    return (
      <View ref={ref} collapsable={false} style={styles.card}>
        <View style={styles.brandRow}>
          <Image
            source={require('../../assets/nordicfleet.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.brand}>NordicFleet</Text>
        </View>

        <Text style={styles.heroName} numberOfLines={2}>
          {displayName}
        </Text>
        <Text style={styles.subhead}>
          {`${skis.length} ${skis.length === 1 ? 'ski' : 'skis'}`}
        </Text>

        <View style={styles.statRow}>
          <StatBox value={skis.length} label="Skis" />
          <StatBox value={totalWaxes} label="Wax logs" />
          <StatBox value={totalTests} label="Tests" />
        </View>

        <View style={styles.fleetBlock}>
          <Text style={styles.fleetTitle}>The fleet</Text>
          {skis.length === 0 ? (
            <Text style={styles.fleetEmpty}>No skis yet</Text>
          ) : (
            skis.map(ski => (
              <View key={ski.id} style={styles.fleetRow}>
                <View
                  style={[
                    styles.accentBar,
                    {
                      backgroundColor:
                        (ski.technique || '').toLowerCase() === 'skate'
                          ? colors.redDim
                          : colors.red,
                    },
                  ]}
                />
                <View style={styles.fleetText}>
                  <Text style={styles.fleetName} numberOfLines={1}>
                    {ski.name || 'Unnamed ski'}
                  </Text>
                  <Text style={styles.fleetMeta} numberOfLines={1}>
                    {[ski.technique, ski.type, ski.grind]
                      .filter(Boolean)
                      .join(' · ') || '-'}
                  </Text>
                </View>
                <View style={styles.fleetRight}>
                  <Text style={styles.fleetSpec}>
                    {ski.length ? `${ski.length}cm` : '-'}
                  </Text>
                  <Text style={styles.fleetSpecLabel}>length</Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.footer}>
          <Ionicons
            name="snow-outline"
            size={14}
            color={colors.textTertiary}
          />
          <Text style={styles.footerText}>
            Tracked with NordicFleet · {fmtDate(new Date())}
          </Text>
        </View>
      </View>
    );
  },
);

const StatBox = ({value, label}) => (
  <View style={styles.statBox}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    width: 1080,
    minHeight: 1080,
    backgroundColor: colors.bg,
    padding: 64,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 56,
  },
  logo: {width: 56, height: 56},
  brand: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.6,
    marginLeft: spacing.md,
  },
  heroName: {
    fontSize: 80,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -1.5,
    marginBottom: spacing.sm,
  },
  subhead: {
    fontSize: 32,
    color: colors.textSecondary,
    marginBottom: 48,
  },
  statRow: {
    flexDirection: 'row',
    marginBottom: 48,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 32,
    paddingHorizontal: 24,
    marginHorizontal: 8,
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: 64,
    fontWeight: '700',
    letterSpacing: -1,
    marginBottom: 8,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textTertiary,
    fontSize: 22,
  },
  fleetBlock: {marginBottom: 48},
  fleetTitle: {
    color: colors.red,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 24,
  },
  fleetEmpty: {
    color: colors.textTertiary,
    fontSize: 28,
    fontStyle: 'italic',
  },
  fleetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    overflow: 'hidden',
  },
  accentBar: {
    width: 8,
    alignSelf: 'stretch',
  },
  fleetText: {
    flex: 1,
    paddingVertical: 24,
    paddingHorizontal: 24,
  },
  fleetName: {
    color: colors.textPrimary,
    fontSize: 34,
    fontWeight: '600',
    marginBottom: 4,
  },
  fleetMeta: {
    color: colors.textSecondary,
    fontSize: 24,
  },
  fleetRight: {
    paddingRight: 32,
    paddingLeft: 16,
    alignItems: 'flex-end',
  },
  fleetSpec: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '600',
  },
  fleetSpecLabel: {
    color: colors.textTertiary,
    fontSize: 18,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  footer: {
    marginTop: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    color: colors.textTertiary,
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginLeft: spacing.sm,
  },
});

export default FleetShareCard;
