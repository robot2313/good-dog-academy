import { appStorage } from '../../services/appStorage';
import { dogPhotoStorage } from '../onboarding/photo/dogPhotoStorageInstance';
import { LocalDataDeletionService } from './LocalDataDeletionService';

export const localDataDeletionService = new LocalDataDeletionService(appStorage, dogPhotoStorage);
