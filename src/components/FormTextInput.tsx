import { Text, TextInput, type TextInputProps, View } from 'react-native';

import { styles } from '../theme/styles';
import { InlineValidationMessage } from './InlineValidationMessage';

type FormTextInputProps = TextInputProps & {
  label: string;
  error?: string;
};

export function FormTextInput({ label, error, ...props }: FormTextInputProps): React.JSX.Element {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput {...props} accessibilityLabel={props.accessibilityLabel ?? label} style={[styles.input, error && styles.inputError, props.style]} placeholderTextColor="#8A8A8A" />
      <InlineValidationMessage message={error} />
    </View>
  );
}
