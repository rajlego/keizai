import { doc, setDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import * as Y from 'yjs';
import { ydoc } from './yjsProvider';
import { getFirebaseDb, isFirebaseConfigured } from './firebaseConfig';

// Sync status types
export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

// Private state
let syncStatus: SyncStatus = 'offline';
let statusListeners = new Set<(status: SyncStatus) => void>();
let remoteUnsubscribe: Unsubscribe | null = null;
let localUnsubscribe: ((update: Uint8Array, origin: unknown) => void) | null = null;
let currentUserId: string | null = null;
let currentDocId: string | null = null;

// Debounce timer for batching updates
let syncDebounceTimer: ReturnType<typeof setTimeout> | null = null;
const SYNC_DEBOUNCE_MS = 500;

function setSyncStatus(status: SyncStatus): void {
  if (syncStatus !== status) {
    syncStatus = status;
    statusListeners.forEach((listener) => listener(status));
  }
}

export function getSyncStatus(): SyncStatus {
  return syncStatus;
}

export function onSyncStatusChange(callback: (status: SyncStatus) => void): () => void {
  statusListeners.add(callback);
  // Immediately call with current status
  callback(syncStatus);
  return () => statusListeners.delete(callback);
}

/**
 * Start syncing Yjs document with Firebase Firestore
 * @param userId - The authenticated user's ID
 * @param docId - Optional document ID (defaults to 'keizai-data')
 */
export function startSync(userId: string, docId: string = 'keizai-data'): void {
  if (!isFirebaseConfigured()) {
    console.warn('[FirebaseSync] Firebase is not configured. Skipping sync.');
    setSyncStatus('offline');
    return;
  }

  // Stop any existing sync
  stopSync();

  currentUserId = userId;
  currentDocId = docId;

  const db = getFirebaseDb();
  const docRef = doc(db, 'users', userId, 'documents', docId);

  setSyncStatus('syncing');
  console.log('[FirebaseSync] Starting sync for user:', userId);

  // Listen for remote changes
  remoteUnsubscribe = onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.update) {
          try {
            // Decode base64 to Uint8Array
            const update = Uint8Array.from(atob(data.update), (c) => c.charCodeAt(0));
            // CRITICAL: Use origin to prevent sync loops
            Y.applyUpdate(ydoc, update, 'firebase');
            console.log('[FirebaseSync] Applied remote update');
          } catch (err) {
            console.error('[FirebaseSync] Error applying remote update:', err);
            setSyncStatus('error');
            return;
          }
        }
      }
      setSyncStatus('synced');
    },
    (error) => {
      console.error('[FirebaseSync] Snapshot error:', error);
      setSyncStatus('error');
    }
  );

  // Listen for local changes
  localUnsubscribe = (update: Uint8Array, origin: unknown) => {
    // CRITICAL: Don't re-sync updates from Firebase
    if (origin === 'firebase') return;

    // Debounce to batch rapid updates
    if (syncDebounceTimer) {
      clearTimeout(syncDebounceTimer);
    }

    setSyncStatus('syncing');

    syncDebounceTimer = setTimeout(async () => {
      try {
        // Encode update as base64
        const encoded = btoa(String.fromCharCode(...update));
        // Also store full state for recovery
        const fullState = btoa(String.fromCharCode(...Y.encodeStateAsUpdate(ydoc)));

        await setDoc(
          docRef,
          {
            update: encoded,
            fullState: fullState,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );

        console.log('[FirebaseSync] Pushed local update to Firebase');
        setSyncStatus('synced');
      } catch (err) {
        console.error('[FirebaseSync] Error pushing update:', err);
        setSyncStatus('error');
      }
    }, SYNC_DEBOUNCE_MS);
  };

  ydoc.on('update', localUnsubscribe);
}

/**
 * Stop syncing and cleanup listeners
 */
export function stopSync(): void {
  if (remoteUnsubscribe) {
    remoteUnsubscribe();
    remoteUnsubscribe = null;
  }

  if (localUnsubscribe) {
    ydoc.off('update', localUnsubscribe);
    localUnsubscribe = null;
  }

  if (syncDebounceTimer) {
    clearTimeout(syncDebounceTimer);
    syncDebounceTimer = null;
  }

  currentUserId = null;
  currentDocId = null;
  setSyncStatus('offline');
  console.log('[FirebaseSync] Sync stopped');
}

/**
 * Force a full sync of the current document state
 * Useful after initial load or to recover from errors
 */
export async function forceSyncFullState(): Promise<void> {
  if (!currentUserId || !currentDocId || !isFirebaseConfigured()) {
    console.warn('[FirebaseSync] Cannot force sync: not connected');
    return;
  }

  const db = getFirebaseDb();
  const docRef = doc(db, 'users', currentUserId, 'documents', currentDocId);

  setSyncStatus('syncing');

  try {
    const fullState = btoa(String.fromCharCode(...Y.encodeStateAsUpdate(ydoc)));

    await setDoc(
      docRef,
      {
        fullState: fullState,
        update: fullState, // Use full state as update too
        updatedAt: new Date().toISOString(),
        forceSynced: true,
      },
      { merge: true }
    );

    console.log('[FirebaseSync] Force synced full state');
    setSyncStatus('synced');
  } catch (err) {
    console.error('[FirebaseSync] Error force syncing:', err);
    setSyncStatus('error');
  }
}

/**
 * Check if currently syncing
 */
export function isSyncing(): boolean {
  return currentUserId !== null && currentDocId !== null;
}

/**
 * Get current sync info
 */
export function getSyncInfo(): { userId: string | null; docId: string | null; status: SyncStatus } {
  return {
    userId: currentUserId,
    docId: currentDocId,
    status: syncStatus,
  };
}
