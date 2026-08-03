import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AcademyScreen } from '../screens/AcademyScreen';
import { LoadingState } from '../components/LoadingState';
import { AppScreen } from '../components/AppScreen';
import { ErrorState } from '../components/ErrorState';
import { DogSetupScreen } from '../features/onboarding/screens/DogSetupScreen';
import { OwnerSetupScreen } from '../features/onboarding/screens/OwnerSetupScreen';
import { WelcomeScreen } from '../features/onboarding/screens/WelcomeScreen';
import { useOnboarding } from '../features/onboarding/OnboardingContext';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ProgressScreen } from '../screens/ProgressScreen';
import { SessionDetailScreen } from '../screens/SessionDetailScreen';
import { SessionHistoryScreen } from '../screens/SessionHistoryScreen';
import { TodayScreen } from '../screens/TodayScreen';
import type { MainTabParamList, RootStackParamList } from '../types/navigation';
import { MainTabBar } from './MainTabBar';
import { AssessmentIntroScreen } from '../features/assessment/screens/AssessmentIntroScreen';
import { AssessmentResultsScreen } from '../features/assessment/screens/AssessmentResultsScreen';
import { AssessmentSectionScreen } from '../features/assessment/screens/AssessmentSectionScreen';
import { LessonSummaryScreen } from '../features/lessons/library/LessonSummaryScreen';
import { LessonSessionScreen } from '../features/lessons/session/LessonSessionScreen';
import { JourneyScreen } from '../features/lessons/journey/JourneyScreen';
import { DogTroubleshooterScreen } from '../features/troubleshooter/DogTroubleshooterScreen';

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
  const { status, loading, initializationError, retryInitialization } = useOnboarding();

  if (loading) return <AppScreen scroll={false}><LoadingState message="Preparing Good Dog Academy…" /></AppScreen>;
  if (initializationError) return <AppScreen scroll={false}><ErrorState message={initializationError} onRetry={retryInitialization} /></AppScreen>;
  if (!status) return <AppScreen scroll={false}><LoadingState message="Preparing Good Dog Academy…" /></AppScreen>;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {status.state === 'complete' ? <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="Journey" component={JourneyScreen} />
            <Stack.Screen name="Troubleshooter" component={DogTroubleshooterScreen} />
            <Stack.Screen name="LessonSummary" component={LessonSummaryScreen} />
            <Stack.Screen name="LessonSession" component={LessonSessionScreen} />
            <Stack.Screen name="SessionHistory" component={SessionHistoryScreen} />
            <Stack.Screen name="SessionDetail" component={SessionDetailScreen} />
          </>
          : status.state === 'assessment-required' || status.state === 'assessment-corrupt' ? <>
              <Stack.Screen name="AssessmentIntro" component={AssessmentIntroScreen} />
              <Stack.Screen name="AssessmentEveryday">{(props) => <AssessmentSectionScreen {...props} section="everyday" />}</Stack.Screen>
              <Stack.Screen name="AssessmentHome">{(props) => <AssessmentSectionScreen {...props} section="home" />}</Stack.Screen>
              <Stack.Screen name="AssessmentControl">{(props) => <AssessmentSectionScreen {...props} section="control" />}</Stack.Screen>
              <Stack.Screen name="AssessmentResults" component={AssessmentResultsScreen} />
            </>
          : <>
              <Stack.Screen name="Welcome" component={WelcomeScreen} />
              <Stack.Screen name="OwnerSetup" component={OwnerSetupScreen} />
              <Stack.Screen name="DogSetup" component={DogSetupScreen} />
            </>}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
