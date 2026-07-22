import { Text, View } from 'react-native';

import { styles } from '../theme/styles';
import { PrimaryButton } from './PrimaryButton';

export function ErrorState({ message, onRetry, actionTitle = 'Try again' }: { message: string; onRetry: () => void; actionTitle?: string }): React.JSX.Element {
  return <View style={styles.errorCard} accessibilityRole="alert"><Text style={styles.sectionTitle}>Something went wrong</Text><Text style={styles.body}>{message}</Text><PrimaryButton title={actionTitle} onPress={onRetry} /></View>;
}
