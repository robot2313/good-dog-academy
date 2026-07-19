import { Text, View } from 'react-native';

import type { AssessmentOption } from '../../../domain/models';
import { styles } from '../../../theme/styles';
import type { AssessmentQuestion } from '../catalogue';
import { ResponseSelectionControl } from './ResponseSelectionControl';

export function AssessmentQuestionCard({ question, value, onChange }: { question: AssessmentQuestion; value: AssessmentOption | undefined; onChange: (value: AssessmentOption) => void }): React.JSX.Element {
  return (
    <View style={styles.assessmentQuestion} accessible={false}>
      <Text style={styles.sectionTitle}>{question.text}</Text>
      {question.explanation ? <Text style={styles.onboardingBody}>{question.explanation}</Text> : null}
      <ResponseSelectionControl question={question} value={value} onChange={onChange} />
    </View>
  );
}
