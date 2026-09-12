import type { LiveCoachSession } from '../domain/behaviour/LiveCoachEngine';
import {
  emptyAdaptiveTrainingMemory,
  summariseLiveCoachSession,
  updateAdaptiveTrainingMemory,
  type AdaptiveTrainingMemory,
  type SessionHistoryRecord,
} from '../domain/models/AdaptiveTrainingMemory';
import type { TrainingSession, TrainingOutcome } from '../domain/models/TrainingSession';
import { effectiveRepOutcome } from '../domain/models/TrainingEvidence';
import { storageKeys } from '../storage/storageKeys';
import { appStorage } from './appStorage';
import { domainRepositories } from './domainRepositories';

const MAX_HISTORY = 100;

function overallOutcome(session: LiveCoachSession): TrainingOutcome | null {
  if (!session.reps.length) return null;
  const outcomes = session.reps.map(effectiveRepOutcome);
  const successes = outcomes.filter((outcome) => outcome === 'success').length;
  const partials = outcomes.filter((outcome) => outcome === 'partial-success').length;
  if (successes / outcomes.length >= 0.75 && !session.endedEarly) return 'success';
  if (successes + partials > 0) return 'partial-success';
  return 'unsuccessful';
}

export async function loadAdaptiveTrainingMemory(dogId: string): Promise<AdaptiveTrainingMemory> {
  const all = await appStorage.getItem<Record<string, AdaptiveTrainingMemory>>(storageKeys.adaptiveTrainingMemory);
  const memory = all?.[dogId];
  if (!memory || memory.schemaVersion !== 1 || memory.dogId !== dogId) return emptyAdaptiveTrainingMemory(dogId);
  return memory;
}

export async function loadAdaptiveSessionHistory(dogId: string): Promise<SessionHistoryRecord[]> {
  const all = await appStorage.getItem<Record<string, SessionHistoryRecord[]>>(storageKeys.adaptiveSessionHistory);
  const history = all?.[dogId];
  return Array.isArray(history) ? [...history].sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()) : [];
}

export async function persistCompletedLiveCoachSession(input: {
  session: LiveCoachSession;
  skillId: string;
  dailyPlanId?: string | null;
  startedAt: string;
  completedAt?: string;
  notes?: string;
}): Promise<{ trainingSession: TrainingSession; memory: AdaptiveTrainingMemory; history: SessionHistoryRecord[] }> {
  const { session, skillId } = input;
  if (session.status !== 'complete') throw new Error('Only completed Live Coach sessions can be persisted.');

  const completedAt = input.completedAt ?? new Date().toISOString();
  const durationMinutes = Math.max(0, Math.round((new Date(completedAt).getTime() - new Date(input.startedAt).getTime()) / 60000));
  const trainingSession: TrainingSession = {
    id: session.id,
    dogId: session.dogId,
    lessonId: session.lessonId,
    dailyPlanId: input.dailyPlanId ?? null,
    startedAt: input.startedAt,
    completedAt,
    durationMinutes,
    outcome: overallOutcome(session),
    notes: input.notes ?? '',
    reps: session.reps,
  };

  const record = summariseLiveCoachSession(session, skillId, completedAt);
  const currentMemory = await loadAdaptiveTrainingMemory(session.dogId);
  const nextMemory = updateAdaptiveTrainingMemory(currentMemory, record);
  const existingHistory = await loadAdaptiveSessionHistory(session.dogId);
  const nextHistory = [record, ...existingHistory.filter((item) => item.id !== record.id)]
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    .slice(0, MAX_HISTORY);

  const allMemory = (await appStorage.getItem<Record<string, AdaptiveTrainingMemory>>(storageKeys.adaptiveTrainingMemory)) ?? {};
  const allHistory = (await appStorage.getItem<Record<string, SessionHistoryRecord[]>>(storageKeys.adaptiveSessionHistory)) ?? {};

  await domainRepositories.trainingSessions.save(trainingSession);
  await appStorage.setItem(storageKeys.adaptiveTrainingMemory, { ...allMemory, [session.dogId]: nextMemory });
  await appStorage.setItem(storageKeys.adaptiveSessionHistory, { ...allHistory, [session.dogId]: nextHistory });

  return { trainingSession, memory: nextMemory, history: nextHistory };
}
