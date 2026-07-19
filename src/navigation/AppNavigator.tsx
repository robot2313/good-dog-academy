import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AcademyScreen } from '../screens/AcademyScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ProgressScreen } from '../screens/ProgressScreen';
import { TodayScreen } from '../screens/TodayScreen';
import { useAppState } from '../state/AppStateContext';
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
  const { onboarded } = useAppState();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {onboarded
          ? <Stack.Screen name="Main" component={MainTabs} />
          : <Stack.Screen name="Onboarding" component={OnboardingScreen} />}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
