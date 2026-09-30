import type { ComponentProps } from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { sampleBehaviourProfile, sampleDog, sampleOwner } from '../../src/development/seed/sampleData';
import type { AdaptiveTrainingMemory } from '../../src/domain/models/AdaptiveTrainingMemory';
import { useOnboarding } from '../../src/features/onboarding/OnboardingContext';
import { loadAdaptiveSessionHistory, loadAdaptiveTrainingMemory } from '../../src/services/AdaptiveTrainingPersistenceService';
import { WeeklyTrainerReviewScreen } from '../../src/screens/WeeklyTrainerReviewScreen';

jest.mock('../../src/features/onboarding/OnboardingContext', () => ({ useOnboarding: jest.fn() }));
jest.mock('../../src/services/AdaptiveTrainingPersistenceService', () => ({
  loadAdaptiveTrainingMemory: jest.fn(),
  loadAdaptiveSessionHistory: jest.fn(),
}));

const mockUseOnboarding = jest.mocked(useOnboarding);
const mockLoadAdaptiveTrainingMemory = jest.mocked(loadAdaptiveTrainingMemory);
const mockLoadAdaptiveSessionHistory = jest.mocked(loadAdaptiveSessionHistory);

describe('WeeklyTrainerReviewScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-09-12T12:00:00.000Z'));
    jest.clearAllMocks();
    mockUseOnboarding.mockReturnValue({
      status: {
        state: 'complete', hasSavedData: true, owner: sampleOwner,
        dog: { ...sampleDog, name: 'Pepper' }, behaviourProfile: sampleBehaviourProfile,
      },
    } as ReturnType<typeof useOnboarding>);
    mockLoadAdaptiveTrainingMemory.mockResolvedValue(memory());
    mockLoadAdaptiveSessionHistory.mockResolvedValue([
      history('s3', '2026-09-11T12:00:00.000Z', 0.9, 0),
      history('s2', '2026-09-10T12:00:00.000Z', 0.85, 0),
      history('s1', '2026-09-09T12:00:00.000Z', 0.8, 0),
    ]);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders a grounded weekly review and opens its evidence views', async () => {
    const navigate = jest.fn();
    const view = render(<WeeklyTrainerReviewScreen {...props(navigate)} />);

    expect(await view.findByRole('header', { name: 'Weekly Trainer Review' })).toBeTruthy();
    expect(await view.findByText('Evidence supports careful progression')).toBeTruthy();
    expect(view.getByText(/3 coached sessions and 15 recorded reps/)).toBeTruthy();
    expect(view.getByText(/exactly one challenge variable/)).toBeTruthy();

    fireEvent.press(view.getByRole('button', { name: 'Open Adaptive 7-Day Program' }));
    expect(navigate).toHaveBeenCalledWith('AdaptiveProgram');
    fireEvent.press(view.getByRole('button', { name: 'Open Training Intelligence' }));
    expect(navigate).toHaveBeenCalledWith('TrainingIntelligence');
    fireEvent.press(view.getByRole('button', { name: 'Open Behaviour Timeline' }));
    expect(navigate).toHaveBeenCalledWith('BehaviourTimeline');
  });

  it('surfaces a recovery recommendation when comfort evidence appears', async () => {
    mockLoadAdaptiveSessionHistory.mockResolvedValue([
      history('stress', '2026-09-11T12:00:00.000Z', 0.9, 0.4, 'stress'),
    ]);
    const view = render(<WeeklyTrainerReviewScreen {...props(jest.fn())} />);

    expect(await view.findByText('Protect comfort before progression')).toBeTruthy();
    expect(view.getByText(/comfort overrides progression/)).toBeTruthy();
    expect(view.getByText(/Pause progression/)).toBeTruthy();
  });

  it('fails safely if adaptive evidence cannot be read', async () => {
    mockLoadAdaptiveTrainingMemory.mockRejectedValue(new Error('bad storage'));
    const view = render(<WeeklyTrainerReviewScreen {...props(jest.fn())} />);

    expect(await view.findByText(/could not read the saved adaptive training record safely/)).toBeTruthy();
  });
});

function memory(): AdaptiveTrainingMemory {
  return {
    schemaVersion: 1,
    dogId: sampleDog.id,
    totalSessions: 4,
    updatedAt: '2026-09-11T12:00:00.000Z',
    skills: {
      focus: {
        skillId: 'focus', sessionsCompleted: 4, totalReps: 20, cleanRepRate: 0.9,
        repeatedCueRate: 0, slowResponseRate: 0, stressSignalRate: 0, correctedRepRate: 0,
        lastTrainedAt: '2026-09-11T12:00:00.000Z', lastEndedEarly: false,
        lastEndReason: 'target_reached', recommendedDifficulty: { distance: 2, duration: 2, distraction: 1 },
      },
    },
  };
}

function history(id: string, completedAt: string, cleanRepRate: number, stressSignalRate: number, endReason: 'target_reached' | 'stress' = 'target_reached') {
  return {
    id,
    dogId: sampleDog.id,
    lessonId: 'focus-name-response',
    skillId: 'focus',
    completedAt,
    totalReps: 5,
    cleanRepRate,
    repeatedCueRate: 0,
    slowResponseRate: 0,
    stressSignalRate,
    correctedRepRate: 0,
    endedEarly: endReason === 'stress',
    endReason,
    startingDifficulty: { distance: 1, duration: 1, distraction: 1 },
    endingDifficulty: { distance: 2, duration: 2, distraction: 1 },
  };
}

function props(navigate: jest.Mock) {
  return {
    navigation: { navigate }, route: { key: 'weekly-review', name: 'WeeklyTrainerReview' },
  } as unknown as ComponentProps<typeof WeeklyTrainerReviewScreen>;
}
