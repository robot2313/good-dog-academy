import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  type NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { Text, View } from 'react-native';

import { PrimaryButton } from '../../src/components/PrimaryButton';
import {
  sampleBehaviourAssessment,
  sampleBehaviourProfile,
  sampleDog,
  sampleOwner,
} from '../../src/development/seed/sampleData';
import type { TodayPlanView } from '../../src/features/daily-plan/TodayPlanTypes';
import { todayPlanService } from '../../src/features/daily-plan/todayPlanServiceInstance';
import { useOnboarding } from '../../src/features/onboarding/OnboardingContext';
import {
  TodayScreen,
  type TodayScreenProps,
} from '../../src/screens/TodayScreen';
import type {
  MainTabParamList,
  RootStackParamList,
} from '../../src/types/navigation';

jest.mock('../../src/features/onboarding/OnboardingContext', () => ({
  useOnboarding: jest.fn(),
}));
jest.mock('../../src/features/daily-plan/todayPlanServiceInstance', () => ({
  todayPlanService: { getOrCreate: jest.fn() },
}));

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const mockUseOnboarding = jest.mocked(useOnboarding);
const mockGetOrCreate = jest.mocked(todayPlanService.getOrCreate);

describe('Home navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseOnboarding.mockReturnValue(onboardingValue());
    mockGetOrCreate.mockResolvedValue(plan());
  });

  it('opens the recommended next lesson with its lessonId and dailyPlanId', async () => {
    const view = renderTestApp();

    const start = await view.findByRole('button', { name: 'Start next lesson' });
    await waitFor(() => expect(start.props.accessibilityState).toEqual({ disabled: false }));
    fireEvent.press(start);

    expect(await view.findByRole('header', { name: 'Lesson destination' })).toBeTruthy();
    expect(view.getByText('recall-name-response')).toBeTruthy();
    expect(view.getByText('daily-plan-navigation')).toBeTruthy();
  });

  it('opens the journey roadmap from Your Journey So Far', async () => {
    const view = renderTestApp();

    fireEvent.press(await view.findByRole('button', { name: 'Your journey so far' }));
    expect(await view.findByRole('header', { name: 'Journey destination' })).toBeTruthy();
  });

  it('reloads the selected-dog plan whenever Home regains focus', async () => {
    const view = renderTestApp();

    await view.findByRole('button', { name: 'Start next lesson' });
    await waitFor(() => expect(mockGetOrCreate).toHaveBeenCalledTimes(1));
    fireEvent.press(view.getByText('Academy'));
    fireEvent.press(await view.findByRole('button', { name: 'Return to Today' }));

    await waitFor(() => expect(mockGetOrCreate).toHaveBeenCalledTimes(2));
  });

  it('routes the newest plan even when an earlier request resolves late', async () => {
    const firstRequest = deferred<TodayPlanView>();
    mockGetOrCreate.mockReset();
    mockGetOrCreate
      .mockReturnValueOnce(firstRequest.promise)
      .mockResolvedValueOnce(planForLesson('lesson-latest-focus'));
    const view = renderTestApp();

    await waitFor(() => expect(mockGetOrCreate).toHaveBeenCalledTimes(1));
    fireEvent.press(view.getByText('Academy'));
    fireEvent.press(await view.findByRole('button', { name: 'Return to Today' }));
    await waitFor(() => expect(mockGetOrCreate).toHaveBeenCalledTimes(2));

    const start = await view.findByRole('button', { name: 'Start next lesson' });
    await waitFor(() => expect(start.props.accessibilityState).toEqual({ disabled: false }));

    // The stale first request resolves after the newest one — it must be ignored.
    await act(async () => {
      firstRequest.resolve(planForLesson('lesson-stale-focus'));
    });

    fireEvent.press(view.getByRole('button', { name: 'Start next lesson' }));
    expect(await view.findByRole('header', { name: 'Lesson destination' })).toBeTruthy();
    expect(view.getByText('lesson-latest-focus')).toBeTruthy();
    expect(view.queryByText('lesson-stale-focus')).toBeNull();
  });
});

function MainTabs(): React.JSX.Element {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Today">
        {(props) => <TodayScreen {...props as unknown as TodayScreenProps} />}
      </Tab.Screen>
      <Tab.Screen name="Academy" component={AcademyDestination} />
    </Tab.Navigator>
  );
}

function AcademyDestination({
  navigation,
}: BottomTabScreenProps<MainTabParamList, 'Academy'>): React.JSX.Element {
  return (
    <View>
      <Text accessibilityRole="header">Academy destination</Text>
      <PrimaryButton title="Return to Today" onPress={() => navigation.navigate('Today')} />
    </View>
  );
}

function LessonDestination({
  route,
}: NativeStackScreenProps<RootStackParamList, 'LessonSummary'>): React.JSX.Element {
  return (
    <View>
      <Text accessibilityRole="header">Lesson destination</Text>
      <Text>{route.params.lessonId}</Text>
      <Text>{route.params.dailyPlanId}</Text>
    </View>
  );
}

function JourneyDestination(): React.JSX.Element {
  return (
    <View>
      <Text accessibilityRole="header">Journey destination</Text>
    </View>
  );
}

function renderTestApp() {
  return render(
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ animation: 'none', headerShown: false }}>
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="Journey" component={JourneyDestination} />
        <Stack.Screen name="LessonSummary" component={LessonDestination} />
      </Stack.Navigator>
    </NavigationContainer>,
  );
}

function plan(overrides: Partial<TodayPlanView> = {}): TodayPlanView {
  return {
    id: 'daily-plan-navigation',
    ownerId: sampleOwner.id,
    dogId: sampleDog.id,
    localDate: '2026-07-23',
    timezone: 'Australia/Adelaide',
    targetMinutes: 15,
    estimatedMinutes: 6,
    focusSkill: 'recall',
    status: 'planned',
    items: [{
      lessonId: 'recall-name-response',
      title: 'Name Response',
      description: 'Build a quick, happy turn when your dog hears their name.',
      skill: 'recall',
      difficultyLevel: 1,
      role: 'primary',
      plannedMinutes: 6,
      completed: false,
      lessonAvailable: true,
    }],
    completedItemCount: 0,
    stale: false,
    ...overrides,
  };
}

function planForLesson(lessonId: string): TodayPlanView {
  const base = plan();
  return plan({ items: [{ ...base.items[0], lessonId }] });
}

function onboardingValue(): ReturnType<typeof useOnboarding> {
  return {
    status: {
      state: 'complete',
      hasSavedData: true,
      owner: sampleOwner,
      dog: sampleDog,
      behaviourProfile: sampleBehaviourProfile,
      assessment: sampleBehaviourAssessment,
    },
  } as ReturnType<typeof useOnboarding>;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}
