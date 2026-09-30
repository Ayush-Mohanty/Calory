import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  Firestore,
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { OnboardingData } from './storage';

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
 * Saves basic info: id, email, fullName, photoUrl, createdAt, lastLoginAt.
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

/**
 * Saves completed onboarding form data to Firestore: users/{userId}
 */
export async function saveOnboardingToFirestore(
  userId: string,
  data: OnboardingData
): Promise<{ success: boolean; error?: string }> {
  if (!db) {
    return { success: false, error: 'Firestore is not initialized.' };
  }

  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(
      userDocRef,
      {
        gender: data.gender,
        goal: data.goal,
        workoutDays: data.workoutDays,
        birthDate: data.birthDate,
        heightFeet: data.heightFeet,
        heightInches: data.heightInches,
        weightKg: data.weightKg,
        onboardingCompleted: true,
        onboardedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    console.log(`[Firebase] Onboarding synced to Firestore for user: users/${userId}`);
    return { success: true };
  } catch (error: any) {
    console.error('[Firebase] Error saving onboarding to Firestore:', error);
    return { success: false, error: error?.message || 'Failed to sync onboarding' };
  }
}

/**
 * Checks if the user already has onboarding info in Firestore.
 */
export async function checkUserOnboardingStatusInFirestore(
  userId: string
): Promise<boolean> {
  if (!db) return false;

  try {
    const userDocRef = doc(db, 'users', userId);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const data = snap.data();
      return !!data?.onboardingCompleted;
    }
    return false;
  } catch (error) {
    console.error('[Firebase] Error checking onboarding status:', error);
    return false;
  }
}

/**
 * Saves AI-generated nutrition and fitness plan to Firestore: users/{userId}
 */
export async function saveAiPlanToFirestore(
  userId: string,
  plan: any
): Promise<{ success: boolean; error?: string }> {
  if (!db) {
    return { success: false, error: 'Firestore is not initialized.' };
  }

  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(
      userDocRef,
      {
        nutritionPlan: plan,
        nutritionPlanGeneratedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    console.log(`[Firebase] AI Nutrition Plan synced to Firestore for user: users/${userId}`);
    return { success: true };
  } catch (error: any) {
    console.error('[Firebase] Error saving AI plan to Firestore:', error);
    return { success: false, error: error?.message || 'Failed to sync AI plan' };
  }
}

/**
 * Retrieves existing AI nutrition plan from Firestore for a given user.
 */
export async function getAiPlanFromFirestore(userId: string): Promise<any | null> {
  if (!db) return null;

  try {
    const userDocRef = doc(db, 'users', userId);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const data = snap.data();
      return data?.nutritionPlan || null;
    }
    return null;
  } catch (error) {
    console.error('[Firebase] Error fetching AI plan from Firestore:', error);
    return null;
  }
}

export interface NutritionLog {
  id?: string;
  userId: string;
  date: string; // YYYY-MM-DD
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water?: number; // Liters
  createdAt: number;
}

export async function addNutritionLogToFirestore(log: Omit<NutritionLog, 'id'>) {
  if (!db) return;
  try {
    const logsRef = collection(db, 'nutritionLogs');
    await addDoc(logsRef, log);
    console.log('[Firebase] Successfully added nutrition log');
  } catch (err) {
    console.error('[Firebase] Error adding nutrition log', err);
  }
}

export function subscribeToNutritionLogs(
  userId: string, 
  dateString: string, 
  callback: (logs: NutritionLog[]) => void
) {
  if (!db) return () => {};
  
  const logsRef = collection(db, 'nutritionLogs');
  const q = query(logsRef, where('userId', '==', userId), where('date', '==', dateString));
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NutritionLog));
    callback(logs);
  }, (err) => {
    console.error('[Firebase] Error subscribing to logs', err);
  });
  
  return unsubscribe;
}

