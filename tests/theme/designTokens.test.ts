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
  it('defines the approved reference semantic color roles', () => {
    expect(colorTokens.background.canvas).toBe('#FAF7F0');
    expect(colorTokens.surface.primary).toBe('#FFFFFF');
    expect(colorTokens.brand.primary).toBe('#2F8148');
    expect(colorTokens.brand.gold).toBe('#D99A22');
    expect(colorTokens.text.primary).toBe('#0B2545');
    expect(colorTokens.text.secondary).toBe('#66707C');
    expect(colorTokens.text.accent).toBe('#1D6337');
    expect(colorTokens.text.inverse).toBe('#FFFFFF');
    expect(colorTokens.border.subtle).toBe('#E4DED3');
    expect(colorTokens.status.successText).not.toBe(colorTokens.status.errorText);
  });

  it('provides consistent spacing, radius, border, typography, and shadow scales', () => {
    expect(Object.values(spacingTokens)).toEqual([4, 8, 12, 16, 20, 24, 32, 40, 48]);
    expect(radiusTokens).toEqual({
      sm: 8,
      md: 10,
      lg: 12,
      xl: 12,
      hero: 14,
      pill: 999,
    });
    expect(borderTokens).toEqual({ thin: 1, strong: 2 });
    expect(typographyTokens.body).toMatchObject({ fontSize: 13, lineHeight: 19 });
    expect(shadowTokens.low.elevation).toBeLessThan(shadowTokens.medium.elevation);
    expect(designTokens.spacing).toBe(spacingTokens);
  });
});
