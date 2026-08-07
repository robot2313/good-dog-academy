// The approved reference palette: warm paper canvas, white surfaces, deep navy
// headings, forest-green actions, and a sage selection wash. Gold is reserved
// for the dog-photo ring and a small number of caution surfaces.
export const colorTokens = {
  background: {
    canvas: '#FAF7F0',
    subtle: '#F4F0E8',
  },
  surface: {
    primary: '#FFFFFF',
    elevated: '#FFFFFF',
    selected: '#EDF5E9',
  },
  brand: {
    forest: '#1D6337',
    primary: '#2F8148',
    pressed: '#1D6337',
    gold: '#D99A22',
  },
  text: {
    primary: '#0B2545',
    secondary: '#66707C',
    inverse: '#FFFFFF',
    disabled: '#9AA39C',
    accent: '#1D6337',
    success: '#1D6337',
  },
  border: {
    subtle: '#E4DED3',
    strong: '#D3CCBE',
  },
  status: {
    successSurface: '#EDF5E9',
    successText: '#1D6337',
    warningSurface: '#FFF2D8',
    warningText: '#835B0E',
    errorSurface: '#F8E7E2',
    errorText: '#984B3E',
    infoSurface: '#E6F2F6',
    infoText: '#306A7B',
    neutralSurface: '#F1EEE7',
    neutralText: '#657168',
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

// Reference geometry: nothing is rounder than 14px except true pills.
export const radiusTokens = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 12,
  hero: 14,
  pill: 999,
} as const;

// Reference type scale, matching the six approved screens.
export const typographyTokens = {
  display: { fontSize: 28, lineHeight: 34, fontWeight: '900' },
  pageTitle: { fontSize: 26, lineHeight: 32, fontWeight: '900' },
  sectionTitle: { fontSize: 15, lineHeight: 20, fontWeight: '900' },
  cardTitle: { fontSize: 14, lineHeight: 19, fontWeight: '800' },
  body: { fontSize: 13, lineHeight: 19, fontWeight: '400' },
  supporting: { fontSize: 12, lineHeight: 17, fontWeight: '400' },
  label: { fontSize: 10, lineHeight: 14, fontWeight: '800' },
  caption: { fontSize: 10, lineHeight: 14, fontWeight: '600' },
} as const;

export const borderTokens = {
  thin: 1,
  strong: 2,
} as const;

export const shadowTokens = {
  low: {
    shadowColor: '#243245',
    shadowOpacity: 0.045,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  medium: {
    shadowColor: '#243245',
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
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
