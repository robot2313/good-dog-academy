import { DogIdentityHero } from '../components/DogIdentityHero';
import { LessonLibraryScreen } from '../features/lessons/library/LessonLibraryScreen';
import { useOnboarding } from '../features/onboarding/OnboardingContext';

export function AcademyScreen(): React.JSX.Element {
  const dog = getOnboardingDog();
  const dogName = dog?.name ?? 'My Dog';
  const photoUri = dog?.photoUri ?? null;

  return (
    <LessonLibraryScreen
      hero={(
        <DogIdentityHero
          dogName={dogName}
          photoUri={photoUri}
          eyebrow="ACADEMY"
          title="Lesson Library"
          supportingText={`Lesson access and progress for ${dogName}.`}
          size="compact"
        />
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
