export const colorTokens = {
  background: {
    canvas: '#F3F0E8',
    subtle: '#FAF8F3',
  },
  surface: {
    primary: '#FFFEFB',
    elevated: '#FFFFFF',
    selected: '#DDEBE3',
  },
  brand: {
    forest: '#173F31',
    primary: '#2F7056',
    pressed: '#245943',
    gold: '#D8B46A',
  },
  text: {
    primary: '#17241D',
    secondary: '#6D786F',
    inverse: '#FFFFFF',
    disabled: '#858F88',
  },
  border: {
    subtle: '#E4DFD4',
    strong: '#D7D0C2',
  },
  status: {
    successSurface: '#DDEBE3',
    successText: '#245943',
    warningSurface: '#FFF6E2',
    warningText: '#75480C',
    errorSurface: '#FFF3F0',
    errorText: '#8B3328',
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
