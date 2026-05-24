import React from 'react';
import {View, Text, Image, StyleSheet} from 'react-native';
import {colors, typography} from '../../theme';

const SIZES = {
  32: {dim: 32, font: 12},
  40: {dim: 40, font: 14},
  56: {dim: 56, font: 20},
  80: {dim: 80, font: 28},
};

/**
 * Round avatar. Falls back to red circle with initials when no image.
 *
 * Props:
 *   uri    optional remote/local image source
 *   name   used to compute initials when no uri
 *   email  fallback for initial when name is empty
 *   size   32 | 40 | 56 | 80   (default 40)
 */
const initialsFor = (name, email) => {
  const raw = (name || email || '').trim();
  if (!raw) {
    return '?';
  }
  const parts = raw.split(/\s+/).slice(0, 2);
  if (parts.length === 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  // No spaces — try email prefix
  if (raw.includes('@')) {
    const prefix = raw.split('@')[0];
    return prefix.slice(0, 2).toUpperCase();
  }
  return raw.slice(0, 2).toUpperCase();
};

const Avatar = ({uri, name, email, size = 40, accessibilityLabel}) => {
  const {dim, font} = SIZES[size] || SIZES[40];
  const radius = dim / 2;

  if (uri) {
    return (
      <Image
        source={typeof uri === 'string' ? {uri} : uri}
        accessibilityLabel={accessibilityLabel || name || email}
        style={{width: dim, height: dim, borderRadius: radius}}
      />
    );
  }

  return (
    <View
      accessibilityLabel={accessibilityLabel || name || email}
      style={[
        styles.fallback,
        {width: dim, height: dim, borderRadius: radius},
      ]}>
      <Text style={[styles.initials, {fontSize: font}]}>
        {initialsFor(name, email)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    ...typography.headingMd,
    color: colors.textPrimary,
    fontWeight: '700',
  },
});

export default Avatar;
