import { ownershipService } from '../../services/ownershipServiceInstance';
import { appStorage } from '../../services/appStorage';
import { createOnboardingStatusService } from './OnboardingStatusService';
import { OnboardingRecoveryService } from './OnboardingRecoveryService';
import { dogPhotoStorage } from './photo/dogPhotoStorageInstance';

export const onboardingRecoveryService = new OnboardingRecoveryService(
  ownershipService,
  createOnboardingStatusService(appStorage),
  dogPhotoStorage,
);
