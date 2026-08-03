import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppButton } from '../components/AppButton';
import { DogIdentityHero } from '../components/DogIdentityHero';
import { LessonLibraryScreen } from '../features/lessons/library/LessonLibraryScreen';
import { useOnboarding } from '../features/onboarding/OnboardingContext';
import type { RootStackParamList } from '../types/navigation';

export function AcademyScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dog = getOnboardingDog();
  const dogName = dog?.name ?? 'My Dog';
  const photoUri = dog?.photoUri ?? null;

  return (
    <LessonLibraryScreen
      hero={(
        <>
          <DogIdentityHero
            dogName={dogName}
            photoUri={photoUri}
            eyebrow="ACADEMY"
            title="Lesson Library"
            supportingText={`Lesson access and progress for ${dogName}.`}
            size="compact"
          />
          <AppButton
            title="Troubleshoot a Problem"
            accessibilityLabel={`Troubleshoot a training problem for ${dogName}`}
            onPress={() => navigation.navigate('Troubleshooter')}
          />
        </>
      )}
    />
  );
}

function getOnboardingDog() {
  try {
    const { status } = useOnboarding();
    return status?.state === 'complete' ? status.dog : null;
  } catch {
    return null;
  }
}
