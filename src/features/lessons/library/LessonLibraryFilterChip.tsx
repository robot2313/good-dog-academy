import { Pressable, Text } from 'react-native';

import { styles } from '../../../theme/styles';

type LessonLibraryFilterChipProps = {
  label: string;
  accessibilityLabel?: string;
  selected: boolean;
  onPress: () => void;
};

export function LessonLibraryFilterChip({ label, accessibilityLabel, selected, onPress }: LessonLibraryFilterChipProps): React.JSX.Element {
  return <Pressable
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel ?? label}
    accessibilityState={{ selected }}
    onPress={onPress}
    style={({ pressed }) => [styles.libraryFilterChip, selected && styles.libraryFilterChipSelected, pressed && styles.pressed]}
  >
    <Text style={[styles.libraryFilterChipText, selected && styles.libraryFilterChipTextSelected]}>{label}</Text>
  </Pressable>;
}
