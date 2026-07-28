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
          color={variant === 'primary' || variant === 'destructive'
            ? colorTokens.text.inverse
            : colorTokens.brand.primary}
          size="small"
        />
      ) : null}
      <Text style={[
        componentStyles.label,
        variant === 'primary' && componentStyles.inverseLabel,
        variant === 'destructive' && componentStyles.inverseLabel,
        variant === 'secondary' && componentStyles.primaryLabel,
        variant === 'ghost' && componentStyles.primaryLabel,
      ]}>
        {title}
      </Text>
    </Pressable>
  );
}

const componentStyles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: radiusTokens.lg,
    paddingHorizontal: spacingTokens.lg,
    paddingVertical: spacingTokens.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacingTokens.xs,
    borderWidth: 1,
  },
  primary: {
    backgroundColor: colorTokens.brand.primary,
    borderColor: colorTokens.brand.primary,
  },
  secondary: {
    backgroundColor: colorTokens.surface.primary,
    borderColor: colorTokens.brand.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  destructive: {
    backgroundColor: colorTokens.status.errorText,
    borderColor: colorTokens.status.errorText,
  },
  label: {
    ...typographyTokens.body,
    fontWeight: '800',
    textAlign: 'center',
  },
  inverseLabel: {
    color: colorTokens.text.inverse,
  },
  primaryLabel: {
    color: colorTokens.brand.primary,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.985 }],
  },
  disabled: {
    opacity: 0.48,
  },
});
