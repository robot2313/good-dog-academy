import { Pressable, Text, View } from 'react-native';

import { styles } from '../theme/styles';
import { InlineValidationMessage } from './InlineValidationMessage';

export type SelectionOption<T extends string> = { value: T; label: string };

type SelectionChipsProps<T extends string> = {
  label: string;
  options: readonly SelectionOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  error?: string;
};

export function SelectionChips<T extends string>({ label, options, value, onChange, error }: SelectionChipsProps<T>): React.JSX.Element {
  return (
    <View style={styles.fieldGroup} accessibilityRole="radiogroup" accessibilityLabel={label}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.chipGroup}>
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <Pressable key={option.value} accessibilityRole="radio" accessibilityState={{ checked: selected }} accessibilityLabel={option.label} onPress={() => onChange(option.value)} style={[styles.selectionChip, selected && styles.selectionChipActive]}>
              <Text style={[styles.selectionChipText, selected && styles.selectionChipTextActive]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <InlineValidationMessage message={error} />
    </View>
  );
}
