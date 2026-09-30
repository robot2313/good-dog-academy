import type { AdaptiveTrainingMemory, SessionHistoryRecord, SkillTrainingMemory } from '../models/AdaptiveTrainingMemory';

export type TrendDirection = 'improving' | 'steady' | 'declining' | 'insufficient-data';

export type SkillTrend = {
  skillId: string;
  direction: TrendDirection;
  recentCleanRate: number | null;
  previousCleanRate: number | null;
  delta: number | null;
  cueRepeatRate: number;
  slowResponseRate: number;
  stressSignalRate: number;
  correctedRepRate: number;
  recommendation: string;
};

export type TrainingIntelligence = {
  dogId: string;
  totalSessions: number;
  strongestSkillId: string | null;
  watchSkillId: string | null;
  skills: SkillTrend[];
  warnings: string[];
};

const avg = (values: number[]): number => values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;

function skillDirection(history: SessionHistoryRecord[], skillId: string): Pick<SkillTrend, 'direction' | 'recentCleanRate' | 'previousCleanRate' | 'delta'> {
  const rows = history
    .filter((item) => item.skillId === skillId)
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

  if (rows.length < 3) return { direction: 'insufficient-data', recentCleanRate: rows.length ? avg(rows.slice(0, 2).map((r) => r.cleanRepRate)) : null, previousCleanRate: null, delta: null };

  const recent = avg(rows.slice(0, 2).map((r) => r.cleanRepRate));
  const previousRows = rows.slice(2, 4);
  const previous = avg(previousRows.map((r) => r.cleanRepRate));
  const delta = recent - previous;
  const direction: TrendDirection = delta >= 0.12 ? 'improving' : delta <= -0.12 ? 'declining' : 'steady';
  return { direction, recentCleanRate: recent, previousCleanRate: previous, delta };
}

function recommendation(memory: SkillTrainingMemory, direction: TrendDirection): string {
  if (memory.stressSignalRate >= 0.2) return 'Reduce pressure and rebuild this skill in an easier setup before progressing.';
  if (memory.repeatedCueRate >= 0.35) return 'Coach one clear cue, wait, then help instead of repeating the cue.';
  if (memory.slowResponseRate >= 0.35) return 'Shorten the task and increase fluency before adding more difficulty.';
  if (direction === 'declining') return 'Return to the last reliable setup and confirm two clean sessions before progressing.';
  if (direction === 'improving' && memory.cleanRepRate >= 0.75) return 'Progress one challenge variable at a time and keep the rest stable.';
  return 'Keep the setup stable and collect another clean session before changing difficulty.';
}

export function buildTrainingIntelligence(memory: AdaptiveTrainingMemory, history: SessionHistoryRecord[]): TrainingIntelligence {
  const skills = Object.values(memory.skills).map((skill) => {
    const trend = skillDirection(history, skill.skillId);
    return {
      skillId: skill.skillId,
      ...trend,
      cueRepeatRate: skill.repeatedCueRate,
      slowResponseRate: skill.slowResponseRate,
      stressSignalRate: skill.stressSignalRate,
      correctedRepRate: skill.correctedRepRate,
      recommendation: recommendation(skill, trend.direction),
    } satisfies SkillTrend;
  }).sort((a, b) => (b.recentCleanRate ?? 0) - (a.recentCleanRate ?? 0));

  const strongestSkillId = skills.length ? skills[0].skillId : null;
  const watch = [...skills].sort((a, b) => {
    const aRisk = (a.direction === 'declining' ? 2 : 0) + a.stressSignalRate + a.cueRepeatRate * 0.5;
    const bRisk = (b.direction === 'declining' ? 2 : 0) + b.stressSignalRate + b.cueRepeatRate * 0.5;
    return bRisk - aRisk;
  })[0] ?? null;

  const warnings: string[] = [];
  if (skills.some((skill) => skill.direction === 'declining')) warnings.push('At least one trained skill is trending below earlier session evidence.');
  if (skills.some((skill) => skill.stressSignalRate >= 0.2)) warnings.push('Repeated stress/discomfort-tagged evidence appears in the training record; reduce pressure before progressing.');
  if (skills.some((skill) => skill.correctedRepRate >= 0.25)) warnings.push('A high share of automatic reps required owner correction; automation confidence should stay conservative for those sessions.');

  return {
    dogId: memory.dogId,
    totalSessions: memory.totalSessions,
    strongestSkillId,
    watchSkillId: watch?.skillId ?? null,
    skills,
    warnings,
  };
}
