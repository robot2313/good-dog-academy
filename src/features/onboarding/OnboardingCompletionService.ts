import type { BehaviourProfile, Dog, Owner } from '../../domain/models';
import type { DomainTransactionService } from '../../services/DomainTransactionService';
import type { DogFormData, OwnerFormData } from './types';
import { dogFromForm, ownerFromForm, validateDogForm, validateOwnerForm } from './validation';

export type CompletedOnboarding = { owner: Owner; dog: Dog; behaviourProfile: BehaviourProfile };

export class OnboardingCompletionService {
  constructor(
    private readonly transactions: DomainTransactionService,
    private readonly createId: (prefix: string) => string,
    private readonly now: () => string,
  ) {}

  async complete(ownerForm: OwnerFormData, dogForm: DogFormData): Promise<CompletedOnboarding> {
    if (!validateOwnerForm(ownerForm).valid || !validateDogForm(dogForm).valid) throw new Error('Onboarding forms are invalid.');
    const timestamp = this.now();
    const owner = ownerFromForm(ownerForm, this.createId('owner'), timestamp);
    const dog = dogFromForm(dogForm, this.createId('dog'), owner.id, timestamp);
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
    await this.transactions.saveOwnerSetup({ owner, dog, behaviourProfile });
    return { owner, dog, behaviourProfile };
  }
}
