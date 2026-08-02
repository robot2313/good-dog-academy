import { domainRepositories } from '../../../services/domainRepositories';
import { dogPhotoStorage } from './dogPhotoStorageInstance';
import { DogPhotoUpdateService } from './DogPhotoUpdateService';

export const dogPhotoUpdateService = new DogPhotoUpdateService({
  photoStorage: dogPhotoStorage,
  saveDog: (dog) => domainRepositories.dogs.save(dog),
  now: () => new Date().toISOString(),
});
