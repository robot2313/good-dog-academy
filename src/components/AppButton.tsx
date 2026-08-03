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
            : colorTokens.brand.gold}
          size="small"
        />
      ) : null}
      <Text style={[
        componentStyles.label,
        variant === 'destructive' ? componentStyles.destructiveLabel : componentStyles.goldLabel,
      ]}>
        {title}
      </Text>
    </Pressable>
  );
}

// One dark + gold button family for the whole app. The primary action is set
// apart only by a subtle gold glow, never a different colour.
const GOLD = '#D4AF37';
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
    borderWidth: 1.5,
  },
  primary: {
    backgroundColor: '#202020',
    borderColor: GOLD,
    shadowColor: GOLD,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 5,
  },
  secondary: {
    backgroundColor: '#181818',
    borderColor: GOLD,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  destructive: {
    backgroundColor: '#181818',
    borderColor: colorTokens.status.errorText,
  },
  label: {
    ...typographyTokens.body,
    fontWeight: '800',
    textAlign: 'center',
  },
  goldLabel: {
    color: GOLD,
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
