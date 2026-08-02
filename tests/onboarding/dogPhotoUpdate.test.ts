import type { Dog } from '../../src/domain/models/Dog';
import type { DogPhotoStorage } from '../../src/features/onboarding/photo/DogPhotoStorage';
import { DogPhotoUpdateService } from '../../src/features/onboarding/photo/DogPhotoUpdateService';

const OLD_MANAGED_URI = 'file:///documents/dog-photos/dog-1.jpg';
const NEW_MANAGED_URI = 'file:///documents/dog-photos/dog-1-new.jpg';
const PICKER_URI = 'file:///cache/ExponentImagePicker/picked.jpg';

function makeDog(overrides: Partial<Dog> = {}): Dog {
  return {
    id: 'dog-1',
    ownerId: 'owner-1',
    name: 'Pepper',
    breed: 'Border Collie mix',
    breedUnknown: false,
    dateOfBirth: null,
    birthdayEstimated: false,
    estimatedAgeYears: null,
    sex: 'female',
    weightKg: null,
    weightUnit: 'kg',
    energyLevel: 'high',
    photoUri: OLD_MANAGED_URI,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

interface Harness {
  service: DogPhotoUpdateService;
  events: string[];
  persist: jest.Mock;
  remove: jest.Mock;
  saveDog: jest.Mock;
  onSaved: jest.Mock;
}

function makeHarness(options: {
  persistUri?: string;
  saveDogImpl?: (dog: Dog) => Promise<void>;
  removeImpl?: (uri: string) => Promise<void>;
} = {}): Harness {
  const events: string[] = [];

  const persist = jest.fn(async (_uri: string, _dogId: string) => {
    events.push('persist');
    return options.persistUri ?? NEW_MANAGED_URI;
  });
  const remove = jest.fn(async (uri: string) => {
    events.push(`remove:${uri}`);
    if (options.removeImpl) await options.removeImpl(uri);
  });
  const saveDog = jest.fn(async (dog: Dog) => {
    events.push('save');
    if (options.saveDogImpl) await options.saveDogImpl(dog);
  });
  const onSaved = jest.fn(async () => {
    events.push('refresh');
  });

  const photoStorage: DogPhotoStorage = { persist, remove };
  const service = new DogPhotoUpdateService({
    photoStorage,
    saveDog,
    now: () => '2026-08-03T00:00:00.000Z',
  });

  return { service, events, persist, remove, saveDog, onSaved };
}

describe('DogPhotoUpdateService.replacePhoto', () => {
  it('persists, saves and refreshes before removing the old photo, and never touches the picker URI', async () => {
    const h = makeHarness();
    const result = await h.service.replacePhoto(makeDog(), PICKER_URI, h.onSaved);

    expect(h.events).toEqual(['persist', 'save', 'refresh', `remove:${OLD_MANAGED_URI}`]);
    expect(result.photoUri).toBe(NEW_MANAGED_URI);
    expect(result.updatedAt).toBe('2026-08-03T00:00:00.000Z');
    // The externally selected picker URI is only ever persisted, never removed.
    expect(h.persist).toHaveBeenCalledWith(PICKER_URI, 'dog-1');
    expect(h.remove).not.toHaveBeenCalledWith(PICKER_URI);
  });

  it('does not remove the old photo until the replacement record save succeeds', async () => {
    const h = makeHarness();
    await h.service.replacePhoto(makeDog(), PICKER_URI, h.onSaved);

    const saveIndex = h.events.indexOf('save');
    const removeOldIndex = h.events.indexOf(`remove:${OLD_MANAGED_URI}`);
    expect(saveIndex).toBeGreaterThanOrEqual(0);
    expect(removeOldIndex).toBeGreaterThan(saveIndex);
  });

  it('keeps the old photo and rolls back the new file when the record save fails', async () => {
    const h = makeHarness({
      saveDogImpl: async () => {
        throw new Error('dog save failed');
      },
    });

    await expect(h.service.replacePhoto(makeDog(), PICKER_URI, h.onSaved)).rejects.toThrow(
      'dog save failed',
    );

    // Newly persisted replacement is cleaned up as rollback.
    expect(h.remove).toHaveBeenCalledWith(NEW_MANAGED_URI);
    // Old photo is retained (never removed) and state is not refreshed.
    expect(h.remove).not.toHaveBeenCalledWith(OLD_MANAGED_URI);
    expect(h.onSaved).not.toHaveBeenCalled();
  });

  it('still surfaces the save error even if rolling back the new file fails', async () => {
    const h = makeHarness({
      saveDogImpl: async () => {
        throw new Error('dog save failed');
      },
      removeImpl: async () => {
        throw new Error('rollback remove failed');
      },
    });

    await expect(h.service.replacePhoto(makeDog(), PICKER_URI, h.onSaved)).rejects.toThrow(
      'dog save failed',
    );
    expect(h.remove).toHaveBeenCalledWith(NEW_MANAGED_URI);
  });

  it('does not undo the updated record when old-photo cleanup fails after a successful save', async () => {
    const h = makeHarness({
      removeImpl: async (uri) => {
        if (uri === OLD_MANAGED_URI) throw new Error('cleanup failed');
      },
    });

    const result = await h.service.replacePhoto(makeDog(), PICKER_URI, h.onSaved);

    expect(result.photoUri).toBe(NEW_MANAGED_URI);
    expect(h.saveDog).toHaveBeenCalledTimes(1);
    expect(h.onSaved).toHaveBeenCalledTimes(1);
  });

  it('refreshes application state exactly once, after the save and before cleanup', async () => {
    const h = makeHarness();
    await h.service.replacePhoto(makeDog(), PICKER_URI, h.onSaved);

    expect(h.onSaved).toHaveBeenCalledTimes(1);
    const refreshIndex = h.events.indexOf('refresh');
    expect(refreshIndex).toBeGreaterThan(h.events.indexOf('save'));
    expect(refreshIndex).toBeLessThan(h.events.indexOf(`remove:${OLD_MANAGED_URI}`));
  });

  it('does not remove anything when the dog has no previous managed photo', async () => {
    const h = makeHarness();
    await h.service.replacePhoto(makeDog({ photoUri: null }), PICKER_URI, h.onSaved);
    expect(h.remove).not.toHaveBeenCalled();
  });
});

describe('DogPhotoUpdateService.removePhoto', () => {
  it('saves photoUri:null and refreshes before removing the old photo', async () => {
    const h = makeHarness();
    const result = await h.service.removePhoto(makeDog(), h.onSaved);

    expect(h.events).toEqual(['save', 'refresh', `remove:${OLD_MANAGED_URI}`]);
    expect(result.photoUri).toBeNull();
    expect(h.saveDog.mock.calls[0][0].photoUri).toBeNull();
  });

  it('does not delete the existing file when saving photoUri:null fails', async () => {
    const h = makeHarness({
      saveDogImpl: async () => {
        throw new Error('dog save failed');
      },
    });

    await expect(h.service.removePhoto(makeDog(), h.onSaved)).rejects.toThrow('dog save failed');
    expect(h.remove).not.toHaveBeenCalled();
    expect(h.onSaved).not.toHaveBeenCalled();
  });

  it('does not undo the record when cleanup fails after a successful save', async () => {
    const h = makeHarness({
      removeImpl: async () => {
        throw new Error('cleanup failed');
      },
    });

    const result = await h.service.removePhoto(makeDog(), h.onSaved);
    expect(result.photoUri).toBeNull();
    expect(h.onSaved).toHaveBeenCalledTimes(1);
  });
});
