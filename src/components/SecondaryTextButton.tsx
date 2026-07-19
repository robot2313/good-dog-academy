import { Pressable, Text } from 'react-native';

import { styles } from '../theme/styles';

export function SecondaryTextButton({ title, onPress }: { title: string; onPress: () => void }): React.JSX.Element {
  return <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={styles.secondaryTextButton}><Text style={styles.secondaryText}>{title}</Text></Pressable>;
}
