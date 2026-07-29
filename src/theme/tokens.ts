export const colorTokens = {
  background: {
    canvas: '#F7F4EE',
    subtle: '#FAF8F3',
  },
  surface: {
    primary: '#FFFFFF',
    elevated: '#FFFFFF',
    selected: '#DDEBE3',
  },
  brand: {
    forest: '#355E55',
    primary: '#355E55',
    pressed: '#294B44',
    gold: '#D9855B',
  },
  text: {
    primary: '#202825',
    secondary: '#66706C',
    inverse: '#FFFFFF',
    disabled: '#858F88',
    accent: '#A95637',
    success: '#356947',
  },
  border: {
    subtle: '#DED9D0',
    strong: '#D7D0C2',
  },
  status: {
    successSurface: '#DDEBE3',
    successText: '#245943',
    warningSurface: '#FFF6E2',
    warningText: '#75480C',
    errorSurface: '#FFF3F0',
    errorText: '#B85450',
    infoSurface: '#EEF4FA',
    infoText: '#315F7B',
    neutralSurface: '#F1EEE7',
    neutralText: '#58645D',
  },
} as const;

export const spacingTokens = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 48,
} as const;

export const radiusTokens = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  hero: 28,
  pill: 999,
} as const;

export const typographyTokens = {
  display: { fontSize: 34, lineHeight: 40, fontWeight: '900' },
  pageTitle: { fontSize: 30, lineHeight: 36, fontWeight: '900' },
  sectionTitle: { fontSize: 21, lineHeight: 27, fontWeight: '800' },
  cardTitle: { fontSize: 17, lineHeight: 23, fontWeight: '800' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  supporting: { fontSize: 14, lineHeight: 21, fontWeight: '400' },
  label: { fontSize: 12, lineHeight: 16, fontWeight: '800' },
  caption: { fontSize: 11, lineHeight: 16, fontWeight: '600' },
} as const;

export const borderTokens = {
  thin: 1,
  strong: 2,
} as const;

export const shadowTokens = {
  low: {
    shadowColor: '#10271E',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  medium: {
    shadowColor: '#10271E',
    shadowOpacity: 0.14,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
} as const;

export const designTokens = {
  colors: colorTokens,
  spacing: spacingTokens,
  radii: radiusTokens,
  typography: typographyTokens,
  borders: borderTokens,
  shadows: shadowTokens,
} as const;
