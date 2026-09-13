import type { DifficultyVector, LiveCoachEndReason, LiveCoachSession } from '../behaviour/LiveCoachEngine';
import { effectiveRepOutcome } from './TrainingEvidence';

export type SkillTrainingMemory = {
  skillId: string;
  sessionsCompleted: number;
  totalReps: number;
  cleanRepRate: number;
  repeatedCueRate: number;
  slowResponseRate: number;
  stressSignalRate: number;
  correctedRepRate: number;
  lastTrainedAt: string;
  lastEndedEarly: boolean;
  lastEndReason: LiveCoachEndReason;
  recommendedDifficulty: DifficultyVector;
};

export type AdaptiveTrainingMemory = {
  schemaVersion: 1;
  dogId: string;
  totalSessions: number;
  skills: Record<string, SkillTrainingMemory>;
  updatedAt: string;
};

export type SessionHistoryRecord = {
  id: string;
  dogId: string;
  lessonId: string;
  skillId: string;
  completedAt: string;
  totalReps: number;
  cleanRepRate: number;
  repeatedCueRate: number;
  slowResponseRate: number;
  stressSignalRate: number;
  correctedRepRate: number;
  endedEarly: boolean;
  endReason: LiveCoachEndReason;
  startingDifficulty: DifficultyVector;
  endingDifficulty: DifficultyVector;
};

export function emptyAdaptiveTrainingMemory(dogId: string): AdaptiveTrainingMemory {
  return { schemaVersion: 1, dogId, totalSessions: 0, skills: {}, updatedAt: new Date(0).toISOString() };
}

const isStress = (signal: string | null | undefined, notes: string | null | undefined) => {
  const text = `${signal ?? ''} ${notes ?? ''}`.toLowerCase();
  return text.includes('stress') || text.includes('discomfort');
};

export function summariseLiveCoachSession(session: LiveCoachSession, skillId: string, completedAt: string): SessionHistoryRecord {
  const total = Math.max(1, session.reps.length);
  const clean = session.reps.filter((rep) => effectiveRepOutcome(rep) === 'success' && !isStress(rep.evidence.signal, rep.evidence.notes)).length;
  const repeated = session.reps.filter((rep) => (rep.evidence.cueCount ?? 1) >= 2).length;
  const slow = session.reps.filter((rep) => {
    if (!rep.evidence.cueAt || !rep.evidence.responseAt) return false;
    const delta = new Date(rep.evidence.responseAt).getTime() - new Date(rep.evidence.cueAt).getTime();
    return Number.isFinite(delta) && delta >= 4000;
  }).length;
  const stress = session.reps.filter((rep) => isStress(rep.evidence.signal, rep.evidence.notes)).length;
  const corrected = session.reps.filter((rep) => rep.correction !== null).length;

  return {
    id: session.id,
    dogId: session.dogId,
    lessonId: session.lessonId,
    skillId,
    completedAt,
    totalReps: session.reps.length,
    cleanRepRate: clean / total,
    repeatedCueRate: repeated / total,
    slowResponseRate: slow / total,
    stressSignalRate: stress / total,
    correctedRepRate: corrected / total,
    endedEarly: session.endedEarly,
    endReason: session.endReason,
    startingDifficulty: session.startingDifficulty,
    endingDifficulty: session.difficulty,
  };
}

export function updateAdaptiveTrainingMemory(memory: AdaptiveTrainingMemory, record: SessionHistoryRecord): AdaptiveTrainingMemory {
  const previous = memory.skills[record.skillId];
  const sessions = (previous?.sessionsCompleted ?? 0) + 1;
  const blend = (oldValue: number | undefined, next: number) => oldValue === undefined ? next : (oldValue * (sessions - 1) + next) / sessions;

  const skill: SkillTrainingMemory = {
    skillId: record.skillId,
    sessionsCompleted: sessions,
    totalReps: (previous?.totalReps ?? 0) + record.totalReps,
    cleanRepRate: blend(previous?.cleanRepRate, record.cleanRepRate),
    repeatedCueRate: blend(previous?.repeatedCueRate, record.repeatedCueRate),
    slowResponseRate: blend(previous?.slowResponseRate, record.slowResponseRate),
    stressSignalRate: blend(previous?.stressSignalRate, record.stressSignalRate),
    correctedRepRate: blend(previous?.correctedRepRate, record.correctedRepRate),
    lastTrainedAt: record.completedAt,
    lastEndedEarly: record.endedEarly,
    lastEndReason: record.endReason,
    recommendedDifficulty: record.endingDifficulty,
  };

  return {
    ...memory,
    dogId: record.dogId,
    totalSessions: memory.totalSessions + 1,
    skills: { ...memory.skills, [record.skillId]: skill },
    updatedAt: record.completedAt,
  };
}
