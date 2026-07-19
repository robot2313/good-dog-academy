import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert, Text, View } from 'react-native';

import { InlineValidationMessage } from '../../../components/InlineValidationMessage';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { styles } from '../../../theme/styles';
import type { RootStackParamList } from '../../../types/navigation';
import { useOnboarding } from '../../onboarding/OnboardingContext';
import { useAssessment } from '../AssessmentContext';
import { AssessmentScreenContainer } from '../components/AssessmentScreenContainer';

type Props = NativeStackScreenProps<RootStackParamList, 'AssessmentIntro'>;

export function AssessmentIntroScreen({ navigation }: Props): React.JSX.Element {
  const { status } = useOnboarding();
  const { error, saving, recoverCorruptAssessment } = useAssessment();
  const beginRecovery = () => Alert.alert('Restart assessment?', 'The saved assessment is unreadable. Restarting removes only assessment data; your owner and dog setup will be kept.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Restart assessment', style: 'destructive', onPress: () => void recoverCorruptAssessment() },
  ]);
  return (
    <AssessmentScreenContainer current={1}>
      <View style={styles.hero}><Text style={styles.eyebrow}>PERSONALISED START</Text><Text style={styles.heroTitle}>Let’s understand your dog.</Text><Text style={styles.heroBody}>This takes approximately two minutes. Honest answers produce a better training plan, and there are no bad scores.</Text></View>
      <View style={styles.card}><Text style={styles.sectionTitle}>What to expect</Text><Text style={styles.body}>Answer based on what usually happens across ten everyday skills. “Not sure / Not observed” is always available, and your responses stay on this device.</Text></View>
      {status?.state === 'assessment-corrupt' ? <View style={styles.errorCard} accessibilityRole="alert"><Text style={styles.sectionTitle}>Saved assessment needs attention</Text><Text style={styles.body}>Your dog setup is safe, but the assessment data cannot be read. Confirm a restart before it is cleared.</Text><PrimaryButton title={saving ? 'Restarting…' : 'Restart Assessment'} disabled={saving} onPress={beginRecovery} /></View> : <PrimaryButton title="Start Assessment" onPress={() => navigation.navigate('AssessmentEveryday')} />}
      <InlineValidationMessage message={error} />
    </AssessmentScreenContainer>
  );
}
