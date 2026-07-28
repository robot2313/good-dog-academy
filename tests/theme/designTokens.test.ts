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
    expect(colorTokens.background.canvas).toBe('#F3F0E8');
    expect(colorTokens.surface.primary).toBe('#FFFEFB');
    expect(colorTokens.brand.primary).toBe('#2F7056');
    expect(colorTokens.text.primary).toBe('#17241D');
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
