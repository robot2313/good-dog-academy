import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';

import { PrimaryButton } from '../../../components/PrimaryButton';
import { styles } from '../../../theme/styles';
import type { RootStackParamList } from '../../../types/navigation';
import { useAssessment } from '../AssessmentContext';
import { questionsForSection, type AssessmentSection } from '../catalogue';
import { hasSevereReactivityResponse } from '../scoring';
import { AssessmentQuestionCard } from '../components/AssessmentQuestionCard';
import { SafetyNotice } from '../components/SafetyNotice';
import { AssessmentScreenContainer } from '../components/AssessmentScreenContainer';

const sectionDetails = {
  everyday: { title: 'Everyday skills', body: 'Think about what usually happens in familiar, ordinary situations.', current: 2, next: 'AssessmentHome' as const },
  home: { title: 'Life at home', body: 'Tell us about routines and behaviour around the home.', current: 3, next: 'AssessmentControl' as const },
  control: { title: 'Confidence and control', body: 'Choose the closest answer based on what you have personally observed.', current: 4, next: 'AssessmentResults' as const },
};

type RouteName = 'AssessmentEveryday' | 'AssessmentHome' | 'AssessmentControl';
type Props = NativeStackScreenProps<RootStackParamList, RouteName> & { section: AssessmentSection };

export function AssessmentSectionScreen({ navigation, section }: Props): React.JSX.Element {
  const { answers, setAnswer, sectionComplete } = useAssessment();
  const questions = questionsForSection(section);
  const details = sectionDetails[section];
  return (
    <AssessmentScreenContainer current={details.current} onBack={() => navigation.goBack()}>
      <View><Text style={styles.onboardingTitle}>{details.title}</Text><Text style={styles.onboardingBody}>{details.body}</Text></View>
      {questions.map((question) => <AssessmentQuestionCard key={question.id} question={question} value={answers[question.id]} onChange={(answer) => setAnswer(question.id, answer)} />)}
      {section === 'control' && hasSevereReactivityResponse(answers) ? <SafetyNotice /> : null}
      <PrimaryButton title="Continue" disabled={!sectionComplete(questions.map((question) => question.id))} onPress={() => navigation.navigate(details.next)} />
    </AssessmentScreenContainer>
  );
}
