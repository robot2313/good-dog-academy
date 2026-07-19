import { domainTransactionService } from '../../services/domainTransactionServiceInstance';
import { createLocalId } from '../../utils/ids';
import { OnboardingCompletionService } from './OnboardingCompletionService';

export const onboardingCompletionService = new OnboardingCompletionService(
  domainTransactionService,
  createLocalId,
  () => new Date().toISOString(),
);
