import { TrainingSessionNotesService } from '../../src/features/progress/TrainingSessionNotesService';
import { createDomainRepositories } from '../../src/services/createDomainRepositories';
import { StorageTransactionManager } from '../../src/storage/StorageTransactionManager';
import { InMemoryStorageAdapter } from '../support/InMemoryStorageAdapter';

describe('TrainingSessionNotesService', () => {
  it('trims and persists notes for the owning dog', async () => {
    const storage = new InMemoryStorageAdapter();
    const repositories = createDomainRepositories(storage);
    await repositories.trainingSessions.save({ id: 'session-1', dogId: 'dog-1', lessonId: 'lesson-one', dailyPlanId: null, startedAt: '2026-07-22T00:00:00.000Z', completedAt: '2026-07-22T00:05:00.000Z', durationMinutes: 5, outcome: 'success', notes: '' });
    const updated = await new TrainingSessionNotesService(new StorageTransactionManager(storage)).update('session-1', 'dog-1', '  Responded well near the back door.  ');
    expect(updated.notes).toBe('Responded well near the back door.');
    await expect(repositories.trainingSessions.findById('session-1')).resolves.toEqual(updated);
  });

  it('rejects updates from the wrong dog', async () => {
    const storage = new InMemoryStorageAdapter();
    const repositories = createDomainRepositories(storage);
    await repositories.trainingSessions.save({ id: 'session-1', dogId: 'dog-1', lessonId: 'lesson-one', dailyPlanId: null, startedAt: '2026-07-22T00:00:00.000Z', completedAt: '2026-07-22T00:05:00.000Z', durationMinutes: 5, outcome: 'success', notes: '' });
    await expect(new TrainingSessionNotesService(new StorageTransactionManager(storage)).update('session-1', 'dog-2', 'Not allowed')).rejects.toThrow('Transaction operation failed');
    await expect(repositories.trainingSessions.findById('session-1')).resolves.toMatchObject({ dogId: 'dog-1', notes: '' });
  });
});
