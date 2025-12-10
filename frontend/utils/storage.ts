// Fallback em memória para quando localStorage estiver bloqueado
const memoryStorage: Record<string, string> = {};

// Verifica se o localStorage está disponível
const checkStorageAvailability = () => {
  try {
    if (typeof window === 'undefined') return false;
    const storage = window.localStorage;
    const testKey = '__storage_test__';
    storage.setItem(testKey, testKey);
    storage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};

const isStorageAvailable = checkStorageAvailability();

export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (isStorageAvailable) {
        return window.localStorage.getItem(key);
      }
    } catch {
      // Fallback
    }
    return memoryStorage[key] || null;
  },
  
  setItem: (key: string, value: string): void => {
    try {
      if (isStorageAvailable) {
        window.localStorage.setItem(key, value);
        return; 
      }
    } catch (e) {
      // Fallback
    }
    memoryStorage[key] = value;
  },
  
  removeItem: (key: string): void => {
    try {
      if (isStorageAvailable) {
        window.localStorage.removeItem(key);
        return;
      }
    } catch (e) {
      // Fallback
    }
    delete memoryStorage[key];
  }
};