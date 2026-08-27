import { storageKeys } from '../../storage/storageKeys';
import type { StorageAdapter } from '../../storage/StorageAdapter';
import { StorageTransactionManager } from '../../storage/StorageTransactionManager';

export interface ManagedDogPhotoCleaner {
  removeAllManagedPhotos(): Promise<void>;
}

export type LocalDataDeletionResult = {
  readonly managedPhotosRemoved: boolean;
};

const allStorageKeys = Object.freeze(Object.values(storageKeys));

export class LocalDataDeletionService {
  private readonly transactions: StorageTransactionManager;

  constructor(
    private readonly storage: StorageAdapter,
    private readonly photoCleaner: ManagedDogPhotoCleaner,
    transactions?: StorageTransactionManager,
  ) {
    this.transactions = transactions ?? new StorageTransactionManager(storage);
  }

  async deleteAllLocalData(): Promise<LocalDataDeletionResult> {
    await this.transactions.run(allStorageKeys, async (transactionStorage) => {
      for (const key of allStorageKeys) await transactionStorage.removeItem(key);
    });

    try {
      await this.photoCleaner.removeAllManagedPhotos();
      return { managedPhotosRemoved: true };
    } catch {
      return { managedPhotosRemoved: false };
    }
  }
}
