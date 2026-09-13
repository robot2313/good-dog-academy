import type { StorageAdapter } from '../../storage/StorageAdapter';
import { storageKeys } from '../../storage/storageKeys';
import {
  loadPoseShadowValidationReport,
  loadPoseShadowValidationSamples,
  recordPoseShadowValidationSample,
} from './PoseShadowValidationService';

class MemoryStorage implements StorageAdapter {
  private values = new Map<string, unknown>();
  async getItem<T>(key: string): Promise<T | null> {
    return (this.values.has(key) ? this.values.get(key) : null) as T | null;
  }
  async setItem<T>(key: string, value: T): Promise<void> {
    this.values.set(key, value);
  }
  async removeItem(key: string): Promise<void> {
    this.values.delete(key);
  }
}

const makeSample = (id: string, dogId = 'dog-1') => ({
  id,
  dogId,
  lessonId: 'sit-1',
  expectedPosture: 'sit_like' as const,
  predictedPosture: 'sit_like' as const,
  confidence: 0.93,
  ownerLabel: 'correct' as const,
  recordedAt: `2026-09-13T00:00:${id.padStart(2, '0')}.000Z`,
});

describe('PoseShadowValidationService', () => {
  it('persists per-dog owner-labelled samples and deduplicates by id', async () => {
    const storage = new MemoryStorage();
    await recordPoseShadowValidationSample(makeSample('01'), storage);
    await recordPoseShadowValidationSample({ ...makeSample('01'), confidence: 0.97 }, storage);
    await recordPoseShadowValidationSample(makeSample('02', 'dog-2'), storage);

    const dogOne = await loadPoseShadowValidationSamples('dog-1', storage);
    const dogTwo = await loadPoseShadowValidationSamples('dog-2', storage);

    expect(dogOne).toHaveLength(1);
    expect(dogOne[0]?.confidence).toBe(0.97);
    expect(dogOne[0]?.ownerLabel).toBe('correct');
    expect(dogTwo).toHaveLength(1);
  });

  it('migrates legacy training-outcome labels without mixing them into new persisted samples', async () => {
    const storage = new MemoryStorage();
    await storage.setItem(storageKeys.poseShadowValidation, {
      'dog-1': [
        { ...makeSample('01'), ownerLabel: undefined, ownerOutcome: 'success' },
        { ...makeSample('02'), ownerLabel: undefined, ownerOutcome: 'unsuccessful' },
      ],
    });

    const samples = await loadPoseShadowValidationSamples('dog-1', storage);
    expect(samples).toHaveLength(2);
    expect(samples.find((item) => item.id === '01')?.ownerLabel).toBe('correct');
    expect(samples.find((item) => item.id === '02')?.ownerLabel).toBe('incorrect');
    expect(samples.some((item) => 'ownerOutcome' in item)).toBe(false);
  });

  it('filters malformed persisted data instead of trusting it', async () => {
    const storage = new MemoryStorage();
    await storage.setItem(storageKeys.poseShadowValidation, {
      'dog-1': [makeSample('01'), { bad: true }],
      broken: 'not-an-array',
    });

    await expect(loadPoseShadowValidationSamples('dog-1', storage)).resolves.toHaveLength(1);
  });

  it('can pass its shadow quality gate while production auto-scoring remains blocked', async () => {
    const storage = new MemoryStorage();
    for (let index = 0; index < 50; index += 1) {
      await recordPoseShadowValidationSample({
        ...makeSample(String(index).padStart(2, '0')),
        recordedAt: new Date(Date.UTC(2026, 8, 13, 0, index, 0)).toISOString(),
      }, storage);
    }

    const report = await loadPoseShadowValidationReport('dog-1', 'sit_like', storage);
    expect(report.samples).toBe(50);
    expect(report.precision).toBe(1);
    expect(report.shadowQualityGatePassed).toBe(true);
    expect(report.certifiedForAutoScoring).toBe(false);
  });
});
