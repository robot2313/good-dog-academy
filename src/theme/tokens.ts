// Dark, cinematic palette — the Home screen is the source of truth: black to
// dark grey surfaces, charcoal cards, warm metallic gold accents, near-white
// and soft-grey text. `text.inverse` stays white for the few gold-filled marks.
export const colorTokens = {
  background: {
    canvas: '#0E0E0E',
    subtle: '#151515',
  },
  surface: {
    primary: '#1B1B1B',
    elevated: '#202020',
    selected: '#242424',
  },
  brand: {
    forest: '#161616',
    primary: '#D4AF37',
    pressed: '#B8912A',
    gold: '#D4AF37',
  },
  text: {
    primary: '#F5F3EC',
    secondary: '#B4B4B4',
    inverse: '#FFFFFF',
    disabled: '#7A7A7A',
    accent: '#D4AF37',
    success: '#7FD79B',
  },
  border: {
    subtle: '#2A2A2A',
    strong: '#3A3A3A',
  },
  status: {
    successSurface: '#16241C',
    successText: '#7FD79B',
    warningSurface: '#241E10',
    warningText: '#E4C27A',
    errorSurface: '#241514',
    errorText: '#E39B95',
    infoSurface: '#141C24',
    infoText: '#8FC0E0',
    neutralSurface: '#1E1E1E',
    neutralText: '#B4B4B4',
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
