import type { BehaviourProfile, Dog, Owner } from '../../domain/models';
import type { DomainTransactionService } from '../../services/DomainTransactionService';
import type { DogFormData, OwnerFormData } from './types';
import { dogFromForm, ownerFromForm, validateDogForm, validateOwnerForm } from './validation';
import type { DogPhotoStorage } from './photo/DogPhotoStorage';

export type CompletedOnboarding = { owner: Owner; dog: Dog; behaviourProfile: BehaviourProfile };

export class OnboardingCompletionService {
  constructor(
    private readonly transactions: DomainTransactionService,
    private readonly createId: (prefix: string) => string,
    private readonly now: () => string,
    private readonly photoStorage: DogPhotoStorage,
  ) {}

  async complete(ownerForm: OwnerFormData, dogForm: DogFormData): Promise<CompletedOnboarding> {
    if (!validateOwnerForm(ownerForm).valid || !validateDogForm(dogForm).valid) throw new Error('Onboarding forms are invalid.');
    const timestamp = this.now();
    const owner = ownerFromForm(ownerForm, this.createId('owner'), timestamp);
    const dogId = this.createId('dog');
    const persistentPhotoUri = dogForm.photoUri ? await this.photoStorage.persist(dogForm.photoUri, dogId) : null;
    const dog = dogFromForm({ ...dogForm, photoUri: persistentPhotoUri }, dogId, owner.id, timestamp);
    const behaviourProfile: BehaviourProfile = {
      id: this.createId('behaviour-profile'),
      dogId: dog.id,
      energyLevel: dog.energyLevel,
      confidenceLevel: 'medium',
      foodMotivation: 'medium',
      challenges: [],
      notes: '',
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    try {
      await this.transactions.saveOwnerSetup({ owner, dog, behaviourProfile });
    } catch (cause) {
      if (persistentPhotoUri) {
        try { await this.photoStorage.remove(persistentPhotoUri); } catch { /* Preserve the original transaction failure. */ }
      }
      throw cause;
    }
    return { owner, dog, behaviourProfile };
  }
}
