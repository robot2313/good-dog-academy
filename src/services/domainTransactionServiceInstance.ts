import { StorageTransactionManager } from '../storage/StorageTransactionManager';
import { appStorage } from './appStorage';
import { DomainTransactionService } from './DomainTransactionService';

export const domainTransactionService = new DomainTransactionService(new StorageTransactionManager(appStorage));
