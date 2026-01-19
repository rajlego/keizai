import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  User,
  UserCredential,
} from 'firebase/auth';
import { getFirebaseAuth, isFirebaseConfigured } from '../sync/firebaseConfig';

export type { User } from 'firebase/auth';

export interface AuthError {
  code: string;
  message: string;
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string): Promise<UserCredential> {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured. Please add Firebase credentials to your .env file.');
  }

  const auth = getFirebaseAuth();
  return signInWithEmailAndPassword(auth, email, password);
}

/**
 * Create a new account with email and password
 */
export async function signUpWithEmail(email: string, password: string): Promise<UserCredential> {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured. Please add Firebase credentials to your .env file.');
  }

  const auth = getFirebaseAuth();
  return createUserWithEmailAndPassword(auth, email, password);
}

/**
 * Sign in with Google
 */
export async function signInWithGoogle(): Promise<UserCredential> {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured. Please add Firebase credentials to your .env file.');
  }

  const auth = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  if (!isFirebaseConfigured()) {
    return;
  }

  const auth = getFirebaseAuth();
  return firebaseSignOut(auth);
}

/**
 * Get the current authenticated user
 */
export function getCurrentUser(): User | null {
  if (!isFirebaseConfigured()) {
    return null;
  }

  const auth = getFirebaseAuth();
  return auth.currentUser;
}

/**
 * Subscribe to auth state changes
 * Returns an unsubscribe function
 */
export function onAuthStateChanged(callback: (user: User | null) => void): () => void {
  if (!isFirebaseConfigured()) {
    // Immediately call with null and return no-op unsubscribe
    callback(null);
    return () => {};
  }

  const auth = getFirebaseAuth();
  return firebaseOnAuthStateChanged(auth, callback);
}

/**
 * Parse Firebase auth error to user-friendly message
 */
export function parseAuthError(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    const authError = error as AuthError;
    switch (authError.code) {
      case 'auth/email-already-in-use':
        return 'This email is already registered. Please sign in instead.';
      case 'auth/invalid-email':
        return 'Invalid email address format.';
      case 'auth/operation-not-allowed':
        return 'Email/password sign-in is not enabled.';
      case 'auth/weak-password':
        return 'Password is too weak. Please use at least 6 characters.';
      case 'auth/user-disabled':
        return 'This account has been disabled.';
      case 'auth/user-not-found':
        return 'No account found with this email.';
      case 'auth/wrong-password':
        return 'Incorrect password.';
      case 'auth/invalid-credential':
        return 'Invalid email or password.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/popup-closed-by-user':
        return 'Sign-in popup was closed before completing.';
      case 'auth/popup-blocked':
        return 'Sign-in popup was blocked. Please allow popups for this site.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection.';
      default:
        return authError.message || 'An authentication error occurred.';
    }
  }
  return 'An unknown error occurred.';
}
