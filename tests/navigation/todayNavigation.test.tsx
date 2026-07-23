import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  type NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { useSyncExternalStore } from 'react';
import { Text, View } from 'react-native';

import { PrimaryButton } from '../../src/components/PrimaryButton';
import type { Dog } from '../../src/domain/models';
import {
  sampleBehaviourAssessment,
  sampleBehaviourProfile,
  sampleDog,
  sampleOwner,
} from '../../src/development/seed/sampleData';
import { TodayPlanError } from '../../src/features/daily-plan/TodayPlanError';
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
  todayPlanService: {
    getOrCreate: jest.fn(),
  },
}));

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const mockUseOnboarding = jest.mocked(useOnboarding);
const mockGetOrCreate = jest.mocked(todayPlanService.getOrCreate);
const onboardingListeners = new Set<() => void>();
let currentOnboardingValue: ReturnType<typeof useOnboarding>;

describe('Today navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    onboardingListeners.clear();
    currentOnboardingValue = onboardingValue();
    mockUseOnboarding.mockImplementation(useMockOnboarding);
    mockGetOrCreate.mockResolvedValue(plan());
  });

  it('presents NO_ELIGIBLE_LESSONS as an empty state with Academy guidance', async () => {
    mockGetOrCreate.mockRejectedValueOnce(
      new TodayPlanError('NO_ELIGIBLE_LESSONS'),
    );
    const view = renderTestApp();

    expect(await view.findByRole('header', {
      name: 'No Daily Plan lessons today',
    })).toBeTruthy();
    expect(view.queryByText('Something went wrong')).toBeNull();

    fireEvent.press(view.getByRole('button', {
      name: 'Browse all 30 lessons',
    }));
    expect(await view.findByRole('header', {
      name: 'Academy destination',
    })).toBeTruthy();
  });

  it('opens Academy through the clear Today action', async () => {
    const view = renderTestApp();

    fireEvent.press(await view.findByRole('button', {
      name: 'Browse all 30 lessons',
    }));

    expect(await view.findByRole('header', { name: 'Academy destination' })).toBeTruthy();
  });

  it('routes a plan lesson using only lessonId and dailyPlanId', async () => {
    const view = renderTestApp();

    fireEvent.press(await view.findByRole('button', {
      name: 'View Name Response',
    }));

    expect(await view.findByRole('header', { name: 'Lesson destination' })).toBeTruthy();
    expect(view.getByText('recall-name-response')).toBeTruthy();
    expect(view.getByText('daily-plan-navigation')).toBeTruthy();
  });

  it('reloads the selected-dog plan whenever Today regains focus', async () => {
    const view = renderTestApp();

    await view.findByRole('header', { name: "Today's lessons" });
    expect(mockGetOrCreate).toHaveBeenCalledTimes(1);
    fireEvent.press(view.getByRole('button', { name: 'Browse all 30 lessons' }));
    fireEvent.press(await view.findByRole('button', { name: 'Return to Today' }));

    await waitFor(() => expect(mockGetOrCreate).toHaveBeenCalledTimes(2));
    expect(mockGetOrCreate).toHaveBeenLastCalledWith({
      ownerId: sampleOwner.id,
      dogId: sampleDog.id,
      timezone: expect.any(String),
    });
  });

  it('does not display an older dog request after the selected dog changes', async () => {
    const olderRequest = deferred<TodayPlanView>();
    const selectedRequest = deferred<TodayPlanView>();
    const selectedDog: Dog = {
      ...sampleDog,
      id: 'dog-newly-selected',
      name: 'Luna',
    };
    mockGetOrCreate.mockReset();
    mockGetOrCreate.mockImplementation(({ dogId }) =>
      dogId === selectedDog.id
        ? selectedRequest.promise
        : olderRequest.promise,
    );
    const view = renderTestApp();
    await waitFor(() => expect(mockGetOrCreate).toHaveBeenCalledWith(
      expect.objectContaining({ dogId: sampleDog.id }),
    ));

    setOnboardingValue(onboardingValue(selectedDog));
    await waitFor(() => expect(mockGetOrCreate).toHaveBeenCalledWith(
      expect.objectContaining({ dogId: selectedDog.id }),
    ));

    await act(async () => {
      selectedRequest.resolve(planForDog(
        selectedDog,
        'Current Dog Lesson',
        'lesson-current-dog',
      ));
    });
    expect(await view.findByText('Current Dog Lesson')).toBeTruthy();
    expect(view.getByText('Luna')).toBeTruthy();

    await act(async () => {
      olderRequest.resolve(planForDog(
        sampleDog,
        'Older Dog Lesson',
        'lesson-older-dog',
      ));
    });
    await waitFor(() => {
      expect(view.queryByText('Older Dog Lesson')).toBeNull();
      expect(view.getByText('Current Dog Lesson')).toBeTruthy();
    });
  });

  it('keeps the newest focus request when Today responses resolve out of order', async () => {
    const firstRequest = deferred<TodayPlanView>();
    mockGetOrCreate.mockReset();
    mockGetOrCreate
      .mockReturnValueOnce(firstRequest.promise)
      .mockResolvedValueOnce(planForDog(
        sampleDog,
        'Latest Focus Lesson',
        'lesson-latest-focus',
      ));
    const view = renderTestApp();
    await waitFor(() => expect(mockGetOrCreate).toHaveBeenCalledTimes(1));

    fireEvent.press(view.getByText('Academy'));
    fireEvent.press(await view.findByRole('button', { name: 'Return to Today' }));
    expect(await view.findByText('Latest Focus Lesson')).toBeTruthy();
    expect(mockGetOrCreate).toHaveBeenCalledTimes(2);

    await act(async () => {
      firstRequest.resolve(planForDog(
        sampleDog,
        'Stale Focus Lesson',
        'lesson-stale-focus',
      ));
    });
    await waitFor(() => {
      expect(view.queryByText('Stale Focus Lesson')).toBeNull();
      expect(view.getByText('Latest Focus Lesson')).toBeTruthy();
    });
  });
});

function MainTabs(): React.JSX.Element {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Today">
        {(props) => (
          <TodayScreen {...props as unknown as TodayScreenProps} />
        )}
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
      <PrimaryButton
        title="Return to Today"
        onPress={() => navigation.navigate('Today')}
      />
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

function renderTestApp() {
  return render(<TestApp />);
}

function TestApp(): React.JSX.Element {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ animation: 'none', headerShown: false }}
      >
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="LessonSummary" component={LessonDestination} />
      </Stack.Navigator>
    </NavigationContainer>
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

function planForDog(
  dog: Dog,
  title: string,
  lessonId: string,
): TodayPlanView {
  const base = plan();
  return plan({
    dogId: dog.id,
    items: [{
      ...base.items[0],
      lessonId,
      title,
    }],
  });
}

function onboardingValue(dog: Dog = sampleDog): ReturnType<typeof useOnboarding> {
  return {
    status: {
      state: 'complete',
      hasSavedData: true,
      owner: sampleOwner,
      dog,
      behaviourProfile: {
        ...sampleBehaviourProfile,
        dogId: dog.id,
      },
      assessment: {
        ...sampleBehaviourAssessment,
        dogId: dog.id,
      },
    },
  } as ReturnType<typeof useOnboarding>;
}

function useMockOnboarding(): ReturnType<typeof useOnboarding> {
  return useSyncExternalStore(
    subscribeToOnboarding,
    () => currentOnboardingValue,
    () => currentOnboardingValue,
  );
}

function subscribeToOnboarding(listener: () => void): () => void {
  onboardingListeners.add(listener);
  return () => onboardingListeners.delete(listener);
}

function setOnboardingValue(value: ReturnType<typeof useOnboarding>): void {
  act(() => {
    currentOnboardingValue = value;
    onboardingListeners.forEach((listener) => listener());
  });
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}
