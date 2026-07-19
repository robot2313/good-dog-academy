import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppNavigator } from './src/navigation/AppNavigator';
import { OnboardingProvider } from './src/features/onboarding/OnboardingContext';
import { AppStateProvider } from './src/state/AppStateContext';

export default function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <AppStateProvider>
        <OnboardingProvider>
          <AppNavigator />
        </OnboardingProvider>
      </AppStateProvider>
    </SafeAreaProvider>
  );
}
