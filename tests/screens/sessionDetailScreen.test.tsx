import {
  createNavigationContainerRef,
  NavigationContainer,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import {
  sampleBehaviourAssessment,
  sampleBehaviourProfile,
  sampleDog,
  sampleOwner,
} from '../../src/development/seed/sampleData';
import { useOnboarding } from '../../src/features/onboarding/OnboardingContext';
import { TrainingHistoryError } from '../../src/features/progress/history/TrainingHistoryError';
import type {
  TrainingHistoryEntry,
  TrainingHistoryPage,
} from '../../src/features/progress/history/TrainingHistoryTypes';
import { trainingHistoryQueryService } from '../../src/features/progress/history/trainingHistoryServices';
import { SessionDetailScreen } from '../../src/screens/SessionDetailScreen';
import { SessionHistoryScreen } from '../../src/screens/SessionHistoryScreen';
import type { RootStackParamList } from '../../src/types/navigation';

jest.mock('../../src/features/onboarding/OnboardingContext', () => ({
  useOnboarding: jest.fn(),
}));
jest.mock('../../src/features/progress/history/trainingHistoryServices', () => ({
  trainingHistoryQueryService: {
    list: jest.fn(),
    getById: jest.fn(),
  },
}));

const Stack = createNativeStackNavigator<RootStackParamList>();
const mockUseOnboarding = jest.mocked(useOnboarding);
const mockList = jest.mocked(trainingHistoryQueryService.list);
const mockGetById = jest.mocked(trainingHistoryQueryService.getById);

describe('SessionDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseOnboarding.mockReturnValue({
      status: {
        state: 'complete',
        hasSavedData: true,
        owner: sampleOwner,
        dog: sampleDog,
        behaviourProfile: sampleBehaviourProfile,
        assessment: sampleBehaviourAssessment,
      },
    } as ReturnType<typeof useOnboarding>);
    mockList.mockResolvedValue(emptyPage());
  });

  it('shows an accessible loading state', async () => {
    mockGetById.mockReturnValue(new Promise(() => undefined));
    const { view } = renderDetail();

    expect(await view.findByRole('progressbar', {
      name: 'Loading session details…',
    })).toBeTruthy();
    expect(view.getByRole('button', { name: 'Back to history' })).toBeTruthy();
  });

  it('looks up only the route sessionId for the selected owner and dog', async () => {
    const selectedEntry = entry();
    mockGetById.mockResolvedValue(selectedEntry);
    const { view } = renderDetail(selectedEntry.sessionId);

    expect(await view.findByRole('header', { name: selectedEntry.lessonTitle })).toBeTruthy();
    expect(mockGetById).toHaveBeenCalledWith({
      ownerId: sampleOwner.id,
      dogId: sampleDog.id,
      sessionId: selectedEntry.sessionId,
      timeZone: expect.any(String),
    });
    expect(view.getByLabelText('Skill: Focus')).toBeTruthy();
    expect(view.getByLabelText('Completed: 23 July 2026')).toBeTruthy();
    expect(view.getByLabelText('Duration: 5 min')).toBeTruthy();
    expect(view.getByLabelText('Outcome: Successful')).toBeTruthy();
    expect(view.getByLabelText('Rating range: 4–5')).toBeTruthy();
    expect(view.getByText(selectedEntry.notes)).toBeTruthy();
  });

  it('uses the same private message for foreign and nonexistent sessions', async () => {
    mockGetById.mockRejectedValue(new TrainingHistoryError(
      'SESSION_NOT_FOUND',
      { sessionId: 'private-session' },
    ));
    const { view } = renderDetail('private-session');

    expect(await view.findByText(
      'This session is not available for the selected dog.',
    )).toBeTruthy();
    expect(view.queryByText(/another dog|foreign/i)).toBeNull();
  });

  it('shows a retryable error and reloads the same isolated session', async () => {
    const selectedEntry = entry({ sessionId: 'session-retry' });
    mockGetById
      .mockRejectedValueOnce(new TrainingHistoryError('READ_FAILED'))
      .mockResolvedValueOnce(selectedEntry);
    const { view } = renderDetail(selectedEntry.sessionId);

    expect(await view.findByText(/could not be loaded/)).toBeTruthy();
    fireEvent.press(view.getByRole('button', { name: 'Try again' }));

    expect(await view.findByRole('header', { name: selectedEntry.lessonTitle })).toBeTruthy();
    expect(mockGetById).toHaveBeenCalledTimes(2);
    expect(mockGetById).toHaveBeenLastCalledWith(expect.objectContaining({
      dogId: sampleDog.id,
      sessionId: selectedEntry.sessionId,
    }));
  });

  it('reloads detail when the screen regains focus', async () => {
    const selectedEntry = entry({ sessionId: 'session-focus-detail' });
    mockGetById.mockResolvedValue(selectedEntry);
    const navigationRef = createNavigationContainerRef<RootStackParamList>();
    const { view } = renderDetail(selectedEntry.sessionId, navigationRef);
    expect(await view.findByRole('header', { name: selectedEntry.lessonTitle })).toBeTruthy();
    expect(mockGetById).toHaveBeenCalledTimes(1);

    act(() => navigationRef.navigate('SessionHistory'));
    expect(await view.findByRole('header', { name: 'Training history' })).toBeTruthy();
    act(() => navigationRef.goBack());

    await waitFor(() => expect(mockGetById).toHaveBeenCalledTimes(2));
    expect(await view.findByRole('header', { name: selectedEntry.lessonTitle })).toBeTruthy();
  });

  it('renders the unknown-lesson explanation and empty notes accessibly', async () => {
    mockGetById.mockResolvedValue(entry({
      lessonTitle: 'Unknown lesson',
      lessonAvailable: false,
      skill: null,
      notes: '   ',
    }));
    const { view } = renderDetail();

    expect(await view.findByRole('alert')).toBeTruthy();
    expect(view.getByText(/no longer in the current catalogue/)).toBeTruthy();
    expect(view.getByLabelText('Skill: Skill unavailable')).toBeTruthy();
    expect(view.getByText('No notes were recorded for this session.')).toBeTruthy();
  });
});

function renderDetail(
  sessionId = 'session-detail-1',
  navigationRef = createNavigationContainerRef<RootStackParamList>(),
) {
  return {
    navigationRef,
    view: render(
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator
          initialRouteName="SessionDetail"
          screenOptions={{ headerShown: false, animation: 'none' }}
        >
          <Stack.Screen
            name="SessionDetail"
            component={SessionDetailScreen}
            initialParams={{ sessionId }}
          />
          <Stack.Screen name="SessionHistory" component={SessionHistoryScreen} />
        </Stack.Navigator>
      </NavigationContainer>,
    ),
  };
}

function emptyPage(): TrainingHistoryPage {
  return {
    entries: [],
    totalCount: 0,
    excludedIncompleteCount: 0,
    offset: 0,
    limit: 50,
    hasMore: false,
  };
}

function entry(overrides: Partial<TrainingHistoryEntry> = {}): TrainingHistoryEntry {
  return {
    sessionId: 'session-detail-1',
    dogId: sampleDog.id,
    lessonId: 'fixture-foundation-focus',
    dailyPlanId: null,
    lessonTitle: 'Fixture Foundation Focus',
    lessonAvailable: true,
    skill: 'focus',
    startedAt: '2026-07-23T02:55:00.000Z',
    completedAt: '2026-07-23T03:00:00.000Z',
    localDate: '2026-07-23',
    durationMinutes: 5,
    outcome: 'success',
    notes: 'Calm repetitions with good eye contact.',
    exactRating: null,
    ratingBand: '4-5',
    ...overrides,
  };
}
