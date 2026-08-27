import { Pressable, Text } from 'react-native';

import { referenceScreenStyles, referenceStyles } from '../theme/referenceStyles';

export function SecondaryTextButton({ title, onPress }: { title: string; onPress: () => void }): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [referenceScreenStyles.textButton, pressed && referenceStyles.pressed]}
    >
      <Text style={referenceScreenStyles.textButtonLabel}>{title}</Text>
    </Pressable>
  );
}
