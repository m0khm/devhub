type StorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

const inMemoryStore = new Map<string, string>();

const inMemoryStorage: StorageLike = {
  getItem: (key) => inMemoryStore.get(key) ?? null,
  setItem: (key, value) => {
    inMemoryStore.set(key, value);
  },
  removeItem: (key) => {
    inMemoryStore.delete(key);
  },
};

let warnedStorageUnavailable = false;
let resolvedStorage: StorageLike | null = null;

const warnOnce = (error: unknown) => {
  if (warnedStorageUnavailable) {
    return;
  }

  warnedStorageUnavailable = true;
  console.warn('Storage is unavailable. Falling back to in-memory storage.', error);
};

const resolveStorage = (): StorageLike => {
  if (resolvedStorage) {
    return resolvedStorage;
  }

  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      throw new Error('localStorage is not available');
    }

    const testKey = '__safe_storage_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);

    resolvedStorage = window.localStorage;
    return resolvedStorage;
  } catch (error) {
    warnOnce(error);
    resolvedStorage = inMemoryStorage;
    return resolvedStorage;
  }
};

export const safeStorage = {
  get(key: string): string | null {
    const storage = resolveStorage();
    try {
      return storage.getItem(key);
    } catch (error) {
      warnOnce(error);
      resolvedStorage = inMemoryStorage;
      return inMemoryStorage.getItem(key);
    }
  },
  set(key: string, value: string): void {
    const storage = resolveStorage();
    try {
      storage.setItem(key, value);
    } catch (error) {
      warnOnce(error);
      resolvedStorage = inMemoryStorage;
      inMemoryStorage.setItem(key, value);
    }
  },
  remove(key: string): void {
    const storage = resolveStorage();
    try {
      storage.removeItem(key);
    } catch (error) {
      warnOnce(error);
      resolvedStorage = inMemoryStorage;
      inMemoryStorage.removeItem(key);
    }
  },
};
