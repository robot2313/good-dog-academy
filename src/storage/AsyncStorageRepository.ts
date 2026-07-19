import type { Repository } from '../domain/repositories';
import type { ValidationResult } from '../domain/validation';
import type { StorageAdapter } from './StorageAdapter';

type Validator<T> = (value: unknown) => ValidationResult<T>;

export class RepositoryValidationError extends Error {
  constructor(entityName: string, errors: string[]) {
    super(`Invalid ${entityName}: ${errors.join('; ')}`);
    this.name = 'RepositoryValidationError';
  }
}

export class AsyncStorageRepository<T extends { id: string }> implements Repository<T> {
  constructor(
    private readonly storage: StorageAdapter,
    private readonly key: string,
    private readonly entityName: string,
    private readonly validate: Validator<T>,
  ) {}

  async findById(id: string): Promise<T | null> {
    const entities = await this.readCollection();
    return entities.find((entity) => entity.id === id) ?? null;
  }

  async findAll(): Promise<T[]> {
    return this.readCollection();
  }

  async save(entity: T): Promise<void> {
    this.assertValid(entity);
    const entities = await this.readCollection();
    const existingIndex = entities.findIndex((candidate) => candidate.id === entity.id);

    if (existingIndex === -1) {
      entities.push(entity);
    } else {
      entities[existingIndex] = entity;
    }

    await this.storage.setItem(this.key, entities);
  }

  async remove(id: string): Promise<void> {
    const entities = await this.readCollection();
    await this.storage.setItem(this.key, entities.filter((entity) => entity.id !== id));
  }

  async clear(): Promise<void> {
    await this.storage.removeItem(this.key);
  }

  private async readCollection(): Promise<T[]> {
    const stored = await this.storage.getItem<unknown>(this.key);
    if (stored === null) return [];
    if (!Array.isArray(stored)) throw new RepositoryValidationError(this.entityName, ['stored collection must be an array']);

    return stored.map((entity) => this.assertValid(entity));
  }

  private assertValid(value: unknown): T {
    const result = this.validate(value);
    if (!result.valid) throw new RepositoryValidationError(this.entityName, result.errors);
    return result.value;
  }
}
