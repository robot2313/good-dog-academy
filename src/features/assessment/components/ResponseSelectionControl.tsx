import { Pressable, Text, View } from 'react-native';
import type { AssessmentOption } from '../../../domain/models';
import { styles } from '../../../theme/styles';
import type { AssessmentQuestion } from '../catalogue';

export function ResponseSelectionControl({ question, value, onChange }: { question: AssessmentQuestion; value: AssessmentOption | undefined; onChange: (value: AssessmentOption) => void }): React.JSX.Element {
  return <View style={styles.assessmentOptions} accessibilityRole="radiogroup" accessibilityLabel={`Response options for: ${question.text}`}>
    {question.options.map((option) => {
      const selected = value === option.id;
      return <Pressable key={option.id} accessibilityRole="radio" accessibilityLabel={`${question.text}: ${option.label}`} accessibilityState={{ checked: selected }} onPress={() => onChange(option.id)} style={({ pressed }) => [styles.assessmentOption, selected && styles.assessmentOptionSelected, pressed && styles.pressed]}>
        <View style={[styles.radioOuter, selected && styles.radioSelected]}>{selected ? <View style={styles.radioInner} /> : null}</View><Text style={styles.optionText}>{option.label}</Text>
      </Pressable>;
    })}
  </View>;
}
