/**
 * Mock Auth Service
 * Provides instant, zero-friction auth state so you can build and use the entire app
 * without any authentication barriers, Clerk setup, or login screens.
 */

export interface MockUser {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  imageUrl?: string | null;
  primaryEmailAddress: { emailAddress: string };
  emailAddresses: { emailAddress: string }[];
}

export const CURRENT_USER: MockUser = {
  id: 'dev_user_1',
  fullName: 'Athlete',
  firstName: 'Athlete',
  lastName: '',
  imageUrl: null,
  primaryEmailAddress: { emailAddress: 'athlete@calory.ai' },
  emailAddresses: [{ emailAddress: 'athlete@calory.ai' }],
};

export function useUser() {
  return {
    isLoaded: true,
    isSignedIn: true,
    user: CURRENT_USER,
  };
}

export function useAuth() {
  return {
    isLoaded: true,
    isSignedIn: true,
    userId: CURRENT_USER.id,
    signOut: async () => {
      console.log('[Auth] Signed out (mock)');
    },
  };
}

