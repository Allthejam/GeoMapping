'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  Firestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentSingleTabManager,
  getFirestore
} from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { firebaseConfig } from './config';

/**
 * Singleton instances to prevent multiple initializations 
 * which cause "Unexpected State" assertion failures.
 */
let firebaseAppInstance: FirebaseApp | null = null;
let firestoreInstance: Firestore | null = null;
let authInstance: Auth | null = null;
let storageInstance: FirebaseStorage | null = null;

/**
 * Standard Firebase initialization with safety checks to prevent crashes
 * during initial configuration/environment variable sync.
 * Includes hardened Firestore Singleton logic to resolve "Unexpected state" errors.
 */
export function initializeFirebase(): { 
  firebaseApp: FirebaseApp | null; 
  firestore: Firestore | null; 
  auth: Auth | null;
  storage: FirebaseStorage | null;
} {
  try {
    // 1. Initialize App
    if (!firebaseAppInstance) {
      const apps = getApps();
      if (apps.length > 0) {
        firebaseAppInstance = apps[0];
      } else {
        firebaseAppInstance = initializeApp(firebaseConfig);
      }
    }

    // 2. Initialize Auth
    if (!authInstance && firebaseAppInstance) {
      authInstance = getAuth(firebaseAppInstance);
    }

    // 3. Initialize Firestore (Only on Client)
    if (!firestoreInstance && firebaseAppInstance) {
      if (typeof window !== 'undefined') {
        try {
          // IMPORTANT: initializeFirestore must only be called ONCE per app instance.
          // We use the firestoreInstance variable as a strict guard.
          firestoreInstance = initializeFirestore(firebaseAppInstance, {
            localCache: persistentLocalCache({
              tabManager: persistentSingleTabManager(undefined)
            })
          });
        } catch (e) {
          // If already initialized or persistent cache fails, fall back to existing instance
          firestoreInstance = getFirestore(firebaseAppInstance);
        }
      } else {
        // Server-side (Webhooks/Actions) gets basic Firestore
        firestoreInstance = getFirestore(firebaseAppInstance);
      }
    }

    // 4. Initialize Storage
    if (!storageInstance && firebaseAppInstance) {
      storageInstance = getStorage(firebaseAppInstance);
    }

    return { 
      firebaseApp: firebaseAppInstance, 
      firestore: firestoreInstance, 
      auth: authInstance, 
      storage: storageInstance 
    };
  } catch (error) {
    console.error("Critical Firebase initialization failure:", error);
    return { firebaseApp: null, firestore: null, auth: null, storage: null };
  }
}
