import { Pressable, Text } from 'react-native';

import { styles } from '../theme/styles';

type PrimaryButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
};

export function PrimaryButton({ title, onPress, disabled = false, accessibilityLabel }: PrimaryButtonProps): React.JSX.Element {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? title} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.primaryButton, disabled && styles.disabled, pressed && !disabled && styles.pressed]}>
      <Text style={styles.primaryButtonText}>{title}</Text>
    </Pressable>
  );
}
