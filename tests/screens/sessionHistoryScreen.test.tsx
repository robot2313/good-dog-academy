import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import {
  sampleBehaviourAssessment,
  sampleBehaviourProfile,
  sampleDog,
  sampleOwner,
} from '../../src/development/seed/sampleData';
import { useOnboarding } from '../../src/features/onboarding/OnboardingContext';
import { TrainingHistoryError } from '../../src/features/progress/history/TrainingHistoryError';
import { TrainingSessionCard } from '../../src/features/progress/history/TrainingSessionCard';
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

describe('SessionHistoryScreen', () => {
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
  });

  it('shows an accessible loading state', async () => {
    mockList.mockReturnValue(new Promise(() => undefined));
    const view = renderHistory();

    expect(await view.findByRole('progressbar', {
      name: 'Loading training history…',
    })).toBeTruthy();
    expect(view.getByRole('button', { name: 'Back to Progress' })).toBeTruthy();
  });

  it('shows an empty state after a successful selected-dog query', async () => {
    mockList.mockResolvedValue(page([]));
    const view = renderHistory();

    expect(await view.findByRole('header', { name: 'Training history' })).toBeTruthy();
    expect(view.getByRole('header', { name: 'No sessions yet' })).toBeTruthy();
    expect(view.getByText(/Complete a guided lesson/)).toBeTruthy();
    expect(mockList).toHaveBeenCalledWith(expect.objectContaining({
      ownerId: sampleOwner.id,
      dogId: sampleDog.id,
      timeZone: expect.any(String),
    }));
  });

  it('renders successful history in the service order with accessible cards', async () => {
    const newer = entry({ sessionId: 'session-newer', notes: 'Great focus near the gate.' });
    const older = entry({
      sessionId: 'session-older',
      lessonTitle: 'Older lesson',
      completedAt: '2026-07-22T03:00:00.000Z',
      localDate: '2026-07-22',
      outcome: 'partial-success',
      ratingBand: '3',
      notes: '',
    });
    mockList.mockResolvedValue(page([newer, older]));
    const view = renderHistory();

    expect(await view.findByText(newer.lessonTitle)).toBeTruthy();
    const sessionButtons = view.getAllByRole('button').filter(
      (button) => String(button.props.accessibilityHint) === 'Opens session details',
    );
    expect(sessionButtons.map((button) => button.props.accessibilityLabel)).toEqual([
      expect.stringContaining(newer.lessonTitle),
      expect.stringContaining(older.lessonTitle),
    ]);
    expect(view.getByText('Great focus near the gate.')).toBeTruthy();
    expect(view.getByText('Successful')).toBeTruthy();
    expect(view.getByText('Rating 4–5')).toBeTruthy();
  });

  it('retries after a query error', async () => {
    mockList
      .mockRejectedValueOnce(new TrainingHistoryError('READ_FAILED'))
      .mockResolvedValueOnce(page([entry()]));
    const view = renderHistory();

    expect(await view.findByText(/could not be loaded/)).toBeTruthy();
    fireEvent.press(view.getByRole('button', { name: 'Try again' }));

    expect(await view.findByText(entry().lessonTitle)).toBeTruthy();
    expect(mockList).toHaveBeenCalledTimes(2);
  });

  it('preserves the unknown-lesson fallback and unavailable skill label', async () => {
    mockList.mockResolvedValue(page([entry({
      lessonTitle: 'Unknown lesson',
      lessonAvailable: false,
      skill: null,
    })]));
    const view = renderHistory();

    expect(await view.findByText('Unknown lesson')).toBeTruthy();
    expect(view.getByText('Skill unavailable')).toBeTruthy();
    expect(view.getByRole('button', { name: /Unknown lesson.*Skill unavailable/ })).toBeTruthy();
  });

  it('navigates by session ID and reloads history when focus returns', async () => {
    const selectedEntry = entry({ sessionId: 'session-focus-refresh' });
    mockList.mockResolvedValue(page([selectedEntry]));
    mockGetById.mockResolvedValue(selectedEntry);
    const view = renderHistory();

    fireEvent.press(await view.findByRole('button', {
      name: new RegExp(selectedEntry.lessonTitle),
    }));
    expect(await view.findByText('SESSION DETAIL')).toBeTruthy();
    expect(mockGetById).toHaveBeenCalledWith(expect.objectContaining({
      ownerId: sampleOwner.id,
      dogId: sampleDog.id,
      sessionId: selectedEntry.sessionId,
    }));

    fireEvent.press(view.getByRole('button', { name: 'Back to history' }));
    await waitFor(() => expect(mockList).toHaveBeenCalledTimes(2));
    expect(await view.findByRole('header', { name: 'Training history' })).toBeTruthy();
  });
});

describe('TrainingSessionCard', () => {
  it('displays content, text outcome, notes preview, and an accessible touch target', () => {
    const onPress = jest.fn();
    const item = entry({ notes: 'Short calm repetitions.' });
    const view = render(<TrainingSessionCard entry={item} onPress={onPress} />);

    expect(view.getByText(item.lessonTitle)).toBeTruthy();
    expect(view.getByText('Focus')).toBeTruthy();
    expect(view.getByText('23 July 2026')).toBeTruthy();
    expect(view.getByText('5 min')).toBeTruthy();
    expect(view.getByText('Successful')).toBeTruthy();
    expect(view.getByText('Rating 4–5')).toBeTruthy();
    expect(view.getByText('Short calm repetitions.')).toBeTruthy();
    const button = view.getByRole('button', {
      name: /Outcome: Successful.*Rating range 4–5.*Notes: Short calm repetitions/,
    });
    expect(button.props.accessibilityHint).toBe('Opens session details');
    fireEvent.press(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

function renderHistory() {
  return render(
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="SessionHistory"
        screenOptions={{ headerShown: false, animation: 'none' }}
      >
        <Stack.Screen name="SessionHistory" component={SessionHistoryScreen} />
        <Stack.Screen name="SessionDetail" component={SessionDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>,
  );
}

function page(entries: readonly TrainingHistoryEntry[]): TrainingHistoryPage {
  return {
    entries,
    totalCount: entries.length,
    excludedIncompleteCount: 0,
    offset: 0,
    limit: 50,
    hasMore: false,
  };
}

function entry(overrides: Partial<TrainingHistoryEntry> = {}): TrainingHistoryEntry {
  return {
    sessionId: 'session-history-1',
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
    notes: 'A steady session.',
    exactRating: null,
    ratingBand: '4-5',
    ...overrides,
  };
}
