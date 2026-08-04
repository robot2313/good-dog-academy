import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { colorTokens, radiusTokens, spacingTokens, typographyTokens } from '../theme/tokens';

export type AppButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';

type AppButtonProps = {
  readonly title: string;
  readonly onPress: () => void;
  readonly variant?: AppButtonVariant;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly accessibilityLabel?: string;
};

export function AppButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  accessibilityLabel,
}: AppButtonProps): React.JSX.Element {
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: inactive }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        componentStyles.button,
        componentStyles[variant],
        pressed && !inactive && componentStyles.pressed,
        inactive && componentStyles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          accessibilityElementsHidden
          color={variant === 'destructive'
            ? colorTokens.status.errorText
            : variant === 'primary'
              ? colorTokens.text.inverse
              : colorTokens.brand.primary}
          size="small"
        />
      ) : null}
      <Text style={[
        componentStyles.label,
        variant === 'destructive'
          ? componentStyles.destructiveLabel
          : variant === 'primary'
            ? componentStyles.primaryLabel
            : componentStyles.secondaryLabel,
      ]}>
        {title}
      </Text>
    </Pressable>
  );
}

const componentStyles = StyleSheet.create({
  button: {
    minHeight: 54,
    borderRadius: radiusTokens.pill,
    paddingHorizontal: spacingTokens.lg,
    paddingVertical: spacingTokens.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacingTokens.xs,
    borderWidth: 1.5,
  },
  primary: {
    backgroundColor: colorTokens.brand.primary,
    borderColor: colorTokens.brand.primary,
    shadowColor: colorTokens.brand.forest,
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  secondary: {
    backgroundColor: colorTokens.surface.primary,
    borderColor: colorTokens.border.strong,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  destructive: {
    backgroundColor: colorTokens.status.errorSurface,
    borderColor: colorTokens.status.errorText,
  },
  label: {
    ...typographyTokens.body,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.25,
  },
  primaryLabel: {
    color: colorTokens.text.inverse,
  },
  secondaryLabel: {
    color: colorTokens.brand.primary,
  },
  destructiveLabel: {
    color: colorTokens.status.errorText,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.985 }],
  },
  disabled: {
    opacity: 0.48,
  },
});
