import { Text, View } from 'react-native';
import type { BehaviourSkill } from '../../../domain/models';
import { styles } from '../../../theme/styles';
import { SkillScoreRow } from './SkillScoreRow';

export function ResultsSummary({ focusAreas, unknownSkills, labels }: { focusAreas: readonly [BehaviourSkill, number][]; unknownSkills: readonly BehaviourSkill[]; labels: Record<BehaviourSkill, string> }): React.JSX.Element {
  return <>
    <View style={styles.card}>{focusAreas.length ? focusAreas.map(([skill, score]) => <SkillScoreRow key={skill} label={labels[skill]} score={score} />) : <Text style={styles.body}>No ranked areas yet because every skill was marked “Not sure.” That’s okay—we’ll learn over time.</Text>}</View>
    {unknownSkills.length ? <View style={styles.card}><Text style={styles.sectionTitle}>Not yet observed</Text><Text style={styles.body}>{unknownSkills.map((skill) => labels[skill]).join(', ')}</Text></View> : null}
  </>;
}
