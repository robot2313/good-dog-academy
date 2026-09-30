import type { AdaptiveTrainingMemory, SessionHistoryRecord } from '../../../domain/models/AdaptiveTrainingMemory';
import type { LessonLibraryItem } from '../library/lessonLibraryTypes';
import { buildAdaptiveJourneyRecommendation } from './AdaptiveJourneyRecommendation';

const lesson = (overrides: Partial<LessonLibraryItem> & Pick<LessonLibraryItem, 'id' | 'title' | 'difficulty' | 'skill' | 'state'>): LessonLibraryItem => ({
  description: '',
  estimatedMinutes: 8,
  keywords: [],
  lock: overrides.state === 'LOCKED' ? { reason: 'locked', missingPrerequisiteIds: [], missingPrerequisiteNames: [] } : null,
  ...overrides,
} as LessonLibraryItem);

const memory = (): AdaptiveTrainingMemory => ({
  schemaVersion: 1,
  dogId: 'dog-1',
  totalSessions: 4,
  updatedAt: '2026-09-12T10:00:00.000Z',
  skills: {
    focus: {
      skillId: 'focus',
      sessionsCompleted: 4,
      totalReps: 20,
      cleanRepRate: 0.5,
      repeatedCueRate: 0.45,
      slowResponseRate: 0.1,
      stressSignalRate: 0,
      correctedRepRate: 0,
      lastTrainedAt: '2026-09-12T10:00:00.000Z',
      lastEndedEarly: false,
      lastEndReason: 'target_reached',
      recommendedDifficulty: { distance: 2, duration: 2, distraction: 2 },
    },
  },
});

const history = (): SessionHistoryRecord[] => [
  {
    id: 's1', dogId: 'dog-1', lessonId: 'focus-2', skillId: 'focus', completedAt: '2026-09-12T10:00:00.000Z', totalReps: 5,
    cleanRepRate: 0.5, repeatedCueRate: 0.4, slowResponseRate: 0.1, stressSignalRate: 0, correctedRepRate: 0,
    endedEarly: false, endReason: 'target_reached', startingDifficulty: { distance: 2, duration: 2, distraction: 2 }, endingDifficulty: { distance: 2, duration: 2, distraction: 2 },
  },
  {
    id: 's2', dogId: 'dog-1', lessonId: 'focus-2', skillId: 'focus', completedAt: '2026-09-11T10:00:00.000Z', totalReps: 5,
    cleanRepRate: 0.5, repeatedCueRate: 0.4, slowResponseRate: 0.1, stressSignalRate: 0, correctedRepRate: 0,
    endedEarly: false, endReason: 'target_reached', startingDifficulty: { distance: 2, duration: 2, distraction: 2 }, endingDifficulty: { distance: 2, duration: 2, distraction: 2 },
  },
];

describe('buildAdaptiveJourneyRecommendation', () => {
  it('switches to an unlocked easier lesson for the same skill', () => {
    const lessons = [
      lesson({ id: 'focus-1' as never, title: 'Easy Focus', difficulty: 1 as never, skill: 'focus' as never, state: 'AVAILABLE' }),
      lesson({ id: 'focus-2' as never, title: 'Harder Focus', difficulty: 2 as never, skill: 'focus' as never, state: 'IN_PROGRESS' }),
    ];

    const recommendation = buildAdaptiveJourneyRecommendation({ lessons, memory: memory(), history: history() });

    expect(recommendation).toMatchObject({
      action: 'switch',
      lessonId: 'focus-1',
      currentLessonId: 'focus-2',
      recommendedLessonTitle: 'Easy Focus',
    });
  });

  it('never selects a locked fallback lesson', () => {
    const lessons = [
      lesson({ id: 'focus-1' as never, title: 'Locked Focus', difficulty: 1 as never, skill: 'focus' as never, state: 'LOCKED' }),
      lesson({ id: 'focus-2' as never, title: 'Current Focus', difficulty: 2 as never, skill: 'focus' as never, state: 'IN_PROGRESS' }),
    ];

    const recommendation = buildAdaptiveJourneyRecommendation({ lessons, memory: memory(), history: history() });

    expect(recommendation?.action).toBe('stay');
    expect(recommendation?.lessonId).toBe('focus-2');
  });
});
