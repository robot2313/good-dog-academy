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
  it('defines semantic color roles without changing legacy brand values', () => {
    expect(colorTokens.background.canvas).toBe('#F7F4EE');
    expect(colorTokens.surface.primary).toBe('#FFFFFF');
    expect(colorTokens.brand.forest).toBe('#355E55');
    expect(colorTokens.brand.primary).toBe('#355E55');
    expect(colorTokens.brand.pressed).toBe('#294B44');
    expect(colorTokens.brand.gold).toBe('#D9855B');
    expect(colorTokens.text.primary).toBe('#202825');
    expect(colorTokens.text.secondary).toBe('#66706C');
    expect(colorTokens.text.accent).toBe('#A95637');
    expect(colorTokens.text.success).toBe('#356947');
    expect(colorTokens.border.subtle).toBe('#DED9D0');
    expect(colorTokens.status.errorText).toBe('#B85450');
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