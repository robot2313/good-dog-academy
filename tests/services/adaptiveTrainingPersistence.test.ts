import { createLiveCoachSession, type LiveCoachSession } from '../../src/domain/behaviour/LiveCoachEngine';
import { createAdaptiveTrainingPersistenceService } from '../../src/services/AdaptiveTrainingPersistenceService';
import type { StorageAdapter } from '../../src/storage/StorageAdapter';
import { storageKeys } from '../../src/storage/storageKeys';
import { TransactionError } from '../../src/storage/StorageTransactionManager';
import { InMemoryStorageAdapter } from '../support/InMemoryStorageAdapter';

function completedSession(id = 'session-1'): LiveCoachSession {
  return {
    ...createLiveCoachSession({ id, dogId: 'dog-1', lessonId: 'focus', targetReps: 1 }),
    status: 'complete',
    endReason: 'target_reached',
  };
}

class FailingStorageAdapter implements StorageAdapter {
  constructor(
    private readonly base: StorageAdapter,
    private readonly failKey: string,
  ) {}

  getItem<T>(key: string): Promise<T | null> {
    return this.base.getItem<T>(key);
  }

  removeItem(key: string): Promise<void> {
    return this.base.removeItem(key);
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    if (key === this.failKey) throw new Error('Injected adaptive persistence failure');
    await this.base.setItem(key, value);
  }
}

describe('AdaptiveTrainingPersistenceService', () => {
  it('commits the standard session, adaptive memory, and adaptive history together', async () => {
    const storage = new InMemoryStorageAdapter();
    const service = createAdaptiveTrainingPersistenceService(storage);

    const result = await service.persistCompletedLiveCoachSession({
      session: completedSession(),
      skillId: 'focus',
      startedAt: '2026-09-12T10:00:00.000Z',
      completedAt: '2026-09-12T10:05:00.000Z',
    });

    expect(result.trainingSession).toMatchObject({
      id: 'session-1',
      dogId: 'dog-1',
      lessonId: 'focus',
      durationMinutes: 5,
    });
    expect(result.memory.totalSessions).toBe(1);
    expect(result.memory.skills.focus.sessionsCompleted).toBe(1);
    expect(result.history).toHaveLength(1);

    const snapshot = storage.snapshot();
    expect(snapshot[storageKeys.trainingSessions]).toHaveLength(1);
    expect(snapshot[storageKeys.adaptiveTrainingMemory]).toMatchObject({
      'dog-1': { dogId: 'dog-1', totalSessions: 1 },
    });
    expect(snapshot[storageKeys.adaptiveSessionHistory]).toMatchObject({
      'dog-1': [{ id: 'session-1', dogId: 'dog-1', skillId: 'focus' }],
    });
  });

  it('restores every adaptive key when the final history write fails', async () => {
    const base = new InMemoryStorageAdapter();
    await base.setItem(storageKeys.trainingSessions, [{ id: 'existing-session' }]);
    await base.setItem(storageKeys.adaptiveTrainingMemory, { existing: { marker: true } });
    await base.setItem(storageKeys.adaptiveSessionHistory, { existing: [{ id: 'history' }] });
    const before = base.snapshot();

    const storage = new FailingStorageAdapter(base, storageKeys.adaptiveSessionHistory);
    const service = createAdaptiveTrainingPersistenceService(storage);

    await expect(service.persistCompletedLiveCoachSession({
      session: completedSession('session-fail'),
      skillId: 'focus',
      startedAt: '2026-09-12T10:00:00.000Z',
      completedAt: '2026-09-12T10:05:00.000Z',
    })).rejects.toBeInstanceOf(TransactionError);

    expect(base.snapshot()).toEqual(before);
  });

  it('rejects active sessions before touching storage', async () => {
    const storage = new InMemoryStorageAdapter();
    const service = createAdaptiveTrainingPersistenceService(storage);
    const active = createLiveCoachSession({ id: 'active-1', dogId: 'dog-1', lessonId: 'focus' });

    await expect(service.persistCompletedLiveCoachSession({
      session: active,
      skillId: 'focus',
      startedAt: '2026-09-12T10:00:00.000Z',
    })).rejects.toThrow('Only completed Live Coach sessions can be persisted.');

    expect(storage.snapshot()).toEqual({});
  });

  it('falls back to empty memory when a stored skill record is malformed', async () => {
    const storage = new InMemoryStorageAdapter();
    await storage.setItem(storageKeys.adaptiveTrainingMemory, {
      'dog-1': {
        schemaVersion: 1,
        dogId: 'dog-1',
        totalSessions: 99,
        updatedAt: '2026-09-12T10:00:00.000Z',
        skills: {
          focus: {
            skillId: 'focus',
            sessionsCompleted: -4,
          },
        },
      },
    });

    const memory = await createAdaptiveTrainingPersistenceService(storage).loadAdaptiveTrainingMemory('dog-1');

    expect(memory).toMatchObject({ dogId: 'dog-1', totalSessions: 0, skills: {} });
  });
});
