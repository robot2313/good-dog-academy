import { appStorage } from '../../services/appStorage';
import { createLocalId } from '../../utils/ids';
import { StorageTransactionManager } from '../../storage/StorageTransactionManager';
import { AssessmentCompletionService } from './AssessmentCompletionService';
import { BehaviourAssessmentTransactionService } from './BehaviourAssessmentTransactionService';

export const behaviourAssessmentTransactions = new BehaviourAssessmentTransactionService(new StorageTransactionManager(appStorage));
export const assessmentCompletionService = new AssessmentCompletionService(behaviourAssessmentTransactions, createLocalId, () => new Date().toISOString());
