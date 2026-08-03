import { Directory, File, Paths } from 'expo-file-system';

import type { DogPhotoStorage } from './DogPhotoStorage';
import { DogPhotoStorageError } from './DogPhotoStorage';

/**
 * Build a managed photo file name that is UNIQUE per save.
 *
 * A previous implementation wrote to a deterministic `${dogId}${ext}` path, so
 * replacing a photo produced the exact same `file://` URI. React Native's
 * `Image` caches decoded bitmaps by URI, so the UI kept showing the old photo
 * even though the record and shared state updated correctly. Adding a unique
 * token to the file name changes the URI and forces the image to reload.
 */
export function managedDogPhotoFileName(
  dogId: string,
  extension: string,
  uniqueToken: string,
): string {
  const safeExtension = /^\.[a-zA-Z0-9]{1,5}$/.test(extension) ? extension.toLowerCase() : '.jpg';
  return `${dogId}-${uniqueToken}${safeExtension}`;
}

function defaultUniqueToken(): string {
  return `${Date.now().toString(36)}${Math.floor(Math.random() * 1_000_000).toString(36)}`;
}

export class ExpoDogPhotoStorage implements DogPhotoStorage {
  constructor(private readonly uniqueToken: () => string = defaultUniqueToken) {}

  async persist(sourceUri: string, dogId: string): Promise<string> {
    try {
      const directory = new Directory(Paths.document, 'dog-photos');
      directory.create({ intermediates: true, idempotent: true });
      const source = new File(sourceUri);
      const fileName = managedDogPhotoFileName(dogId, source.extension, this.uniqueToken());
      const destination = new File(directory, fileName);
      if (destination.exists) destination.delete();
      source.copy(destination);
      return destination.uri;
    } catch (cause) {
      throw new DogPhotoStorageError('Unable to copy the selected dog photo.', { sourceUri, dogId }, { cause });
    }
  }

  async remove(uri: string): Promise<void> {
    try {
      const file = new File(uri);
      if (file.exists) file.delete();
    } catch (cause) {
      throw new DogPhotoStorageError('Unable to remove a managed dog photo.', { uri }, { cause });
    }
  }

  async removeAllManagedPhotos(): Promise<void> {
    try {
      const directory = new Directory(Paths.document, 'dog-photos');
      if (directory.exists) directory.delete();
    } catch (cause) {
      throw new DogPhotoStorageError('Unable to remove managed dog photos.', {}, { cause });
    }
  }
}
