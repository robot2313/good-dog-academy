import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppNavigator } from './src/navigation/AppNavigator';
import { OnboardingProvider } from './src/features/onboarding/OnboardingContext';
import { AppStateProvider } from './src/state/AppStateContext';
import { AssessmentProvider } from './src/features/assessment/AssessmentContext';
import { LessonProgressProvider } from './src/features/lessons/progress/LessonProgressContext';
import { DailyPlanProvider } from './src/features/dailyPlan/DailyPlanContext';

export default function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <AppStateProvider>
        <OnboardingProvider>
          <LessonProgressProvider>
            <DailyPlanProvider>
              <AssessmentProvider>
                <AppNavigator />
              </AssessmentProvider>
            </DailyPlanProvider>
          </LessonProgressProvider>
        </OnboardingProvider>
      </AppStateProvider>
    </SafeAreaProvider>
  );
}
