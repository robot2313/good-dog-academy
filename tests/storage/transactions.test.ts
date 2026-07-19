import { StorageTransactionManager, TransactionError } from '../../src/storage/StorageTransactionManager';
import type { StorageAdapter } from '../../src/storage/StorageAdapter';
import { InMemoryStorageAdapter } from '../support/InMemoryStorageAdapter';

class FailingStorageAdapter implements StorageAdapter {
  constructor(private readonly base: StorageAdapter, private readonly failKey: string) {}
  getItem<T>(key: string): Promise<T | null> { return this.base.getItem<T>(key); }
  removeItem(key: string): Promise<void> { return this.base.removeItem(key); }
  async setItem<T>(key: string, value: T): Promise<void> {
    if (key === this.failKey) throw new Error('Injected storage failure');
    await this.base.setItem(key, value);
  }
}

describe('StorageTransactionManager', () => {
  it('commits all staged writes together', async () => {
    const storage = new InMemoryStorageAdapter();
    await new StorageTransactionManager(storage).run(['owner', 'dog'], async (transaction) => {
      await transaction.setItem('owner', { id: 'owner' });
      await transaction.setItem('dog', { id: 'dog' });
    });
    expect(storage.snapshot()).toEqual({ owner: { id: 'owner' }, dog: { id: 'dog' } });
  });

  it('writes nothing when the operation fails', async () => {
    const storage = new InMemoryStorageAdapter();
    await expect(new StorageTransactionManager(storage).run(['owner', 'dog'], async (transaction) => {
      await transaction.setItem('owner', { id: 'owner' });
      throw new Error('stop');
    })).rejects.toBeInstanceOf(TransactionError);
    expect(storage.snapshot()).toEqual({});
  });

  it('restores applied keys when commit fails', async () => {
    const base = new InMemoryStorageAdapter();
    await base.setItem('owner', { id: 'original' });
    const storage = new FailingStorageAdapter(base, 'dog');
    await expect(new StorageTransactionManager(storage).run(['owner', 'dog'], async (transaction) => {
      await transaction.setItem('owner', { id: 'changed' });
      await transaction.setItem('dog', { id: 'dog' });
    })).rejects.toBeInstanceOf(TransactionError);
    expect(base.snapshot()).toEqual({ owner: { id: 'original' } });
  });

  it('rejects undeclared keys', async () => {
    const storage = new InMemoryStorageAdapter();
    await expect(new StorageTransactionManager(storage).run(['owner'], (transaction) => transaction.setItem('dog', {}))).rejects.toBeInstanceOf(TransactionError);
  });
});
