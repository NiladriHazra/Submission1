import { LocalStorageService } from './localStorage';
import { StorageInterface } from '../types';

// Storage factory - allows easy swapping between storage implementations
export function createStorageService(): StorageInterface {
  // For now, return localStorage implementation
  // In the future, this can be swapped for API-based storage
  return new LocalStorageService();
}

export const storage = createStorageService();
export { LocalStorageService };
