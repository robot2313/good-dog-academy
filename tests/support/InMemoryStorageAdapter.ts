import type { StorageAdapter } from '../../src/storage/StorageAdapter';

export class InMemoryStorageAdapter implements StorageAdapter {
  private readonly data = new Map<string, unknown>();

  async getItem<T>(key: string): Promise<T | null> {
    return this.data.has(key) ? structuredClone(this.data.get(key)) as T : null;
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    this.data.set(key, structuredClone(value));
  }

  async removeItem(key: string): Promise<void> {
    this.data.delete(key);
  }

  snapshot(): Record<string, unknown> {
    return Object.fromEntries(this.data.entries());
  }
}
