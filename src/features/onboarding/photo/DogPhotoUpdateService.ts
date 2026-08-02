import type { Dog } from '../../../domain/models/Dog';
import type { DogPhotoStorage } from './DogPhotoStorage';

export interface DogPhotoUpdateDependencies {
  readonly photoStorage: DogPhotoStorage;
  readonly saveDog: (dog: Dog) => Promise<void>;
  readonly now: () => string;
}

/**
 * Transactional updates to a dog's profile photo.
 *
 * Ordering is chosen so the persisted dog record never references a missing
 * file and no user data is lost if a step fails:
 *
 * Replacement:
 *   1. Persist the newly selected image to a new app-owned file.
 *   2. Save the dog record pointing at the new file.
 *   3. Refresh application state (cross-tab).
 *   4. Only after the save succeeds, remove the old app-owned photo.
 *   5. Old-file cleanup failure is non-fatal and never rolls back the change.
 *   6. If the record save fails, remove the newly persisted image (rollback)
 *      and retain the old image and old record.
 *
 * Removal:
 *   1. Save the dog record with photoUri: null.
 *   2. Refresh application state.
 *   3. Only after the save succeeds, remove the previous app-owned photo.
 *   4. Cleanup failure is non-fatal.
 *   5. If the save fails, retain the old image and existing photoUri.
 *
 * The externally selected picker URI is only ever passed to `persist`; it is
 * never passed to `remove`, so an arbitrary external file is never deleted.
 */
export class DogPhotoUpdateService {
  constructor(private readonly deps: DogPhotoUpdateDependencies) {}

  async replacePhoto(
    dog: Dog,
    selectedUri: string,
    onSaved: () => Promise<void>,
  ): Promise<Dog> {
    const { photoStorage, saveDog, now } = this.deps;
    const previousManagedUri = dog.photoUri;

    // 1. Persist the newly selected image to a new app-owned file.
    const newManagedUri = await photoStorage.persist(selectedUri, dog.id);
    const updatedDog: Dog = { ...dog, photoUri: newManagedUri, updatedAt: now() };

    // 2. Save the dog record pointing at the new file.
    try {
      await saveDog(updatedDog);
    } catch (saveError) {
      // 6. Roll back the newly persisted image; keep the old image and record.
      await this.safeRemove(newManagedUri);
      throw saveError;
    }

    // 3. Refresh application state (cross-tab) before cleanup.
    await onSaved();

    // 4 & 5. Non-fatal cleanup of the old app-owned photo.
    if (previousManagedUri && previousManagedUri !== newManagedUri) {
      await this.safeRemove(previousManagedUri);
    }

    return updatedDog;
  }

  async removePhoto(dog: Dog, onSaved: () => Promise<void>): Promise<Dog> {
    const { saveDog, now } = this.deps;
    const previousManagedUri = dog.photoUri;

    // 1. Save the dog record with no photo. If this throws, nothing has been
    //    removed, so the old image and existing photoUri are retained.
    const updatedDog: Dog = { ...dog, photoUri: null, updatedAt: now() };
    await saveDog(updatedDog);

    // 2. Refresh application state before cleanup.
    await onSaved();

    // 3 & 4. Non-fatal cleanup of the previous app-owned photo.
    if (previousManagedUri) {
      await this.safeRemove(previousManagedUri);
    }

    return updatedDog;
  }

  private async safeRemove(uri: string): Promise<void> {
    try {
      await this.deps.photoStorage.remove(uri);
    } catch {
      /* Cleanup is non-fatal and must never roll back a successful change. */
    }
  }
}
