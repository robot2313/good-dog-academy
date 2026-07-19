import { Text, View } from 'react-native';
import { styles } from '../../../theme/styles';

export function SkillScoreRow({ label, score }: { label: string; score: number }): React.JSX.Element {
  return <View style={styles.scoreRow}><Text style={styles.label}>{label}</Text><Text style={styles.scoreValue}>{score}/100</Text></View>;
}
