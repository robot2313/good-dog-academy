import type { Progress, TrainingSession } from '../../src/domain/models';
import { buildProgress, calculateStreaks, earnAchievements } from '../../src/features/progress/ProgressIntelligence';

function session(id: string, date: string, minutes = 5): TrainingSession {
  return { id, dogId: 'dog-1', lessonId: `lesson-${id}`, dailyPlanId: null, startedAt: `${date}T01:00:00.000Z`, completedAt: `${date}T01:05:00.000Z`, durationMinutes: minutes, outcome: 'success', notes: '' };
}

describe('progress intelligence', () => {
  it('calculates current and best calendar streaks', () => {
    const sessions = [session('1', '2026-07-18'), session('2', '2026-07-19'), session('3', '2026-07-21'), session('4', '2026-07-22')];
    expect(calculateStreaks(sessions, '2026-07-22T12:00:00.000Z')).toEqual({ current: 2, best: 2 });
    expect(calculateStreaks(sessions, '2026-07-25T12:00:00.000Z')).toEqual({ current: 0, best: 2 });
  });

  it('builds totals from durable session history without double counting', () => {
    const progress = buildProgress(null, 'dog-1', [session('1', '2026-07-21', 5), session('2', '2026-07-22', 10)], ['lesson-1'], '2026-07-22T12:00:00.000Z', () => 'progress-1');
    expect(progress).toMatchObject({ sessionsCompleted: 2, currentStreakDays: 2, bestStreakDays: 2, totalTrainingMinutes: 15, completedLessonIds: ['lesson-1'] });
  });

  it('earns each achievement only once', () => {
    const progress: Progress = { id: 'progress-1', dogId: 'dog-1', completedLessonIds: [], sessionsCompleted: 1, currentStreakDays: 1, bestStreakDays: 1, totalTrainingMinutes: 5, updatedAt: '2026-07-22T00:00:00.000Z' };
    const earned = earnAchievements([], progress, progress.updatedAt, () => 'achievement-1');
    expect(earned.map((item) => item.code)).toEqual(['first-session']);
    expect(earnAchievements(earned, progress, progress.updatedAt, () => 'duplicate')).toEqual([]);
  });
});
