import { Text, View } from 'react-native';
import { styles } from '../../../theme/styles';

export function SafetyNotice(): React.JSX.Element {
  return <View style={styles.safetyCard} accessibilityRole="alert"><Text style={styles.sectionTitle}>Safety first</Text><Text style={styles.body}>Intense reactions can carry safety risks. Avoid forced greetings and create distance from triggers. If there is a risk of injury, seek help from a qualified, force-free professional trainer or veterinarian.</Text></View>;
}
