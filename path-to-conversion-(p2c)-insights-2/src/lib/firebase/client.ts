import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

export interface FirebaseConnectionConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  appId?: string;
  collectionName?: string;
}

const DEFAULT_COLLECTION = 'p2c_touchpoints';

let appInstance: FirebaseApp | null = null;
let firestoreInstance: Firestore | null = null;
let authInstance: Auth | null = null;
let activeCollectionName: string = DEFAULT_COLLECTION;

/**
 * Retrieves environment or local storage Firebase configuration
 */
export function getStoredFirebaseConfig(): FirebaseConnectionConfig {
  const metaEnv = (import.meta as any).env || {};

  try {
    const local = localStorage.getItem('p2c_firestore_config');
    if (local) {
      const parsed = JSON.parse(local);
      return {
        apiKey: parsed.apiKey || metaEnv.VITE_FIREBASE_API_KEY,
        authDomain: parsed.authDomain || metaEnv.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: parsed.projectId || metaEnv.VITE_FIREBASE_PROJECT_ID,
        storageBucket: parsed.storageBucket || metaEnv.VITE_FIREBASE_STORAGE_BUCKET,
        appId: parsed.appId || metaEnv.VITE_FIREBASE_APP_ID,
        collectionName: parsed.collectionName || DEFAULT_COLLECTION,
      };
    }
  } catch (e) {
    // Ignore localStorage parse errors
  }

  return {
    apiKey: metaEnv.VITE_FIREBASE_API_KEY || '',
    authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || '',
    appId: metaEnv.VITE_FIREBASE_APP_ID || '',
    collectionName: DEFAULT_COLLECTION,
  };
}

/**
 * Saves customized Firestore connection config
 */
export function saveFirestoreConfig(config: FirebaseConnectionConfig): void {
  try {
    localStorage.setItem('p2c_firestore_config', JSON.stringify(config));
    // Reset instance so next getFirestoreInstance re-initializes
    firestoreInstance = null;
    authInstance = null;
    appInstance = null;
    if (config.collectionName) {
      activeCollectionName = config.collectionName;
    }
  } catch (e) {
    console.error('Failed to save Firestore config:', e);
  }
}

/** Returns Firebase Authentication for the currently configured Firebase app. */
export function getFirebaseAuth(): Auth | null {
  const { isConfigured } = getFirestoreInstance();
  if (!isConfigured || !appInstance) return null;
  if (!authInstance) authInstance = getAuth(appInstance);
  return authInstance;
}

/**
 * Initializes and returns the Firestore instance if valid credentials exist.
 */
export function getFirestoreInstance(): { db: Firestore | null; isConfigured: boolean; collectionName: string } {
  const config = getStoredFirebaseConfig();
  activeCollectionName = config.collectionName || DEFAULT_COLLECTION;

  // Verify minimal required credentials for Firestore
  const hasValidConfig = Boolean(config.projectId && config.projectId.trim().length > 0 && config.projectId !== 'demo-project');

  if (!hasValidConfig) {
    return { db: null, isConfigured: false, collectionName: activeCollectionName };
  }

  if (firestoreInstance) {
    return { db: firestoreInstance, isConfigured: true, collectionName: activeCollectionName };
  }

  try {
    const firebaseConfig = {
      apiKey: config.apiKey || 'AIzaSyDemoPlaceholderKey',
      authDomain: config.authDomain || `${config.projectId}.firebaseapp.com`,
      projectId: config.projectId,
      storageBucket: config.storageBucket || `${config.projectId}.appspot.com`,
      appId: config.appId || '1:123456789:web:abcdef',
    };

    appInstance = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    firestoreInstance = getFirestore(appInstance);
    return { db: firestoreInstance, isConfigured: true, collectionName: activeCollectionName };
  } catch (err) {
    console.error('Failed to initialize Firebase app:', err);
    return { db: null, isConfigured: false, collectionName: activeCollectionName };
  }
}
