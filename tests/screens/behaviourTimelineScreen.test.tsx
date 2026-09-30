import type { ComponentProps } from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { sampleBehaviourProfile, sampleDog, sampleOwner } from '../../src/development/seed/sampleData';
import { useOnboarding } from '../../src/features/onboarding/OnboardingContext';
import { loadAdaptiveSessionHistory } from '../../src/services/AdaptiveTrainingPersistenceService';
import { BehaviourTimelineScreen } from '../../src/screens/BehaviourTimelineScreen';

jest.mock('../../src/features/onboarding/OnboardingContext', () => ({ useOnboarding: jest.fn() }));
jest.mock('../../src/services/AdaptiveTrainingPersistenceService', () => ({ loadAdaptiveSessionHistory: jest.fn() }));

const mockUseOnboarding = jest.mocked(useOnboarding);
const mockLoadAdaptiveSessionHistory = jest.mocked(loadAdaptiveSessionHistory);

describe('BehaviourTimelineScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseOnboarding.mockReturnValue({
      status: {
        state: 'complete', hasSavedData: true, owner: sampleOwner,
        dog: { ...sampleDog, name: 'Pepper' }, behaviourProfile: sampleBehaviourProfile,
      },
    } as ReturnType<typeof useOnboarding>);
  });

  it('shows detected patterns and opens the canonical saved session', async () => {
    mockLoadAdaptiveSessionHistory.mockResolvedValue([
      history('session-3', '2026-09-10T10:00:00.000Z', 0.1, 0.4),
      history('session-2', '2026-09-09T10:00:00.000Z', 0.2, 0.5),
      history('session-1', '2026-09-08T10:00:00.000Z', 0.9, 0),
    ]);
    const navigate = jest.fn();
    const view = render(<BehaviourTimelineScreen {...props(navigate)} />);

    await waitFor(() => expect(view.getByRole('header', { name: 'Behaviour Timeline' })).toBeTruthy());
    expect(await view.findByText('Cue repetition is becoming a pattern')).toBeTruthy();
    expect(view.getAllByRole('button', { name: 'View saved session' })).toHaveLength(3);

    fireEvent.press(view.getAllByRole('button', { name: 'View saved session' })[0]);
    expect(navigate).toHaveBeenCalledWith('SessionDetail', { sessionId: 'session-3' });
  });

  it('shows an empty state when coached evidence does not exist yet', async () => {
    mockLoadAdaptiveSessionHistory.mockResolvedValue([]);
    const view = render(<BehaviourTimelineScreen {...props(jest.fn())} />);

    expect(await view.findByText('No coached evidence yet')).toBeTruthy();
    expect(view.getByText(/Complete Camera Coach sessions/)).toBeTruthy();
  });

  it('fails safely when adaptive history cannot be read', async () => {
    mockLoadAdaptiveSessionHistory.mockRejectedValue(new Error('corrupt'));
    const view = render(<BehaviourTimelineScreen {...props(jest.fn())} />);

    expect(await view.findByText(/could not read the saved coached-session record safely/)).toBeTruthy();
  });
});

function history(id: string, completedAt: string, cleanRepRate: number, repeatedCueRate: number) {
  return {
    id,
    dogId: sampleDog.id,
    lessonId: 'focus-name-response',
    skillId: 'focus',
    completedAt,
    totalReps: 5,
    cleanRepRate,
    repeatedCueRate,
    slowResponseRate: 0,
    stressSignalRate: 0,
    correctedRepRate: 0,
    endedEarly: false,
    endReason: 'target_reached' as const,
    startingDifficulty: { distance: 1, duration: 1, distraction: 1 },
    endingDifficulty: { distance: 1, duration: 1, distraction: 1 },
  };
}

function props(navigate: jest.Mock) {
  return {
    navigation: { navigate }, route: { key: 'behaviour-timeline', name: 'BehaviourTimeline' },
  } as unknown as ComponentProps<typeof BehaviourTimelineScreen>;
}
