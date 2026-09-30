import type { ComponentProps } from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { sampleBehaviourProfile, sampleDog, sampleOwner } from '../../src/development/seed/sampleData';
import { emptyAdaptiveTrainingMemory } from '../../src/domain/models/AdaptiveTrainingMemory';
import { DogLearningPassportError } from '../../src/features/progress/passport/DogLearningPassportError';
import type { DogLearningPassport } from '../../src/features/progress/passport/DogLearningPassportTypes';
import { useDogLearningPassport } from '../../src/features/progress/passport/useDogLearningPassport';
import { useOnboarding } from '../../src/features/onboarding/OnboardingContext';
import { loadAdaptiveSessionHistory, loadAdaptiveTrainingMemory } from '../../src/services/AdaptiveTrainingPersistenceService';
import { ProgressScreen } from '../../src/screens/ProgressScreen';

jest.mock('../../src/features/onboarding/OnboardingContext', () => ({ useOnboarding: jest.fn() }));
jest.mock('../../src/features/progress/passport/useDogLearningPassport', () => ({ useDogLearningPassport: jest.fn() }));
jest.mock('../../src/services/AdaptiveTrainingPersistenceService', () => ({
  loadAdaptiveTrainingMemory: jest.fn(),
  loadAdaptiveSessionHistory: jest.fn(),
}));

const mockUseOnboarding = jest.mocked(useOnboarding);
const mockUseDogLearningPassport = jest.mocked(useDogLearningPassport);
const mockLoadAdaptiveTrainingMemory = jest.mocked(loadAdaptiveTrainingMemory);
const mockLoadAdaptiveSessionHistory = jest.mocked(loadAdaptiveSessionHistory);

describe('ProgressScreen Learning Passport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseOnboarding.mockReturnValue({
      status: {
        state: 'complete', hasSavedData: true, owner: sampleOwner,
        dog: { ...sampleDog, name: 'Pepper' }, behaviourProfile: sampleBehaviourProfile,
      },
    } as ReturnType<typeof useOnboarding>);
    mockUseDogLearningPassport.mockReturnValue({
      passport: passport(), loading: false, error: null, retry: jest.fn(),
    });
    mockLoadAdaptiveTrainingMemory.mockResolvedValue(emptyAdaptiveTrainingMemory(sampleDog.id));
    mockLoadAdaptiveSessionHistory.mockResolvedValue([]);
  });

  it('shows dog-specific evidence and preserves lesson, session, and history navigation', () => {
    const navigate = jest.fn();
    const view = render(<ProgressScreen {...props(navigate)} />);

    expect(view.getByRole('header', { name: 'Learning Passport' })).toBeTruthy();
    expect(view.getByRole('header', { name: "Pepper's evidence" })).toBeTruthy();
    expect(view.getByLabelText('Lessons: 1')).toBeTruthy();
    expect(view.getByLabelText('Sessions: 3')).toBeTruthy();
    expect(view.getByLabelText('Minutes: 24')).toBeTruthy();
    expect(view.getByLabelText(/Focus\. Reliable here.*Reliable in quiet park/)).toBeTruthy();

    fireEvent.press(view.getByRole('button', { name: 'Continue Name Response' }));
    expect(navigate).toHaveBeenCalledWith('LessonSummary', { lessonId: 'focus-name-response' });

    fireEvent.press(view.getByRole('button', { name: /Name Response.*Successful session/ }));
    expect(navigate).toHaveBeenCalledWith('SessionDetail', { sessionId: 'session-1' });

    fireEvent.press(view.getByRole('button', { name: 'View session history' }));
    expect(navigate).toHaveBeenCalledWith('SessionHistory');
  });

  it('surfaces coached adaptive evidence and its intelligence views without replacing the passport', async () => {
    mockLoadAdaptiveTrainingMemory.mockResolvedValue({
      schemaVersion: 1,
      dogId: sampleDog.id,
      totalSessions: 3,
      updatedAt: '2026-09-10T10:00:00.000Z',
      skills: {
        focus: {
          skillId: 'focus', sessionsCompleted: 3, totalReps: 15, cleanRepRate: 0.8,
          repeatedCueRate: 0.1, slowResponseRate: 0.1, stressSignalRate: 0,
          correctedRepRate: 0, lastTrainedAt: '2026-09-10T10:00:00.000Z', lastEndedEarly: false,
          lastEndReason: 'target_reached', recommendedDifficulty: { distance: 2, duration: 2, distraction: 1 },
        },
      },
    });
    mockLoadAdaptiveSessionHistory.mockResolvedValue([
      history('h3', 0.9, '2026-09-10T10:00:00.000Z'),
      history('h2', 0.8, '2026-09-09T10:00:00.000Z'),
      history('h1', 0.6, '2026-09-08T10:00:00.000Z'),
    ]);

    const navigate = jest.fn();
    const view = render(<ProgressScreen {...props(navigate)} />);

    await waitFor(() => expect(view.getByText('3 adaptive sessions analysed')).toBeTruthy());
    expect(view.getByText(/Strongest current coached evidence: Focus/)).toBeTruthy();
    fireEvent.press(view.getByRole('button', { name: 'Open Training Intelligence' }));
    expect(navigate).toHaveBeenCalledWith('TrainingIntelligence');
    fireEvent.press(view.getByRole('button', { name: 'Open Behaviour Timeline' }));
    expect(navigate).toHaveBeenCalledWith('BehaviourTimeline');
  });

  it('shows accessible loading and safe error states with retry', () => {
    mockUseDogLearningPassport.mockReturnValue({ passport: null, loading: true, error: null, retry: jest.fn() });
    const loadingView = render(<ProgressScreen {...props(jest.fn())} />);
    expect(loadingView.getByRole('progressbar', { name: "Building Pepper's Learning Passport..." })).toBeTruthy();
    loadingView.unmount();

    const retry = jest.fn();
    mockUseDogLearningPassport.mockReturnValue({
      passport: null, loading: false, error: new DogLearningPassportError('CORRUPT_STORED_DATA'), retry,
    });
    const errorView = render(<ProgressScreen {...props(jest.fn())} />);
    expect(errorView.UNSAFE_getByProps({ accessibilityRole: 'alert' })).toBeTruthy();
    expect(errorView.getByText(/No training data was changed/)).toBeTruthy();
    fireEvent.press(errorView.getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('gives a useful first step when no evidence has been recorded', () => {
    mockUseDogLearningPassport.mockReturnValue({
      passport: passport({
        snapshot: {
          completedLessons: 0, activeLessons: 0, completedSessions: 0,
          successfulSessions: 0, trainingMinutes: 0, recordedEnvironments: 0,
        },
        skills: [], timeline: [],
        nextStep: { kind: 'academy', title: 'Browse the Academy', reason: 'Choose an appropriate first skill.', lessonId: null },
      }),
      loading: false, error: null, retry: jest.fn(),
    });
    const navigate = jest.fn();
    const view = render(<ProgressScreen {...props(navigate)} />);

    expect(view.getByRole('header', { name: 'No evidence recorded yet' })).toBeTruthy();
    fireEvent.press(view.getAllByRole('button', { name: 'Browse the Academy' })[0]);
    expect(navigate).toHaveBeenCalledWith('Academy');
  });
});

function history(id: string, cleanRepRate: number, completedAt: string) {
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
    stressSignalRate: 0,
    correctedRepRate: 0,
    endedEarly: false,
    endReason: 'target_reached' as const,
    startingDifficulty: { distance: 1, duration: 1, distraction: 1 },
    endingDifficulty: { distance: 2, duration: 2, distraction: 1 },
  };
}

function passport(overrides: Partial<DogLearningPassport> = {}): DogLearningPassport {
  return {
    dogId: sampleDog.id,
    snapshot: {
      completedLessons: 1, activeLessons: 1, completedSessions: 3,
      successfulSessions: 2, trainingMinutes: 24, recordedEnvironments: 1,
    },
    skills: [{
      skill: 'focus', title: 'Focus', evidenceLevel: 'reliable', completedLessons: 1,
      activeLessons: 1, completedSessions: 3, successfulSessions: 2, helpAttempts: 1,
      improvingEnvironments: ['quiet park'], reliableEnvironments: ['quiet park'],
      latestHelpOutcome: 'reliable', latestActivityAt: '2026-08-04T01:00:00.000Z',
    }],
    timeline: [{
      id: 'session:session-1', kind: 'training-session', title: 'Name Response',
      detail: 'Successful session · 5 min', occurredAt: '2026-08-04T01:00:00.000Z',
      localDate: '2026-08-04', tone: 'positive', sessionId: 'session-1',
    }],
    nextStep: {
      kind: 'lesson', title: 'Continue Name Response', reason: 'Continue the skill already in progress.',
      lessonId: 'focus-name-response',
    },
    ...overrides,
  };
}

function props(navigate: jest.Mock) {
  return {
    navigation: { navigate }, route: { key: 'progress', name: 'Progress' },
  } as unknown as ComponentProps<typeof ProgressScreen>;
}
