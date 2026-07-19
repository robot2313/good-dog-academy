import { Text } from 'react-native';

import { styles } from '../theme/styles';

export function InlineValidationMessage({ message }: { message?: string | null }): React.JSX.Element | null {
  if (!message) return null;
  return <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.validationText}>Error: {message}</Text>;
}
