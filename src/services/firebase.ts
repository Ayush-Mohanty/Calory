import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
  Firestore,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

try {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
  } else {
    console.warn('[Firebase] Config keys are missing. Firebase will operate in offline mock mode.');
  }
} catch (error) {
  console.error('[Firebase] Failed to initialize Firebase:', error);
}

export { app, db };

export interface FirestoreUserProfile {
  id: string;
  email: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
  provider?: string;
}

/**
 * Persists or updates the user profile document in Firestore: `users/{userId}`.
 * Saves basic info: id, email, fullName, photoUrl, createdAt, lastLoginAt, dailyCalorieGoal.
 */
export async function saveUserToFirestore(
  profile: FirestoreUserProfile
): Promise<{ success: boolean; error?: string }> {
  if (!db) {
    console.warn('[Firebase] Firestore is not initialized. Skipping cloud sync.');
    return { success: false, error: 'Firestore is not initialized.' };
  }

  try {
    const userDocRef = doc(db, 'users', profile.id);
    const dataToSave = {
      id: profile.id,
      email: profile.email,
      fullName: profile.fullName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'User',
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      photoUrl: profile.photoUrl || '',
      provider: profile.provider || 'clerk',
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    };

    // Merge to avoid overwriting existing fields like previous logs or custom goals
    await setDoc(userDocRef, dataToSave, { merge: true });
    console.log(`[Firebase] Successfully synced user profile to Firestore: users/${profile.id}`);
    return { success: true };
  } catch (error: any) {
    console.error('[Firebase] Error saving user to Firestore:', error);
    return { success: false, error: error?.message || 'Failed to sync with Firestore' };
  }
}
