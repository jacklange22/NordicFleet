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
  return d.toLocaleDateString(undefined, {month: 'short', day: 'numeric'});
};

const waxSummary = log => {
  const parts = [];
  if (log.glideWaxes && log.glideWaxes.length) {
    parts.push(log.glideWaxes.filter(Boolean).join(', '));
  }
  if (log.kickWax) {
    parts.push(`kick: ${log.kickWax}`);
  }
  return parts.join(' · ') || '-';
};

const testSummary = log => {
  const bits = [];
  if (log.snowType) {
    bits.push(log.snowType);
  }
  if (
    log.temperature !== null &&
    log.temperature !== undefined &&
    log.temperature !== ''
  ) {
    bits.push(`${log.temperature}°C`);
  }
  if (
    log.glideRating !== null &&
    log.glideRating !== undefined &&
    log.glideRating !== ''
  ) {
    bits.push(`Glide ${log.glideRating}/10`);
  }
  return bits.join(' · ') || '-';
};

/**
 * 1080×1080-ish styled share card for a single ski. The parent passes a
 * ref via forwardRef; that ref is what shareSnapshot captures.
 *
 * Render this off-screen (or just out-of-bounds) when generating the
 * share - captureRef works on collapsable=false Views even if they're
 * not visible. Don't add transforms or absolute positioning that would
 * break the snapshot.
 */
const SkiShareCard = forwardRef(({ski, waxLogs = [], testLogs = []}, ref) => {
  const recentWax = waxLogs.slice(0, 5);
  const recentTest = testLogs.slice(0, 5);

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
        {ski.name || 'Unnamed ski'}
      </Text>
      {!!(ski.brand || ski.model) && (
        <Text style={styles.subhead}>
          {[ski.brand, ski.model].filter(Boolean).join(' · ')}
        </Text>
      )}

      <View style={styles.specsGrid}>
        <SpecCell label="Technique" value={ski.technique} />
        <SpecCell label="Type" value={ski.type} />
        <SpecCell
          label="Length"
          value={ski.length ? `${ski.length} cm` : null}
        />
        <SpecCell label="Flex" value={ski.flex} />
        <SpecCell label="Grind" value={ski.grind} />
        <SpecCell label="Base" value={ski.base} />
      </View>

      {/* Wax history */}
      <View style={styles.historyBlock}>
        <Text style={styles.historyTitle}>Last wax sessions</Text>
        {recentWax.length === 0 ? (
          <Text style={styles.historyEmpty}>No wax sessions yet</Text>
        ) : (
          recentWax.map(log => (
            <View key={log.id} style={styles.historyRow}>
              <Text style={styles.historyDate}>{fmtDate(log.date)}</Text>
              <Text style={styles.historyDetail} numberOfLines={1}>
                {waxSummary(log)}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Test history */}
      <View style={styles.historyBlock}>
        <Text style={styles.historyTitle}>Last test sessions</Text>
        {recentTest.length === 0 ? (
          <Text style={styles.historyEmpty}>No test sessions yet</Text>
        ) : (
          recentTest.map(log => (
            <View key={log.id} style={styles.historyRow}>
              <Text style={styles.historyDate}>{fmtDate(log.date)}</Text>
              <Text style={styles.historyDetail} numberOfLines={1}>
                {testSummary(log)}
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.footer}>
        <Ionicons name="snow-outline" size={14} color={colors.textTertiary} />
        <Text style={styles.footerText}>Tracked with NordicFleet</Text>
      </View>
    </View>
  );
});

const SpecCell = ({label, value}) => (
  <View style={styles.specCell}>
    <Text style={styles.specLabel}>{label}</Text>
    <Text style={styles.specValue} numberOfLines={1}>
      {value === null || value === undefined || value === '' ? '-' : String(value)}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    width: 1080,
    height: 1080,
    backgroundColor: colors.bg,
    padding: 64,
    justifyContent: 'flex-start',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 56,
  },
  logo: {
    width: 56,
    height: 56,
  },
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
    marginBottom: spacing.md,
  },
  subhead: {
    fontSize: 32,
    color: colors.textSecondary,
    marginBottom: 48,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 32,
    marginBottom: 40,
  },
  specCell: {
    width: '33%',
    paddingVertical: 16,
  },
  specLabel: {
    ...typography.caption,
    color: colors.textTertiary,
    fontSize: 18,
    marginBottom: 6,
  },
  specValue: {
    color: colors.textPrimary,
    fontSize: 30,
    fontWeight: '600',
  },
  historyBlock: {
    marginBottom: 32,
  },
  historyTitle: {
    color: colors.red,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyDate: {
    color: colors.textSecondary,
    fontSize: 26,
    fontWeight: '600',
    width: 160,
  },
  historyDetail: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 26,
  },
  historyEmpty: {
    color: colors.textTertiary,
    fontSize: 24,
    fontStyle: 'italic',
  },
  footer: {
    position: 'absolute',
    left: 64,
    right: 64,
    bottom: 64,
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

export default SkiShareCard;
