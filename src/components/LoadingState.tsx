import { ActivityIndicator, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import { styles } from '../theme/styles';

export function LoadingState({ message = 'Loading…' }: { message?: string }): React.JSX.Element {
  return <View style={styles.centerState} accessibilityRole="progressbar"><ActivityIndicator color={colors.green} size="large" /><Text style={styles.body}>{message}</Text></View>;
}
