import { colorTokens } from './tokens';

export const colors = {
  background: colorTokens.background.canvas,
  card: colorTokens.surface.primary,
  forest: colorTokens.brand.forest,
  green: colorTokens.brand.primary,
  mint: colorTokens.surface.selected,
  gold: colorTokens.brand.gold,
  text: colorTokens.text.primary,
  muted: colorTokens.text.secondary,
  line: colorTokens.border.subtle,
  white: colorTokens.text.inverse,
} as const;
