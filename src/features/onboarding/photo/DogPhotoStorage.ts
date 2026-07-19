export interface DogPhotoStorage {
  persist(sourceUri: string, dogId: string): Promise<string>;
  remove(uri: string): Promise<void>;
}

export class DogPhotoStorageError extends Error {
  constructor(message: string, readonly context: Record<string, unknown>, options?: ErrorOptions) {
    super(message, options);
    this.name = 'DogPhotoStorageError';
  }
}
