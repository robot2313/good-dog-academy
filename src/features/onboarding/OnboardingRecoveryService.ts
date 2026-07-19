import type { OwnershipService } from '../../services/OwnershipService';
import type { OnboardingStatus, OnboardingStatusService } from './OnboardingStatusService';
import type { DogPhotoStorage } from './photo/DogPhotoStorage';

export class OnboardingRecoveryService {
  constructor(
    private readonly ownership: OwnershipService,
    private readonly statusService: OnboardingStatusService,
    private readonly photos?: DogPhotoStorage,
  ) {}

  async restart(status: OnboardingStatus): Promise<void> {
    if (status.state === 'complete' || status.state === 'not-started') return;
    if (status.state === 'incomplete') {
      if (status.owner) await this.ownership.deleteOwner(status.owner.id);
      else if (status.dog) await this.ownership.deleteDog(status.dog.id);
    }
    await this.statusService.clearIncompleteData();
    if (status.state === 'incomplete' && status.dog?.photoUri && this.photos) {
      try { await this.photos.remove(status.dog.photoUri); } catch { /* Domain recovery succeeded; stale file cleanup is best effort. */ }
    }
  }
}
