import { useEffect } from 'react';

import { AppNavigator } from './src/navigation/AppNavigator';
import { initializeApplication } from './src/services/initialization';
import { AppStateProvider } from './src/state/AppStateContext';

export default function App(): React.JSX.Element {
  useEffect(() => {
    void initializeApplication();
  }, []);

  return (
    <AppStateProvider>
      <AppNavigator />
    </AppStateProvider>
  );
}
