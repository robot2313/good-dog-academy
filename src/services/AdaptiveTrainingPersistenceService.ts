import type { LiveCoachSession } from '../domain/behaviour/LiveCoachEngine';
import {
  emptyAdaptiveTrainingMemory,
  summariseLiveCoachSession,
  updateAdaptiveTrainingMemory,
  type AdaptiveTrainingMemory,
  type SessionHistoryRecord,
  type SkillTrainingMemory,
} from '../domain/models/AdaptiveTrainingMemory';
import type { TrainingSession, TrainingOutcome } from '../domain/models/TrainingSession';
import { effectiveRepOutcome } from '../domain/models/TrainingEvidence';
import { StorageTransactionManager } from '../storage/StorageTransactionManager';
import type { StorageAdapter } from '../storage/StorageAdapter';
import { storageKeys } from '../storage/storageKeys';
import { appStorage } from './appStorage';
import { createDomainRepositories } from './createDomainRepositories';

const MAX_HISTORY = 100;
const adaptiveCommitKeys = [
  storageKeys.trainingSessions,
  storageKeys.adaptiveTrainingMemory,
  storageKeys.adaptiveSessionHistory,
] as const;

function overallOutcome(session: LiveCoachSession): TrainingOutcome | null {
  if (!session.reps.length) return null;
  const outcomes = session.reps.map(effectiveRepOutcome);
  const successes = outcomes.filter((outcome) => outcome === 'success').length;
  const partials = outcomes.filter((outcome) => outcome === 'partial-success').length;
  if (successes / outcomes.length >= 0.75 && !session.endedEarly) return 'success';
  if (successes + partials > 0) return 'partial-success';
  return 'unsuccessful';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteRate(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;
}

function isDifficulty(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return ['distance', 'duration', 'distraction'].every((key) =>
    typeof value[key] === 'number' && Number.isFinite(value[key]) && (value[key] as number) >= 1 && (value[key] as number) <= 5,
  );
}

function isSessionHistoryRecord(value: unknown, dogId: string): value is SessionHistoryRecord {
  if (!isRecord(value) || value.dogId !== dogId) return false;
  if (typeof value.id !== 'string' || typeof value.lessonId !== 'string' || typeof value.skillId !== 'string') return false;
  if (typeof value.completedAt !== 'string' || !Number.isFinite(new Date(value.completedAt).getTime())) return false;
  if (typeof value.totalReps !== 'number' || !Number.isInteger(value.totalReps) || value.totalReps < 0) return false;
  if (!['cleanRepRate', 'repeatedCueRate', 'slowResponseRate', 'stressSignalRate', 'correctedRepRate'].every((key) => isFiniteRate(value[key]))) return false;
  if (typeof value.endedEarly !== 'boolean') return false;
  if (value.endReason !== null && !['target_reached', 'stress', 'fatigue', 'owner_stopped'].includes(String(value.endReason))) return false;
  return isDifficulty(value.startingDifficulty) && isDifficulty(value.endingDifficulty);
}

function isSkillTrainingMemory(value: unknown, skillId: string): value is SkillTrainingMemory {
  if (!isRecord(value) || value.skillId !== skillId) return false;
  if (typeof value.sessionsCompleted !== 'number' || !Number.isInteger(value.sessionsCompleted) || value.sessionsCompleted < 0) return false;
  if (typeof value.totalReps !== 'number' || !Number.isInteger(value.totalReps) || value.totalReps < 0) return false;
  if (!['cleanRepRate', 'repeatedCueRate', 'slowResponseRate', 'stressSignalRate', 'correctedRepRate'].every((key) => isFiniteRate(value[key]))) return false;
  if (typeof value.lastTrainedAt !== 'string' || !Number.isFinite(new Date(value.lastTrainedAt).getTime())) return false;
  if (typeof value.lastEndedEarly !== 'boolean') return false;
  if (value.lastEndReason !== null && !['target_reached', 'stress', 'fatigue', 'owner_stopped'].includes(String(value.lastEndReason))) return false;
  return isDifficulty(value.recommendedDifficulty);
}

function isAdaptiveTrainingMemory(value: unknown, dogId: string): value is AdaptiveTrainingMemory {
  if (!isRecord(value) || value.schemaVersion !== 1 || value.dogId !== dogId) return false;
  if (typeof value.totalSessions !== 'number' || !Number.isInteger(value.totalSessions) || value.totalSessions < 0) return false;
  if (typeof value.updatedAt !== 'string' || !Number.isFinite(new Date(value.updatedAt).getTime())) return false;
  if (!isRecord(value.skills)) return false;
  return Object.entries(value.skills).every(([skillId, skill]) => isSkillTrainingMemory(skill, skillId));
}

async function readRecordMap(storage: StorageAdapter, key: string): Promise<Record<string, unknown>> {
  const value = await storage.getItem<unknown>(key);
  return isRecord(value) ? value : {};
}

async function loadMemoryFrom(storage: StorageAdapter, dogId: string): Promise<AdaptiveTrainingMemory> {
  const all = await readRecordMap(storage, storageKeys.adaptiveTrainingMemory);
  const memory = all[dogId];
  return isAdaptiveTrainingMemory(memory, dogId) ? memory : emptyAdaptiveTrainingMemory(dogId);
}

async function loadHistoryFrom(storage: StorageAdapter, dogId: string): Promise<SessionHistoryRecord[]> {
  const all = await readRecordMap(storage, storageKeys.adaptiveSessionHistory);
  const history = all[dogId];
  if (!Array.isArray(history)) return [];
  return history
    .filter((item): item is SessionHistoryRecord => isSessionHistoryRecord(item, dogId))
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
}

export function createAdaptiveTrainingPersistenceService(storage: StorageAdapter) {
  const transactions = new StorageTransactionManager(storage);

  return {
    loadAdaptiveTrainingMemory(dogId: string): Promise<AdaptiveTrainingMemory> {
      return loadMemoryFrom(storage, dogId);
    },

    loadAdaptiveSessionHistory(dogId: string): Promise<SessionHistoryRecord[]> {
      return loadHistoryFrom(storage, dogId);
    },

    async persistCompletedLiveCoachSession(input: {
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

      return transactions.run(adaptiveCommitKeys, async (transactionStorage) => {
        const repositories = createDomainRepositories(transactionStorage);
        const currentMemory = await loadMemoryFrom(transactionStorage, session.dogId);
        const existingHistory = await loadHistoryFrom(transactionStorage, session.dogId);
        const nextMemory = updateAdaptiveTrainingMemory(currentMemory, record);
        const nextHistory = [record, ...existingHistory.filter((item) => item.id !== record.id)]
          .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
          .slice(0, MAX_HISTORY);

        const allMemory = await readRecordMap(transactionStorage, storageKeys.adaptiveTrainingMemory);
        const allHistory = await readRecordMap(transactionStorage, storageKeys.adaptiveSessionHistory);

        await repositories.trainingSessions.save(trainingSession);
        await transactionStorage.setItem(storageKeys.adaptiveTrainingMemory, { ...allMemory, [session.dogId]: nextMemory });
        await transactionStorage.setItem(storageKeys.adaptiveSessionHistory, { ...allHistory, [session.dogId]: nextHistory });

        return { trainingSession, memory: nextMemory, history: nextHistory };
      });
    },
  };
}

const defaultService = createAdaptiveTrainingPersistenceService(appStorage);

export function loadAdaptiveTrainingMemory(dogId: string): Promise<AdaptiveTrainingMemory> {
  return defaultService.loadAdaptiveTrainingMemory(dogId);
}

export function loadAdaptiveSessionHistory(dogId: string): Promise<SessionHistoryRecord[]> {
  return defaultService.loadAdaptiveSessionHistory(dogId);
}

export function persistCompletedLiveCoachSession(input: {
  session: LiveCoachSession;
  skillId: string;
  dailyPlanId?: string | null;
  startedAt: string;
  completedAt?: string;
  notes?: string;
}): Promise<{ trainingSession: TrainingSession; memory: AdaptiveTrainingMemory; history: SessionHistoryRecord[] }> {
  return defaultService.persistCompletedLiveCoachSession(input);
}
