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
  it('defines the warm editorial semantic color roles', () => {
    expect(colorTokens.background.canvas).toBe('#F5F0E6');
    expect(colorTokens.surface.primary).toBe('#FFFCF6');
    expect(colorTokens.brand.primary).toBe('#2F604A');
    expect(colorTokens.brand.gold).toBe('#C56F4A');
    expect(colorTokens.text.primary).toBe('#1C2B24');
    expect(colorTokens.text.secondary).toBe('#667069');
    expect(colorTokens.text.accent).toBe('#B85F3E');
    expect(colorTokens.text.inverse).toBe('#FFFFFF');
    expect(colorTokens.border.subtle).toBe('#DDD6C9');
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
