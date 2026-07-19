import { Text, View } from 'react-native';

import { styles } from '../theme/styles';
import { PrimaryButton } from './PrimaryButton';

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }): React.JSX.Element {
  return <View style={styles.errorCard} accessibilityRole="alert"><Text style={styles.sectionTitle}>Something went wrong</Text><Text style={styles.body}>{message}</Text><PrimaryButton title="Try again" onPress={onRetry} /></View>;
}
