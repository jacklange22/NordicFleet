// NordicFleet design system tokens.
//
// All UI components draw colors, spacing, radius, and typography from this
// module. Don't hard-code design values in component files — add a token
// here first, then reference it.

export const colors = {
  bg: '#0A0A0A',
  surface: '#161616',
  surfaceElevated: '#1F1F1F',
  border: '#262626',
  borderStrong: '#404040',

  red: '#E53935',
  redPressed: '#C62828',
  redDim: '#7F1D1D',

  textPrimary: '#FFFFFF',
  textSecondary: '#A3A3A3',
  textTertiary: '#737373',

  success: '#22C55E',
  warning: '#F59E0B',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 48,
  '5xl': 64,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const typography = {
  displayXl: {
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  displayLg: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  displayMd: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headingLg: {
    fontSize: 20,
    fontWeight: '600',
  },
  headingMd: {
    fontSize: 17,
    fontWeight: '600',
  },
  bodyLg: {
    fontSize: 16,
    fontWeight: '400',
  },
  body: {
    fontSize: 15,
    fontWeight: '400',
  },
  bodySm: {
    fontSize: 13,
    fontWeight: '400',
  },
  caption: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  number: {
    fontSize: 32,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
};

// Convenience aliases that include color, used when you want one-shot
// styled text (`<Text style={textStyles.h1}>...</Text>`).
export const textStyles = {
  displayXl: {...typography.displayXl, color: colors.textPrimary},
  displayLg: {...typography.displayLg, color: colors.textPrimary},
  displayMd: {...typography.displayMd, color: colors.textPrimary},
  headingLg: {...typography.headingLg, color: colors.textPrimary},
  headingMd: {...typography.headingMd, color: colors.textPrimary},
  bodyLg: {...typography.bodyLg, color: colors.textPrimary},
  body: {...typography.body, color: colors.textPrimary},
  bodySm: {...typography.bodySm, color: colors.textSecondary},
  caption: {...typography.caption, color: colors.textTertiary},
  number: {...typography.number, color: colors.textPrimary},
};

const theme = {colors, spacing, radius, typography, textStyles};
export default theme;
