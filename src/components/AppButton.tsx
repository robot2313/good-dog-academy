import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { referencePalette, referenceScreenStyles, referenceStyles } from '../theme/referenceStyles';

export type AppButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';

type AppButtonProps = {
  readonly title: string;
  readonly onPress: () => void;
  readonly variant?: AppButtonVariant;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly accessibilityLabel?: string;
};

/**
 * The reference button: a squared-off rectangle with a 9px radius, matching the
 * Continue Lesson / Start Lesson / View Full Journey controls in the reference.
 */
export function AppButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  accessibilityLabel,
}: AppButtonProps): React.JSX.Element {
  const inactive = disabled || loading;
  const container = variant === 'primary'
    ? referenceScreenStyles.primaryButton
    : variant === 'destructive'
      ? referenceScreenStyles.destructiveButton
      : variant === 'ghost'
        ? componentStyles.ghost
        : referenceScreenStyles.secondaryButton;
  const label = variant === 'primary'
    ? referenceScreenStyles.primaryButtonText
    : variant === 'destructive'
      ? referenceScreenStyles.destructiveButtonText
      : referenceScreenStyles.secondaryButtonText;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: inactive }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        container,
        pressed && !inactive && referenceStyles.pressed,
        inactive && componentStyles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          accessibilityElementsHidden
          color={variant === 'primary' ? '#FFFFFF' : referencePalette.greenDark}
          size="small"
        />
      ) : null}
      <Text style={label}>{title}</Text>
    </Pressable>
  );
}

const componentStyles = StyleSheet.create({
  ghost: {
    minHeight: 44,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    backgroundColor: 'transparent',
  },
  disabled: { opacity: 0.45 },
});
