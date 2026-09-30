import { buildTrainingIntelligence } from '../behaviour/TrainingIntelligence';
import type { AdaptiveTrainingMemory, SessionHistoryRecord } from '../models/AdaptiveTrainingMemory';
import { deriveDogTwinState, type DogTwinState } from '../training/AdaptiveTrainingProgram';

export type WeeklyTrainerReview = {
  dogId: string;
  generatedAt: string;
  windowStart: string;
  windowEnd: string;
  sessionsThisWeek: number;
  totalRepsThisWeek: number;
  averageCleanRepRate: number | null;
  state: DogTwinState;
  focusSkillId: string | null;
  headline: string;
  summary: string;
  wins: string[];
  watchouts: string[];
  nextWeekRecommendation: string;
  evidenceNote: string;
};

const average = (values: number[]): number | null =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;

const percent = (value: number): string => `${Math.round(value * 100)}%`;

function startOfWindow(generatedAt: string): Date {
  const end = new Date(generatedAt);
  return new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
}

function weeklyRecords(history: SessionHistoryRecord[], generatedAt: string): SessionHistoryRecord[] {
  const end = new Date(generatedAt).getTime();
  const start = startOfWindow(generatedAt).getTime();
  return history
    .filter((record) => {
      const timestamp = new Date(record.completedAt).getTime();
      return Number.isFinite(timestamp) && timestamp >= start && timestamp <= end;
    })
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
}

function headlineFor(state: DogTwinState, sessions: number): string {
  if (sessions === 0) return 'Not enough evidence this week';
  if (state === 'recover') return 'Protect comfort before progression';
  if (state === 'build') return 'Keep building a trustworthy baseline';
  if (state === 'consolidate') return 'Consolidate before adding difficulty';
  return 'Evidence supports careful progression';
}

function recommendationFor(state: DogTwinState, focusSkillId: string | null): string {
  const focus = focusSkillId ? ` in ${focusSkillId.replace(/-/g, ' ')}` : '';
  if (state === 'recover') return `Use easier, low-pressure setups${focus}. Pause progression until comfortable evidence is consistent again.`;
  if (state === 'build') return `Keep sessions short and consistent${focus}. Collect more owner-confirmed evidence before making larger adaptations.`;
  if (state === 'consolidate') return `Hold or reduce difficulty${focus} and aim for two clean sessions before progressing.`;
  return `Progress exactly one challenge variable${focus}, keeping the other difficulty dimensions stable.`;
}

export function buildWeeklyTrainerReview(
  memory: AdaptiveTrainingMemory,
  history: SessionHistoryRecord[],
  generatedAt: string,
): WeeklyTrainerReview {
  const week = weeklyRecords(history, generatedAt);
  const intelligence = buildTrainingIntelligence(memory, history);
  const state = deriveDogTwinState(memory, week);
  const averageCleanRepRate = average(week.map((record) => record.cleanRepRate));
  const totalRepsThisWeek = week.reduce((sum, record) => sum + record.totalReps, 0);
  const stressSessions = week.filter((record) => record.endReason === 'stress' || record.stressSignalRate >= 0.2);
  const repeatedCueSessions = week.filter((record) => record.repeatedCueRate >= 0.35);
  const slowResponseSessions = week.filter((record) => record.slowResponseRate >= 0.35);
  const correctedSessions = week.filter((record) => record.correctedRepRate >= 0.25);
  const cleanSessions = week.filter((record) => record.cleanRepRate >= 0.8 && record.stressSignalRate < 0.2);

  const wins: string[] = [];
  if (cleanSessions.length >= 3) wins.push(`${cleanSessions.length} coached sessions reached at least 80% clean reps without a stronger comfort signal.`);
  if (intelligence.skills.some((skill) => skill.direction === 'improving')) {
    const improving = intelligence.skills.filter((skill) => skill.direction === 'improving').map((skill) => skill.skillId.replace(/-/g, ' '));
    wins.push(`Improving longitudinal evidence: ${improving.join(', ')}.`);
  }
  if (week.length && repeatedCueSessions.length === 0) wins.push('No coached session crossed the cue-repetition watch threshold this week.');
  if (week.length && correctedSessions.length === 0) wins.push('No coached session required frequent owner correction this week.');

  const watchouts: string[] = [];
  if (stressSessions.length) watchouts.push(`${stressSessions.length} session${stressSessions.length === 1 ? '' : 's'} contained stress/discomfort-tagged evidence; comfort overrides progression.`);
  if (repeatedCueSessions.length) watchouts.push(`${repeatedCueSessions.length} session${repeatedCueSessions.length === 1 ? '' : 's'} crossed the cue-repetition threshold.`);
  if (slowResponseSessions.length) watchouts.push(`${slowResponseSessions.length} session${slowResponseSessions.length === 1 ? '' : 's'} showed frequent slow responses.`);
  if (correctedSessions.length) watchouts.push(`${correctedSessions.length} session${correctedSessions.length === 1 ? '' : 's'} needed frequent owner correction, so automation should remain conservative.`);
  for (const warning of intelligence.warnings) if (!watchouts.includes(warning)) watchouts.push(warning);

  const summary = week.length === 0
    ? 'No coached sessions fall inside the last seven days, so the app should not infer progress or regression from this week alone.'
    : `${week.length} coached session${week.length === 1 ? '' : 's'} and ${totalRepsThisWeek} recorded rep${totalRepsThisWeek === 1 ? '' : 's'} fall inside this seven-day window${averageCleanRepRate === null ? '.' : `, averaging ${percent(averageCleanRepRate)} clean reps.`}`;

  return {
    dogId: memory.dogId,
    generatedAt,
    windowStart: startOfWindow(generatedAt).toISOString(),
    windowEnd: new Date(generatedAt).toISOString(),
    sessionsThisWeek: week.length,
    totalRepsThisWeek,
    averageCleanRepRate,
    state,
    focusSkillId: intelligence.watchSkillId,
    headline: headlineFor(state, week.length),
    summary,
    wins,
    watchouts,
    nextWeekRecommendation: recommendationFor(state, intelligence.watchSkillId),
    evidenceNote: 'This review summarizes training evidence and owner-confirmed corrections. It is not a medical or behavioural diagnosis.',
  };
}
