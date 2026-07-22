import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppNavigator } from './src/navigation/AppNavigator';
import { OnboardingProvider } from './src/features/onboarding/OnboardingContext';
import { AppStateProvider } from './src/state/AppStateContext';
import { AssessmentProvider } from './src/features/assessment/AssessmentContext';
import { LessonLibraryProvider } from './src/features/lessons/library/LessonLibraryContext';

export default function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <AppStateProvider>
        <OnboardingProvider>
          <AssessmentProvider>
            <LessonLibraryProvider>
              <AppNavigator />
            </LessonLibraryProvider>
          </AssessmentProvider>
        </OnboardingProvider>
      </AppStateProvider>
    </SafeAreaProvider>
  );
}
