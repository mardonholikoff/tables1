import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  Firestore,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';
import { UserTable, ActivityLog } from '../types';

const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  projectId: firebaseConfigData.projectId,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
  appId: firebaseConfigData.appId,
};

const databaseId = firebaseConfigData.firestoreDatabaseId || '(default)';

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with IndexedDB Offline Persistence
let firestoreDb: Firestore;
try {
  firestoreDb = initializeFirestore(
    app,
    {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    },
    databaseId
  );
} catch (e) {
  try {
    firestoreDb = getFirestore(app, databaseId);
  } catch (err) {
    console.warn('Fallback to default getFirestore:', err);
    firestoreDb = getFirestore(app);
  }
}

export const db = firestoreDb;
export const TABLES_COLLECTION = 'tables';
export const LOGS_COLLECTION = 'activity_logs';

export interface SyncStatus {
  isOnline: boolean;
  hasPendingWrites: boolean;
  fromCache: boolean;
  lastSyncTime: Date | null;
}

/**
 * Log an activity action to Firestore & Local Storage
 */
export async function logActivityToFirebase(logData: Omit<ActivityLog, 'id' | 'timestamp'>): Promise<void> {
  try {
    const id = 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const timestamp = new Date().toISOString();
    const logItem: ActivityLog = {
      ...logData,
      id,
      timestamp,
    };

    const docRef = doc(db, LOGS_COLLECTION, id);
    await setDoc(docRef, logItem);
  } catch (error) {
    console.warn('Error saving activity log to Firebase:', error);
  }
}

/**
 * Subscribe to real-time activity logs from Firestore
 */
export function subscribeToFirebaseLogs(
  onData: (logs: ActivityLog[]) => void,
  onError?: (error: any) => void
): Unsubscribe {
  const colRef = collection(db, LOGS_COLLECTION);
  const q = query(colRef, orderBy('timestamp', 'desc'), limit(150));

  return onSnapshot(
    q,
    (snapshot) => {
      const logs: ActivityLog[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as ActivityLog;
        logs.push({
          ...data,
          id: docSnap.id,
        });
      });
      onData(logs);
    },
    (error) => {
      console.error('Firestore logs subscription error:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Subscribe to all tables from Firestore with real-time offline/online sync
 */
export function subscribeToFirebaseTables(
  onData: (tables: UserTable[], syncStatus: SyncStatus) => void,
  onError?: (error: any) => void
): Unsubscribe {
  const colRef = collection(db, TABLES_COLLECTION);
  const q = query(colRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snapshot) => {
      const tables: UserTable[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as UserTable;
        tables.push({
          ...data,
          id: docSnap.id,
        });
      });

      const syncStatus: SyncStatus = {
        isOnline: navigator.onLine,
        hasPendingWrites: snapshot.metadata.hasPendingWrites,
        fromCache: snapshot.metadata.fromCache,
        lastSyncTime: snapshot.metadata.hasPendingWrites ? null : new Date(),
      };

      onData(tables, syncStatus);
    },
    (error) => {
      console.error('Firestore subscription error:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Save or update table in Firestore (queued offline automatically)
 */
export async function saveTableToFirebase(table: UserTable): Promise<void> {
  try {
    const docRef = doc(db, TABLES_COLLECTION, table.id);
    await setDoc(docRef, {
      id: table.id,
      name: table.name,
      columns: table.columns,
      rows: table.rows,
      createdAt: table.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error saving table to Firebase:', error);
    throw error;
  }
}

/**
 * Delete table from Firestore
 */
export async function deleteTableFromFirebase(tableId: string): Promise<void> {
  try {
    const docRef = doc(db, TABLES_COLLECTION, tableId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting table from Firebase:', error);
    throw error;
  }
}

/**
 * Clear all tables from Firestore
 */
export async function clearAllTablesFromFirebase(tableIds: string[]): Promise<void> {
  try {
    await Promise.all(tableIds.map((id) => deleteDoc(doc(db, TABLES_COLLECTION, id))));
  } catch (error) {
    console.error('Error clearing tables from Firebase:', error);
    throw error;
  }
}
