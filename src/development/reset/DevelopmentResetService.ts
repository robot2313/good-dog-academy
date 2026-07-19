import type { DomainRepositories } from '../../domain/repositories';
import type { DogPhotoStorage } from '../../features/onboarding/photo/DogPhotoStorage';
import type { OwnershipService } from '../../services/OwnershipService';

export class DevelopmentOnlyError extends Error {
  constructor() {
    super('Reset App Data is available only in development builds.');
    this.name = 'DevelopmentOnlyError';
  }
}

export class DevelopmentResetService {
  constructor(
    private readonly repositories: DomainRepositories,
    private readonly ownership: Pick<OwnershipService, 'deleteOwner'>,
    private readonly photos: DogPhotoStorage,
    private readonly development = __DEV__,
  ) {}

  async resetAppData(): Promise<void> {
    if (!this.development) throw new DevelopmentOnlyError();
    const owners = await this.repositories.owners.findAll();
    const ownerIds = new Set(owners.map((owner) => owner.id));
    const photoUris = (await this.repositories.dogs.findAll())
      .filter((dog) => ownerIds.has(dog.ownerId) && dog.photoUri !== null)
      .map((dog) => dog.photoUri as string);

    for (const owner of owners) await this.ownership.deleteOwner(owner.id);
    for (const uri of photoUris) await this.photos.remove(uri);
  }
}
