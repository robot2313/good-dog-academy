import { domainTransactionService } from '../../services/domainTransactionServiceInstance';
import { createLocalId } from '../../utils/ids';
import { OnboardingCompletionService } from './OnboardingCompletionService';
import { dogPhotoStorage } from './photo/dogPhotoStorageInstance';

export const onboardingCompletionService = new OnboardingCompletionService(
  domainTransactionService,
  createLocalId,
  () => new Date().toISOString(),
  dogPhotoStorage,
);
