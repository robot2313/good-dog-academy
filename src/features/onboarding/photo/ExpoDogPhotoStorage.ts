import { Directory, File, Paths } from 'expo-file-system';

import type { DogPhotoStorage } from './DogPhotoStorage';
import { DogPhotoStorageError } from './DogPhotoStorage';

export class ExpoDogPhotoStorage implements DogPhotoStorage {
  async persist(sourceUri: string, dogId: string): Promise<string> {
    try {
      const directory = new Directory(Paths.document, 'dog-photos');
      directory.create({ intermediates: true, idempotent: true });
      const source = new File(sourceUri);
      const extension = /^\.[a-zA-Z0-9]{1,5}$/.test(source.extension) ? source.extension.toLowerCase() : '.jpg';
      const destination = new File(directory, `${dogId}${extension}`);
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
}
