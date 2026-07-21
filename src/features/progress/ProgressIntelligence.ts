import type { Achievement, Progress, TrainingSession } from '../../domain/models';

function dateOnly(timestamp: string): string { return timestamp.slice(0, 10); }
function dayNumber(date: string): number { return Math.floor(Date.parse(`${date}T00:00:00.000Z`) / 86_400_000); }

export function calculateStreaks(sessions: readonly TrainingSession[], now: string): { current: number; best: number } {
  const days = [...new Set(sessions.filter((session) => session.completedAt).map((session) => dateOnly(session.completedAt!)))]
    .sort((a, b) => dayNumber(a) - dayNumber(b));
  if (days.length === 0) return { current: 0, best: 0 };
  let best = 1;
  let run = 1;
  for (let index = 1; index < days.length; index += 1) {
    run = dayNumber(days[index]) - dayNumber(days[index - 1]) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
  }
  const gap = dayNumber(dateOnly(now)) - dayNumber(days[days.length - 1]);
  if (gap > 1) return { current: 0, best };
  let current = 1;
  for (let index = days.length - 1; index > 0 && dayNumber(days[index]) - dayNumber(days[index - 1]) === 1; index -= 1) current += 1;
  return { current, best };
}

export function buildProgress(
  existing: Progress | null,
  dogId: string,
  sessions: readonly TrainingSession[],
  completedLessonIds: readonly string[],
  timestamp: string,
  createId: (prefix: string) => string,
): Progress {
  const streaks = calculateStreaks(sessions, timestamp);
  return {
    id: existing?.id ?? createId('progress'),
    dogId,
    completedLessonIds: [...completedLessonIds].sort(),
    sessionsCompleted: sessions.filter((session) => session.completedAt !== null).length,
    currentStreakDays: streaks.current,
    bestStreakDays: Math.max(existing?.bestStreakDays ?? 0, streaks.best),
    totalTrainingMinutes: sessions.reduce((total, session) => total + session.durationMinutes, 0),
    updatedAt: timestamp,
  };
}

const achievementDefinitions = [
  { code: 'first-session', title: 'First Steps', description: 'Completed the first training session.', earned: (progress: Progress) => progress.sessionsCompleted >= 1 },
  { code: 'three-day-streak', title: 'Building a Rhythm', description: 'Trained for three consecutive days.', earned: (progress: Progress) => progress.bestStreakDays >= 3 },
  { code: 'ten-sessions', title: 'Training Team', description: 'Completed ten training sessions together.', earned: (progress: Progress) => progress.sessionsCompleted >= 10 },
  { code: 'ten-lessons', title: 'Academy Explorer', description: 'Completed ten different lesson paths.', earned: (progress: Progress) => progress.completedLessonIds.length >= 10 },
] as const;

export function earnAchievements(existing: readonly Achievement[], progress: Progress, timestamp: string, createId: (prefix: string) => string): Achievement[] {
  const existingCodes = new Set(existing.map((achievement) => achievement.code));
  return achievementDefinitions
    .filter((definition) => !existingCodes.has(definition.code) && definition.earned(progress))
    .map((definition) => ({ id: createId('achievement'), dogId: progress.dogId, code: definition.code, title: definition.title, description: definition.description, earnedAt: timestamp }));
}
