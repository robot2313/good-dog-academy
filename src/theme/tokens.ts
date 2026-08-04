// Warm editorial palette: soft bone canvas, paper-like cards, deep forest
// actions, sage selections and a restrained clay accent.
export const colorTokens = {
  background: {
    canvas: '#F5F0E6',
    subtle: '#ECE5D8',
  },
  surface: {
    primary: '#FFFCF6',
    elevated: '#FFFFFF',
    selected: '#E3EBDD',
  },
  brand: {
    forest: '#18372B',
    primary: '#2F604A',
    pressed: '#244A3A',
    gold: '#C56F4A',
  },
  text: {
    primary: '#1C2B24',
    secondary: '#667069',
    inverse: '#FFFFFF',
    disabled: '#969B96',
    accent: '#B85F3E',
    success: '#2F6B4E',
  },
  border: {
    subtle: '#DDD6C9',
    strong: '#C8C0B2',
  },
  status: {
    successSurface: '#E0EBDD',
    successText: '#2F6B4E',
    warningSurface: '#F6E8D5',
    warningText: '#8A5A24',
    errorSurface: '#F6E2DE',
    errorText: '#9A4D43',
    infoSurface: '#E0EBEF',
    infoText: '#3F6878',
    neutralSurface: '#EEEAE2',
    neutralText: '#667069',
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
    shadowColor: '#4B4136',
    shadowOpacity: 0.10,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  medium: {
    shadowColor: '#4B4136',
    shadowOpacity: 0.16,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 7,
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
