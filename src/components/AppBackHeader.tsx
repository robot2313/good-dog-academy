import { Pressable, Text, View } from 'react-native';

import { referenceScreenStyles, referenceStyles } from '../theme/referenceStyles';
import { ReferenceIcon } from './ReferenceIcon';

type AppBackHeaderProps = {
  onPress: () => void;
  label?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
};

/** Circular back control matching the reference lesson and browse screens. */
export function AppBackHeader({
  onPress,
  label = 'Back',
  accessibilityLabel,
  accessibilityHint = 'Returns to the previous screen',
  testID,
}: AppBackHeaderProps): React.JSX.Element {
  return (
    <View style={referenceStyles.headerRow}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityHint={accessibilityHint}
        hitSlop={8}
        onPress={onPress}
        testID={testID}
        style={({ pressed }) => [referenceScreenStyles.identityBackRow, pressed && referenceStyles.pressed]}
      >
        <View style={referenceStyles.iconButton}><ReferenceIcon name="back" /></View>
        <Text accessible={false} style={referenceScreenStyles.textButtonLabel}>{label}</Text>
      </Pressable>
    </View>
  );
}
