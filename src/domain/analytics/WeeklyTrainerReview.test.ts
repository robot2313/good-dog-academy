import { emptyAdaptiveTrainingMemory, type AdaptiveTrainingMemory, type SessionHistoryRecord } from '../models/AdaptiveTrainingMemory';
import { buildWeeklyTrainerReview } from './WeeklyTrainerReview';

const NOW = '2026-09-12T12:00:00.000Z';

describe('WeeklyTrainerReview', () => {
  it('does not invent progress when the seven-day window has no sessions', () => {
    const review = buildWeeklyTrainerReview(emptyAdaptiveTrainingMemory('dog-1'), [], NOW);

    expect(review.sessionsThisWeek).toBe(0);
    expect(review.headline).toBe('Not enough evidence this week');
    expect(review.averageCleanRepRate).toBeNull();
    expect(review.summary).toContain('should not infer progress or regression');
  });

  it('puts comfort evidence above otherwise strong performance', () => {
    const memory = adaptiveMemory({ stressSignalRate: 0.25, cleanRepRate: 0.85 });
    const review = buildWeeklyTrainerReview(memory, [
      record('s1', '2026-09-11T12:00:00.000Z', { cleanRepRate: 0.9 }),
      record('s2', '2026-09-10T12:00:00.000Z', { cleanRepRate: 0.9, stressSignalRate: 0.4, endReason: 'stress', endedEarly: true }),
      record('s3', '2026-09-09T12:00:00.000Z', { cleanRepRate: 0.9 }),
    ], NOW);

    expect(review.state).toBe('recover');
    expect(review.headline).toBe('Protect comfort before progression');
    expect(review.watchouts.join(' ')).toContain('stress/discomfort-tagged evidence');
    expect(review.nextWeekRecommendation).toContain('Pause progression');
  });

  it('supports one-variable progression when longitudinal and weekly evidence are clean', () => {
    const memory = adaptiveMemory({ sessionsCompleted: 4, cleanRepRate: 0.9 });
    const history = [
      record('s4', '2026-09-11T12:00:00.000Z', { cleanRepRate: 0.95 }),
      record('s3', '2026-09-10T12:00:00.000Z', { cleanRepRate: 0.9 }),
      record('s2', '2026-09-09T12:00:00.000Z', { cleanRepRate: 0.85 }),
      record('s1', '2026-09-08T12:00:00.000Z', { cleanRepRate: 0.8 }),
    ];
    const review = buildWeeklyTrainerReview(memory, history, NOW);

    expect(review.state).toBe('progress');
    expect(review.sessionsThisWeek).toBe(4);
    expect(review.wins.join(' ')).toContain('coached sessions reached at least 80% clean reps');
    expect(review.nextWeekRecommendation).toContain('exactly one challenge variable');
  });

  it('excludes records older than seven days from weekly metrics', () => {
    const memory = adaptiveMemory({ sessionsCompleted: 3, cleanRepRate: 0.8 });
    const review = buildWeeklyTrainerReview(memory, [
      record('recent', '2026-09-11T12:00:00.000Z', { totalReps: 5, cleanRepRate: 0.8 }),
      record('old', '2026-09-01T12:00:00.000Z', { totalReps: 20, cleanRepRate: 0 }),
    ], NOW);

    expect(review.sessionsThisWeek).toBe(1);
    expect(review.totalRepsThisWeek).toBe(5);
    expect(review.averageCleanRepRate).toBeCloseTo(0.8);
  });
});

function adaptiveMemory(overrides: Partial<AdaptiveTrainingMemory['skills'][string]> = {}): AdaptiveTrainingMemory {
  return {
    schemaVersion: 1,
    dogId: 'dog-1',
    totalSessions: overrides.sessionsCompleted ?? 4,
    updatedAt: '2026-09-11T12:00:00.000Z',
    skills: {
      focus: {
        skillId: 'focus',
        sessionsCompleted: overrides.sessionsCompleted ?? 4,
        totalReps: 20,
        cleanRepRate: overrides.cleanRepRate ?? 0.9,
        repeatedCueRate: overrides.repeatedCueRate ?? 0,
        slowResponseRate: overrides.slowResponseRate ?? 0,
        stressSignalRate: overrides.stressSignalRate ?? 0,
        correctedRepRate: overrides.correctedRepRate ?? 0,
        lastTrainedAt: '2026-09-11T12:00:00.000Z',
        lastEndedEarly: false,
        lastEndReason: 'target_reached',
        recommendedDifficulty: { distance: 2, duration: 2, distraction: 1 },
      },
    },
  };
}

function record(id: string, completedAt: string, overrides: Partial<SessionHistoryRecord> = {}): SessionHistoryRecord {
  return {
    id,
    dogId: 'dog-1',
    lessonId: 'focus-name-response',
    skillId: 'focus',
    completedAt,
    totalReps: overrides.totalReps ?? 5,
    cleanRepRate: overrides.cleanRepRate ?? 0.9,
    repeatedCueRate: overrides.repeatedCueRate ?? 0,
    slowResponseRate: overrides.slowResponseRate ?? 0,
    stressSignalRate: overrides.stressSignalRate ?? 0,
    correctedRepRate: overrides.correctedRepRate ?? 0,
    endedEarly: overrides.endedEarly ?? false,
    endReason: overrides.endReason ?? 'target_reached',
    startingDifficulty: { distance: 1, duration: 1, distraction: 1 },
    endingDifficulty: { distance: 2, duration: 2, distraction: 1 },
  };
}
