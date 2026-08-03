import { fireEvent, render } from '@testing-library/react-native';

import type { LessonProgress } from '../../src/domain/models';
import type { TodayPlanView } from '../../src/features/daily-plan/TodayPlanTypes';
import {
  useTodayPlan,
  type UseTodayPlanResult,
} from '../../src/features/daily-plan/useTodayPlan';
import { useLessonLibraryData } from '../../src/features/lessons/library/LessonLibraryContext';
import {
  TodayScreen,
  type TodayScreenProps,
} from '../../src/screens/TodayScreen';

jest.mock('../../src/features/daily-plan/useTodayPlan', () => ({
  useTodayPlan: jest.fn(),
}));
jest.mock('../../src/features/lessons/library/LessonLibraryContext', () => ({
  useLessonLibraryData: jest.fn(),
}));

const mockUseTodayPlan = jest.mocked(useTodayPlan);
const mockUseLibrary = jest.mocked(useLessonLibraryData);

describe('TodayScreen (Home)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLibrary.mockReturnValue(libraryValue());
  });

  it('renders identity, a personalised welcome message, and two matching actions', () => {
    mockUseTodayPlan.mockReturnValue(result());
    mockUseLibrary.mockReturnValue(libraryValue({
      progressRecords: [progress({ status: 'completed', attempts: 3, successfulCompletions: 3 })],
    }));
    const { view, navigate } = renderHome();

    expect(view.getByText('M', { includeHiddenElements: true })).toBeTruthy();
    expect(view.getAllByLabelText('Milo')).toHaveLength(1);

    // Real-data welcome message (returning dog).
    expect(view.getByText('Welcome back, Milo')).toBeTruthy();
    expect(view.getByText('Milo has completed 1 lesson so far.')).toBeTruthy();
    expect(view.getByText("For the complete report, open Milo's profile from the Dog section below.")).toBeTruthy();

    fireEvent.press(view.getByRole('button', { name: 'Start next lesson' }));
    expect(navigate).toHaveBeenCalledWith('LessonSummary', {
      lessonId: 'recall-name-response',
      dailyPlanId: 'daily-plan-today',
    });
    fireEvent.press(view.getByRole('button', { name: 'Your journey so far' }));
    expect(navigate).toHaveBeenCalledWith('Journey');
  });

  it('shows the new-user welcome when the dog has no sessions yet', () => {
    mockUseTodayPlan.mockReturnValue(result());
    mockUseLibrary.mockReturnValue(libraryValue({ progressRecords: [] }));
    const view = renderHome().view;

    expect(view.getByText('Welcome to Good Dog Academy')).toBeTruthy();
    expect(view.getByText(/You and Milo are about to begin building great habits/)).toBeTruthy();
  });

  it('shows the add-a-dog welcome when no dog profile exists', () => {
    mockUseTodayPlan.mockReturnValue(result({ selectedDogName: null, plan: null }));
    mockUseLibrary.mockReturnValue(libraryValue({ selectedDog: null, progressRecords: [] }));
    const view = renderHome().view;

    expect(view.getByText('Welcome to Good Dog Academy')).toBeTruthy();
    expect(view.getByText(/Add your dog to begin a personalised training journey/)).toBeTruthy();
  });

  it('does not render the old dashboard content', () => {
    mockUseTodayPlan.mockReturnValue(result());
    const view = renderHome().view;

    expect(view.queryByText("Today's lessons")).toBeNull();
    expect(view.queryByText(/focused lesson/)).toBeNull();
    expect(view.queryByText(/Browse all 30 lessons/)).toBeNull();
    expect(view.queryByText('Explore the Academy')).toBeNull();
  });

  it('presents a completed state when every plan lesson is done', () => {
    mockUseTodayPlan.mockReturnValue(result({
      plan: plan({ status: 'completed', completedItemCount: 1, items: [{ ...plan().items[0], completed: true }] }),
    }));
    const { view, navigate } = renderHome();

    const primary = view.getByRole('button', { name: /All lessons complete/i });
    fireEvent.press(primary);
    expect(navigate).toHaveBeenCalledWith('Journey');
  });

  it('keeps the journey action available while the plan is still loading', () => {
    mockUseTodayPlan.mockReturnValue(result({ loading: true, plan: null }));
    const view = renderHome().view;

    expect(view.getByRole('button', { name: 'Your journey so far' })).toBeTruthy();
    expect(view.getByRole('button', { name: 'Start next lesson' }).props.accessibilityState)
      .toEqual({ disabled: true });
  });
});

function renderHome() {
  const navigate = jest.fn();
  const setParams = jest.fn();
  const props = {
    navigation: { navigate, setParams },
    route: { key: 'today-test', name: 'Today', params: undefined },
  } as unknown as TodayScreenProps;
  return { navigate, view: render(<TodayScreen {...props} />) };
}

function result(overrides: Partial<UseTodayPlanResult> = {}): UseTodayPlanResult {
  return {
    plan: plan(),
    loading: false,
    error: null,
    selectedDogName: 'Milo',
    retry: jest.fn(),
    ...overrides,
  };
}

function libraryValue(overrides: Record<string, unknown> = {}) {
  return {
    catalogue: { definitions: [], findById: () => null },
    selectedDog: { id: 'dog-1', name: 'Milo', photoUri: null },
    selectedOwnerId: 'owner-1',
    progressRecords: [],
    loading: false,
    error: null,
    retry: jest.fn(),
    completeLessonSession: jest.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useLessonLibraryData>;
}

function progress(overrides: Partial<LessonProgress> = {}): LessonProgress {
  return {
    id: 'lp-1',
    ownerId: 'owner-1',
    dogId: 'dog-1',
    lessonId: 'recall-name-response',
    status: 'completed',
    attempts: 1,
    successfulCompletions: 1,
    lastAttemptedAt: null,
    lastCompletedAt: null,
    bestPerformanceRating: 5,
    currentDifficultyAdjustment: 0,
    unlockedAt: null,
    createdAt: '2026-07-19T00:00:00.000Z',
    updatedAt: '2026-07-19T00:00:00.000Z',
    ...overrides,
  };
}

function plan(overrides: Partial<TodayPlanView> = {}): TodayPlanView {
  return {
    id: 'daily-plan-today',
    ownerId: 'owner-selected',
    dogId: 'dog-selected',
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
