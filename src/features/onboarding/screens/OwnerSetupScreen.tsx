import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';

import { AppScreen } from '../../../components/AppScreen';
import { FormTextInput } from '../../../components/FormTextInput';
import { InlineValidationMessage } from '../../../components/InlineValidationMessage';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { ProgressIndicator } from '../../../components/ProgressIndicator';
import { SelectionChips } from '../../../components/SelectionChips';
import { SecondaryTextButton } from '../../../components/SecondaryTextButton';
import { styles } from '../../../theme/styles';
import type { RootStackParamList } from '../../../types/navigation';
import { useOnboarding } from '../OnboardingContext';
import { validateOwnerForm } from '../validation';

type Props = NativeStackScreenProps<RootStackParamList, 'OwnerSetup'>;

const experienceOptions = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'experienced', label: 'Experienced' },
] as const;

const goalOptions = [
  { value: 'family-companion', label: 'Family Companion' },
  { value: 'basic-obedience', label: 'Basic Obedience' },
  { value: 'behaviour-help', label: 'Behaviour Help' },
  { value: 'adventure', label: 'Adventure' },
  { value: 'dog-sport', label: 'Dog Sport' },
] as const;

export function OwnerSetupScreen({ navigation }: Props): React.JSX.Element {
  const { ownerForm, setOwnerForm } = useOnboarding();
  const validation = validateOwnerForm(ownerForm);

  return (
    <AppScreen>
      <SecondaryTextButton title="Back" onPress={() => navigation.goBack()} />
      <ProgressIndicator current={1} total={2} />
      <View>
        <Text style={styles.onboardingTitle}>Tell us about you.</Text>
        <Text style={styles.onboardingBody}>A little context helps us shape training around your experience and goals.</Text>
      </View>
      <FormTextInput label="Owner name" value={ownerForm.displayName} onChangeText={(displayName) => setOwnerForm((current) => ({ ...current, displayName }))} error={ownerForm.displayName.length > 0 ? validation.errors.displayName : undefined} placeholder="Your name" autoCapitalize="words" returnKeyType="done" />
      <SelectionChips label="Training experience" options={experienceOptions} value={ownerForm.trainingExperience} onChange={(trainingExperience) => setOwnerForm((current) => ({ ...current, trainingExperience }))} error={undefined} />
      <SelectionChips label="Primary goal" options={goalOptions} value={ownerForm.primaryGoal} onChange={(primaryGoal) => setOwnerForm((current) => ({ ...current, primaryGoal }))} error={undefined} />
      <InlineValidationMessage message={validation.errors.form} />
      <PrimaryButton title="Continue" disabled={!validation.valid} onPress={() => navigation.navigate('DogSetup')} />
    </AppScreen>
  );
}
