/**
 * Device-local store (IndexedDB) for data shown while offline: the last
 * loaded result of a screen ("snapshot") and the signed-in profile.
 *
 * Only an ADMIN session enables it (`setOfflineScope`), and everything is
 * removed on sign-out (`clearOfflineData`). Values are stored with the
 * structured clone algorithm, so plain objects, arrays and Dates survive.
 */

const DB_NAME = "nam-phong-offline";
const DB_VERSION = 1;
const STORE = "entries";

type Entry<T> = { value: T; savedAt: number };

export type OfflineSnapshot<T> = { data: T; savedAt: number };

let dbPromise: Promise<IDBDatabase> | null = null;
/** User whose snapshots are read and written; null disables snapshots. */
let scopeUserId: string | null = null;

function openDb() {
  if (!dbPromise) {
    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      if (typeof indexedDB === "undefined") {
        reject(new Error("IndexedDB is not available."));
        return;
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        request.result.createObjectStore(STORE);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    // A failed open (private mode, quota) may succeed later; do not cache it.
    dbPromise.catch(() => {
      dbPromise = null;
    });
  }
  return dbPromise;
}

async function run<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
) {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const request = action(db.transaction(STORE, mode).objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readEntry<T>(key: string) {
  try {
    return (await run<Entry<T> | undefined>("readonly", (store) =>
      store.get(key),
    )) ?? null;
  } catch {
    return null;
  }
}

async function writeEntry<T>(key: string, value: T) {
  try {
    const entry: Entry<T> = { value, savedAt: Date.now() };
    await run("readwrite", (store) => store.put(entry, key));
  } catch {
    // Offline copies are best effort; a failed write only loses the copy.
  }
}

export function setOfflineScope(userId: string | null) {
  scopeUserId = userId;
}

export function isOfflineScopeEnabled() {
  return scopeUserId !== null;
}

/** Saves the latest result of a screen for the current user. */
export function writeSnapshot<T>(key: string, data: T) {
  if (!scopeUserId) return Promise.resolve();
  return writeEntry(`snapshot:${scopeUserId}:${key}`, data);
}

/** Last saved result of a screen for the current user, if any. */
export async function readSnapshot<T>(
  key: string,
): Promise<OfflineSnapshot<T> | null> {
  if (!scopeUserId) return null;
  const entry = await readEntry<T>(`snapshot:${scopeUserId}:${key}`);
  return entry && { data: entry.value, savedAt: entry.savedAt };
}

/** Saves a user's profile so the app can open without a network. */
export function writeCachedProfile<T>(userId: string, profile: T) {
  return writeEntry(`profile:${userId}`, profile);
}

export async function readCachedProfile<T>(userId: string) {
  return (await readEntry<T>(`profile:${userId}`))?.value ?? null;
}

/** Removes every offline copy on this device (sign-out). */
export async function clearOfflineData() {
  scopeUserId = null;
  try {
    await run("readwrite", (store) => store.clear());
  } catch {
    // Nothing stored or IndexedDB unavailable.
  }
}
