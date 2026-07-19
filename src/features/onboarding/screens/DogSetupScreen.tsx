import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { Image, Text, View } from 'react-native';
import { useState } from 'react';

import { AppScreen } from '../../../components/AppScreen';
import { ErrorState } from '../../../components/ErrorState';
import { FormTextInput } from '../../../components/FormTextInput';
import { InlineValidationMessage } from '../../../components/InlineValidationMessage';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { ProgressIndicator } from '../../../components/ProgressIndicator';
import { SecondaryTextButton } from '../../../components/SecondaryTextButton';
import { SelectionChips } from '../../../components/SelectionChips';
import { styles } from '../../../theme/styles';
import type { RootStackParamList } from '../../../types/navigation';
import { useOnboarding } from '../OnboardingContext';
import { validateDogForm } from '../validation';

type Props = NativeStackScreenProps<RootStackParamList, 'DogSetup'>;

const yesNo = [{ value: 'no', label: 'Known' }, { value: 'yes', label: 'Unknown' }] as const;
const birthdayMode = [{ value: 'exact', label: 'Birthday' }, { value: 'estimated', label: 'Estimated age' }] as const;
const sexOptions = [{ value: 'female', label: 'Female' }, { value: 'male', label: 'Male' }, { value: 'unknown', label: 'Unknown' }] as const;
const weightUnits = [{ value: 'kg', label: 'kg' }, { value: 'lb', label: 'lb' }] as const;
const energyOptions = [{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }] as const;

export function DogSetupScreen({ navigation }: Props): React.JSX.Element {
  const { dogForm, setDogForm, completeSetup, saving, saveError } = useOnboarding();
  const [photoError, setPhotoError] = useState<string | null>(null);
  const validation = validateDogForm(dogForm);

  const choosePhoto = async () => {
    setPhotoError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setPhotoError('Photo access was not granted. You can continue without a photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled && result.assets[0]) setDogForm((current) => ({ ...current, photoUri: result.assets[0].uri }));
  };

  return (
    <AppScreen>
      <SecondaryTextButton title="Back" onPress={() => navigation.goBack()} />
      <ProgressIndicator current={2} total={2} />
      <View>
        <Text style={styles.onboardingTitle}>Meet your dog.</Text>
        <Text style={styles.onboardingBody}>These details help us keep future training safe, relevant, and achievable.</Text>
      </View>
      <View style={styles.photoActionRow}>
        {dogForm.photoUri ? <Image source={{ uri: dogForm.photoUri }} style={styles.photoPreview} accessibilityLabel="Selected dog photo" /> : <View style={styles.photoPreview} accessibilityLabel="No dog photo selected" />}
        <View><SecondaryTextButton title={dogForm.photoUri ? 'Change photo' : 'Add optional photo'} onPress={() => void choosePhoto()} /></View>
      </View>
      <InlineValidationMessage message={photoError} />
      <FormTextInput label="Dog name" value={dogForm.name} onChangeText={(name) => setDogForm((current) => ({ ...current, name }))} placeholder="Milo" autoCapitalize="words" error={dogForm.name.length > 0 ? validation.errors.name : undefined} />
      <SelectionChips label="Breed information" options={yesNo} value={dogForm.breedUnknown ? 'yes' : 'no'} onChange={(value) => setDogForm((current) => ({ ...current, breedUnknown: value === 'yes', breed: value === 'yes' ? '' : current.breed }))} />
      {!dogForm.breedUnknown ? <FormTextInput label="Breed or mix" value={dogForm.breed} onChangeText={(breed) => setDogForm((current) => ({ ...current, breed }))} placeholder="Labrador mix" autoCapitalize="words" error={dogForm.breed.length > 0 ? validation.errors.breed : undefined} /> : null}
      <SelectionChips label="Age information" options={birthdayMode} value={dogForm.birthdayEstimated ? 'estimated' : 'exact'} onChange={(value) => setDogForm((current) => ({ ...current, birthdayEstimated: value === 'estimated' }))} />
      {dogForm.birthdayEstimated
        ? <FormTextInput label="Estimated age in years" value={dogForm.estimatedAgeYears} onChangeText={(estimatedAgeYears) => setDogForm((current) => ({ ...current, estimatedAgeYears }))} keyboardType="decimal-pad" placeholder="2" error={dogForm.estimatedAgeYears.length > 0 ? validation.errors.estimatedAgeYears : undefined} />
        : <FormTextInput label="Birthday" value={dogForm.birthday} onChangeText={(birthday) => setDogForm((current) => ({ ...current, birthday }))} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" error={dogForm.birthday.length > 0 ? validation.errors.birthday : undefined} />}
      <SelectionChips label="Sex" options={sexOptions} value={dogForm.sex} onChange={(sex) => setDogForm((current) => ({ ...current, sex }))} />
      <FormTextInput label="Weight" value={dogForm.weight} onChangeText={(weight) => setDogForm((current) => ({ ...current, weight }))} keyboardType="decimal-pad" placeholder="24.5" error={dogForm.weight.length > 0 ? validation.errors.weight : undefined} />
      <SelectionChips label="Weight unit" options={weightUnits} value={dogForm.weightUnit} onChange={(weightUnit) => setDogForm((current) => ({ ...current, weightUnit }))} />
      <SelectionChips label="Energy level" options={energyOptions} value={dogForm.energyLevel} onChange={(energyLevel) => setDogForm((current) => ({ ...current, energyLevel }))} />
      <InlineValidationMessage message={validation.errors.form} />
      {saveError ? <ErrorState message={saveError} onRetry={() => void completeSetup()} /> : null}
      <PrimaryButton title={saving ? 'Saving…' : 'Complete Setup'} disabled={!validation.valid || saving} onPress={() => void completeSetup()} />
    </AppScreen>
  );
}
