import { AppNavigator } from './src/navigation/AppNavigator';
import { AppStateProvider } from './src/state/AppStateContext';

export default function App(): React.JSX.Element {
  return (
    <AppStateProvider>
      <AppNavigator />
    </AppStateProvider>
  );
}
