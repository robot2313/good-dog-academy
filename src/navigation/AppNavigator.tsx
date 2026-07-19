import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AcademyScreen } from '../screens/AcademyScreen';
import { LoadingState } from '../components/LoadingState';
import { AppScreen } from '../components/AppScreen';
import { DogSetupScreen } from '../features/onboarding/screens/DogSetupScreen';
import { OwnerSetupScreen } from '../features/onboarding/screens/OwnerSetupScreen';
import { WelcomeScreen } from '../features/onboarding/screens/WelcomeScreen';
import { useOnboarding } from '../features/onboarding/OnboardingContext';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ProgressScreen } from '../screens/ProgressScreen';
import { TodayScreen } from '../screens/TodayScreen';
import type { MainTabParamList, RootStackParamList } from '../types/navigation';
import { MainTabBar } from './MainTabBar';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs(): React.JSX.Element {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <MainTabBar {...props} />}>
      <Tab.Screen name="Today" component={TodayScreen} />
      <Tab.Screen name="Academy" component={AcademyScreen} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
      <Tab.Screen name="Dog" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export function AppNavigator(): React.JSX.Element {
  const { status, loading } = useOnboarding();

  if (loading || !status) return <AppScreen scroll={false}><LoadingState message="Preparing Good Dog Academy…" /></AppScreen>;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {status.state === 'complete'
          ? <Stack.Screen name="Main" component={MainTabs} />
          : <>
              <Stack.Screen name="Welcome" component={WelcomeScreen} />
              <Stack.Screen name="OwnerSetup" component={OwnerSetupScreen} />
              <Stack.Screen name="DogSetup" component={DogSetupScreen} />
            </>}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
