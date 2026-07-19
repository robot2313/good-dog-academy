import { Pressable, Text } from 'react-native';

import { styles } from '../theme/styles';

type PrimaryButtonProps = {
  title: string;
  onPress: () => void;
};

export function PrimaryButton({ title, onPress }: PrimaryButtonProps): React.JSX.Element {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
      <Text style={styles.primaryButtonText}>{title}</Text>
    </Pressable>
  );
}
