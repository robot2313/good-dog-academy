import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppNavigator } from './src/navigation/AppNavigator';
import { OnboardingProvider } from './src/features/onboarding/OnboardingContext';
import { AppStateProvider } from './src/state/AppStateContext';
import { AssessmentProvider } from './src/features/assessment/AssessmentContext';
import { LessonLibraryProvider } from './src/features/lessons/library/LessonLibraryContext';
import { AuthProvider } from './src/features/account/AuthContext';
import { TeamDogProvider } from './src/features/account/TeamDogContext';

export default function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppStateProvider>
          <OnboardingProvider>
            <TeamDogProvider>
              <AssessmentProvider>
                <LessonLibraryProvider>
                  <AppNavigator />
                </LessonLibraryProvider>
              </AssessmentProvider>
            </TeamDogProvider>
          </OnboardingProvider>
        </AppStateProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
