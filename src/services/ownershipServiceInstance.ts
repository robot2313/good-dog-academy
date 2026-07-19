import { StorageTransactionManager } from '../storage/StorageTransactionManager';
import { appStorage } from './appStorage';
import { OwnershipService } from './OwnershipService';

export const ownershipService = new OwnershipService(new StorageTransactionManager(appStorage));
