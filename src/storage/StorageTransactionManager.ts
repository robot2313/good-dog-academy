import type { StorageAdapter } from './StorageAdapter';

type StagedValue = { operation: 'set'; value: unknown } | { operation: 'remove' };

class TransactionalStorageAdapter implements StorageAdapter {
  private readonly staged = new Map<string, StagedValue>();

  constructor(private readonly base: StorageAdapter, private readonly allowedKeys: ReadonlySet<string>) {}

  async getItem<T>(key: string): Promise<T | null> {
    this.assertAllowed(key);
    const staged = this.staged.get(key);
    if (staged?.operation === 'remove') return null;
    if (staged?.operation === 'set') return staged.value as T;
    return this.base.getItem<T>(key);
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    this.assertAllowed(key);
    this.staged.set(key, { operation: 'set', value });
  }

  async removeItem(key: string): Promise<void> {
    this.assertAllowed(key);
    this.staged.set(key, { operation: 'remove' });
  }

  entries(): ReadonlyMap<string, StagedValue> {
    return this.staged;
  }

  private assertAllowed(key: string): void {
    if (!this.allowedKeys.has(key)) throw new TransactionError('Transaction accessed an undeclared storage key.', { key });
  }
}

export class TransactionError extends Error {
  constructor(message: string, readonly context: Record<string, unknown>, options?: ErrorOptions) {
    super(message, options);
    this.name = 'TransactionError';
  }
}

export class StorageTransactionManager {
  private queue: Promise<void> = Promise.resolve();

  constructor(private readonly storage: StorageAdapter) {}

  run<T>(keys: readonly string[], operation: (storage: StorageAdapter) => Promise<T>): Promise<T> {
    const execute = () => this.execute(keys, operation);
    const result = this.queue.then(execute, execute);
    this.queue = result.then(() => undefined, () => undefined);
    return result;
  }

  private async execute<T>(keys: readonly string[], operation: (storage: StorageAdapter) => Promise<T>): Promise<T> {
    const uniqueKeys = [...new Set(keys)];
    const transactionStorage = new TransactionalStorageAdapter(this.storage, new Set(uniqueKeys));
    const snapshots = new Map<string, unknown | null>();

    for (const key of uniqueKeys) snapshots.set(key, await this.storage.getItem<unknown>(key));

    let result: T;
    try {
      result = await operation(transactionStorage);
    } catch (cause) {
      throw new TransactionError('Transaction operation failed before commit.', { keys: uniqueKeys }, { cause });
    }

    const appliedKeys: string[] = [];
    try {
      for (const [key, staged] of transactionStorage.entries()) {
        if (staged.operation === 'remove') await this.storage.removeItem(key);
        else await this.storage.setItem(key, staged.value);
        appliedKeys.push(key);
      }
      return result;
    } catch (cause) {
      try {
        for (const key of appliedKeys.reverse()) {
          const snapshot = snapshots.get(key);
          if (snapshot === null || snapshot === undefined) await this.storage.removeItem(key);
          else await this.storage.setItem(key, snapshot);
        }
      } catch (rollbackCause) {
        throw new TransactionError('Transaction commit and rollback both failed.', { keys: uniqueKeys, appliedKeys }, { cause: rollbackCause });
      }
      throw new TransactionError('Transaction commit failed and stored data was restored.', { keys: uniqueKeys, appliedKeys }, { cause });
    }
  }
}
