import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';

import { AppScreen } from '../../../components/AppScreen';
import { InlineValidationMessage } from '../../../components/InlineValidationMessage';
import { PrimaryButton } from '../../../components/PrimaryButton';
import type { BehaviourSkill } from '../../../domain/models';
import { styles } from '../../../theme/styles';
import type { RootStackParamList } from '../../../types/navigation';
import { useAssessment } from '../AssessmentContext';
import { calculateAssessmentScores } from '../scoring';
import { ResultsSummary } from '../components/ResultsSummary';
import { AssessmentScreenContainer } from '../components/AssessmentScreenContainer';

type Props = NativeStackScreenProps<RootStackParamList, 'AssessmentResults'>;
const labels: Record<BehaviourSkill, string> = { recall: 'Recall', 'loose-lead-walking': 'Loose lead walking', jumping: 'Jumping', barking: 'Barking', chewing: 'Chewing', reactivity: 'Reactivity', 'house-training': 'House training', confidence: 'Confidence', 'impulse-control': 'Impulse control', focus: 'Focus' };

export function AssessmentResultsScreen({ navigation }: Props): React.JSX.Element {
  const { answers, allComplete, completeAssessment, saving, error } = useAssessment();
  if (!allComplete) return <AppScreen><Text style={styles.onboardingTitle}>Assessment incomplete</Text><Text style={styles.onboardingBody}>Please answer every question before viewing results.</Text><PrimaryButton title="Return to Questions" onPress={() => navigation.navigate('AssessmentEveryday')} /></AppScreen>;
  const result = calculateAssessmentScores(answers);
  const known = (Object.entries(result.calculatedScores) as [BehaviourSkill, number][]).filter(([skill]) => !result.unknownSkills.includes(skill)).sort((a, b) => a[1] - b[1]).slice(0, 3);
  return (
    <AssessmentScreenContainer current={5} onBack={() => navigation.goBack()}>
      <View><Text style={styles.onboardingTitle}>Your starting profile</Text><Text style={styles.onboardingBody}>These are the three known areas with the most room to grow. Scores describe a starting point, not a judgement.</Text></View>
      <ResultsSummary focusAreas={known} unknownSkills={result.unknownSkills} labels={labels} />
      <InlineValidationMessage message={error} />
      <PrimaryButton title={saving ? 'Saving…' : 'Complete Assessment'} disabled={saving} onPress={() => void completeAssessment()} />
    </AssessmentScreenContainer>
  );
}
