import { fireEvent, render } from '@testing-library/react-native';

import { TodayPlanError } from '../../src/features/daily-plan/TodayPlanError';
import type { TodayPlanView } from '../../src/features/daily-plan/TodayPlanTypes';
import {
  useTodayPlan,
  type UseTodayPlanResult,
} from '../../src/features/daily-plan/useTodayPlan';
import {
  TodayScreen,
  type TodayScreenProps,
} from '../../src/screens/TodayScreen';

jest.mock('../../src/features/daily-plan/useTodayPlan', () => ({
  useTodayPlan: jest.fn(),
}));

const mockUseTodayPlan = jest.mocked(useTodayPlan);

describe('TodayScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows an accessible loading state', () => {
    mockUseTodayPlan.mockReturnValue(result({ loading: true, plan: null }));

    const view = renderToday();

    expect(view.getByRole('progressbar', {
      name: /Preparing today's training plan/,
    })).toBeTruthy();
  });

  it('renders a selected-dog plan with real lesson content and no test control', () => {
    mockUseTodayPlan.mockReturnValue(result());

    const view = renderToday();

    expect(view.getByText('Milo')).toBeTruthy();
    expect(view.getByText('One focused lesson today.')).toBeTruthy();
    expect(view.getByRole('header', { name: "Today's lessons" })).toBeTruthy();
    expect(view.getByRole('header', { name: 'Name Response' })).toBeTruthy();
    expect(view.getByText('Recall')).toBeTruthy();
    expect(view.getByText('Main lesson · 6 min · Level 1')).toBeTruthy();
    expect(view.getByRole('button', { name: 'View Name Response' })).toBeTruthy();
    expect(view.queryByText(/Complete test lesson/i)).toBeNull();
  });

  it('uses plural Today copy when the generated plan has two lessons', () => {
    const primary = plan().items[0];
    mockUseTodayPlan.mockReturnValue(result({
      plan: plan({
        items: [
          primary,
          {
            ...primary,
            lessonId: 'focus-marker-word',
            title: 'Marker Word',
            role: 'reinforcement',
          },
        ],
      }),
    }));

    const view = renderToday();

    expect(view.getByText('2 focused lessons today.')).toBeTruthy();
    expect(view.queryByText('One focused lesson today.')).toBeNull();
  });

  it('retries after a query error and keeps Academy available', () => {
    const retry = jest.fn();
    mockUseTodayPlan.mockReturnValue(result({
      error: new TodayPlanError('CORRUPT_STORED_DATA'),
      plan: null,
      retry,
    }));
    const { view, navigate } = renderTodayWithNavigation();

    expect(view.getByText(/could not be read safely/)).toBeTruthy();
    fireEvent.press(view.getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalledTimes(1);

    fireEvent.press(view.getByRole('button', { name: 'Browse all 30 lessons' }));
    expect(navigate).toHaveBeenCalledWith('Academy');
  });

  it('presents NO_ELIGIBLE_LESSONS as guidance instead of a generic error', () => {
    mockUseTodayPlan.mockReturnValue(result({
      error: new TodayPlanError('NO_ELIGIBLE_LESSONS'),
      plan: null,
    }));

    const view = renderToday();

    expect(view.getByRole('header', {
      name: 'No Daily Plan lessons today',
    })).toBeTruthy();
    expect(view.getByText(/no suitable Daily Plan lessons available/i)).toBeTruthy();
    expect(view.getByRole('button', { name: 'Browse all 30 lessons' })).toBeTruthy();
    expect(view.queryByText('Something went wrong')).toBeNull();
  });

  it('shows stale plan guidance and disables obsolete lesson navigation', () => {
    mockUseTodayPlan.mockReturnValue(result({
      plan: plan({
        stale: true,
        items: [{
          lessonId: 'retired-lesson',
          title: 'Unknown lesson',
          description: 'This saved lesson is no longer available.',
          skill: 'focus',
          difficultyLevel: null,
          role: 'primary',
          plannedMinutes: 5,
          completed: false,
          lessonAvailable: false,
        }],
      }),
    }));

    const view = renderToday();

    expect(view.getAllByRole('alert')).toHaveLength(2);
    expect(view.getByText('Part of this plan is out of date')).toBeTruthy();
    expect(view.getByRole('header', { name: 'Unknown lesson' })).toBeTruthy();
    expect(view.queryByRole('button', { name: /Unknown lesson/ })).toBeNull();
  });

  it('does not route completed-plan items through a closed dailyPlanId', () => {
    mockUseTodayPlan.mockReturnValue(result({
      plan: plan({
        status: 'completed',
        completedItemCount: 1,
        items: [{
          ...plan().items[0],
          completed: true,
        }],
      }),
    }));

    const view = renderToday();

    expect(view.getByText("Today's plan is complete.")).toBeTruthy();
    expect(view.queryByRole('button', { name: /Name Response/ })).toBeNull();
    expect(view.getByText(/Open this lesson from the Academy/)).toBeTruthy();
  });
});

function renderToday() {
  return renderTodayWithNavigation().view;
}

function renderTodayWithNavigation() {
  const navigate = jest.fn();
  const props = {
    navigation: { navigate },
    route: { key: 'today-test', name: 'Today' },
  } as unknown as TodayScreenProps;
  return {
    navigate,
    view: render(<TodayScreen {...props} />),
  };
}

function result(
  overrides: Partial<UseTodayPlanResult> = {},
): UseTodayPlanResult {
  return {
    plan: plan(),
    loading: false,
    error: null,
    selectedDogName: 'Milo',
    retry: jest.fn(),
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
