import {
  borderTokens,
  colorTokens,
  designTokens,
  radiusTokens,
  shadowTokens,
  spacingTokens,
  typographyTokens,
} from '../../src/theme/tokens';

describe('premium design tokens', () => {
  it('defines the dark, gold-accented semantic color roles', () => {
    // Dark cinematic palette (Home screen is the source of truth).
    expect(colorTokens.background.canvas).toBe('#0E0E0E');
    expect(colorTokens.surface.primary).toBe('#1B1B1B');
    expect(colorTokens.brand.primary).toBe('#D4AF37');
    expect(colorTokens.brand.gold).toBe('#D4AF37');
    // Text is light on dark surfaces; inverse stays white for gold-filled marks.
    expect(colorTokens.text.primary).toBe('#F5F3EC');
    expect(colorTokens.text.secondary).toBe('#B4B4B4');
    expect(colorTokens.text.accent).toBe('#D4AF37');
    expect(colorTokens.text.inverse).toBe('#FFFFFF');
    expect(colorTokens.border.subtle).toBe('#2A2A2A');
    expect(colorTokens.status.successText).not.toBe(colorTokens.status.errorText);
  });

  it('provides consistent spacing, radius, border, typography, and shadow scales', () => {
    expect(Object.values(spacingTokens)).toEqual([4, 8, 12, 16, 20, 24, 32, 40, 48]);
    expect(radiusTokens).toEqual({
      sm: 8,
      md: 12,
      lg: 16,
      xl: 20,
      hero: 28,
      pill: 999,
    });
    expect(borderTokens).toEqual({ thin: 1, strong: 2 });
    expect(typographyTokens.body).toMatchObject({ fontSize: 16, lineHeight: 24 });
    expect(shadowTokens.low.elevation).toBeLessThan(shadowTokens.medium.elevation);
    expect(designTokens.spacing).toBe(spacingTokens);
  });
});