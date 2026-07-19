import { dogPhotoStorage } from '../../features/onboarding/photo/dogPhotoStorageInstance';
import { domainRepositories } from '../../services/domainRepositories';
import { ownershipService } from '../../services/ownershipServiceInstance';
import { DevelopmentResetService } from './DevelopmentResetService';

export const developmentResetService = new DevelopmentResetService(
  domainRepositories,
  ownershipService,
  dogPhotoStorage,
);
