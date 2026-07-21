import type { TrainingSession } from '../../domain/models';
import { createDomainRepositories } from '../../services/createDomainRepositories';
import { StorageTransactionManager } from '../../storage/StorageTransactionManager';
import { storageKeys } from '../../storage/storageKeys';

export class TrainingSessionNotesService {
  constructor(private readonly transactions: StorageTransactionManager) {}

  async update(sessionId: string, dogId: string, notes: string): Promise<TrainingSession> {
    return this.transactions.run([storageKeys.trainingSessions], async (storage) => {
      const repository = createDomainRepositories(storage).trainingSessions;
      const session = await repository.findById(sessionId);
      if (!session || session.dogId !== dogId) throw new Error('Training session does not belong to this dog.');
      const updated = { ...session, notes: notes.trim().slice(0, 1000) };
      await repository.save(updated);
      return updated;
    });
  }
}
