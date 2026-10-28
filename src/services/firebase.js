import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';

// Storage keys for custom client credentials (can be set via in-app settings or .env)
const STORAGE_KEY_FIREBASE_CONFIG = 'worklog_firebase_config';
const STORAGE_KEY_USER_PROFILE = 'worklog_user_extra_profile';

// Default project Firebase credentials for tapdata1
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyCjrFbD1szvH-sHpY3q0gbuYLvuooi5aAI',
  authDomain: 'tapdata1-7ce00.firebaseapp.com',
  projectId: 'tapdata1-7ce00',
  storageBucket: 'tapdata1-7ce00.firebasestorage.app',
  messagingSenderId: '492040872339',
  appId: '1:492040872339:web:7fc57d0776ad0764ff0866'
};

/**
 * Retrieves the active Firebase configuration
 * Priority: 1. LocalStorage overrides -> 2. Environment variables (.env) -> 3. Default project credentials
 */
export function getFirebaseConfig() {
  // Check localStorage first
  try {
    const custom = localStorage.getItem(STORAGE_KEY_FIREBASE_CONFIG);
    if (custom) {
      const parsed = JSON.parse(custom);
      if (parsed.apiKey && parsed.projectId) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading stored Firebase config:', e);
  }

  // Read from Vite environment variables (fallback to default project config if hosting provider strips .env)
  const envConfig = {
    apiKey: (import.meta.env.VITE_FIREBASE_API_KEY || DEFAULT_FIREBASE_CONFIG.apiKey || '').trim(),
    authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || DEFAULT_FIREBASE_CONFIG.authDomain || '').trim(),
    projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_CONFIG.projectId || '').trim(),
    storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || DEFAULT_FIREBASE_CONFIG.storageBucket || '').trim(),
    messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || DEFAULT_FIREBASE_CONFIG.messagingSenderId || '').trim(),
    appId: (import.meta.env.VITE_FIREBASE_APP_ID || DEFAULT_FIREBASE_CONFIG.appId || '').trim()
  };

  return envConfig;
}

/**
 * Checks if Firebase configuration has all required properties
 */
export function isFirebaseConfigured() {
  const config = getFirebaseConfig();
  return Boolean(
    config.apiKey && 
    config.apiKey.trim() !== '' && 
    config.projectId && 
    config.projectId.trim() !== '' &&
    !config.apiKey.includes('YOUR_FIREBASE_')
  );
}

/**
 * Saves Firebase configuration to localStorage
 */
export function saveFirebaseConfig(config) {
  if (!config) {
    localStorage.removeItem(STORAGE_KEY_FIREBASE_CONFIG);
  } else {
    localStorage.setItem(STORAGE_KEY_FIREBASE_CONFIG, JSON.stringify(config));
  }
}

// Initialize Firebase App instance safely
let app = null;
let auth = null;
let googleProvider = null;

try {
  const config = getFirebaseConfig();
  if (isFirebaseConfigured()) {
    app = getApps().length === 0 ? initializeApp(config) : getApp();
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });
  }
} catch (err) {
  console.warn('Firebase initialization deferred or failed:', err.message);
}

/**
 * Re-initializes Firebase if config is updated dynamically
 */
export function reinitializeFirebase() {
  try {
    const config = getFirebaseConfig();
    if (isFirebaseConfigured()) {
      app = getApps().length === 0 ? initializeApp(config) : getApp();
      auth = getAuth(app);
      googleProvider = new GoogleAuthProvider();
      return { success: true, auth };
    }
    return { success: false, error: 'Incomplete Firebase configuration' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Maps Firebase Auth error codes to user-friendly messages
 */
export function formatAuthError(errorCode, defaultMsg = 'Authentication failed.') {
  if (!errorCode) return defaultMsg;
  
  const code = typeof errorCode === 'string' ? errorCode : (errorCode.code || '');

  switch (code) {
    case 'auth/invalid-email':
      return 'The email address format is invalid. Please check and try again.';
    case 'auth/user-disabled':
      return 'This user account has been deactivated. Please contact an administrator.';
    case 'auth/user-not-found':
      return 'No registered account found with this email. Please check your spelling or sign up.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please verify and try again or use "Forgot Password".';
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please check your credentials and try again.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email address. Please sign in instead.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/popup-closed-by-user':
      return 'Google Sign-In popup was closed before completing the sign-in.';
    case 'auth/popup-blocked':
      return 'Sign-In popup was blocked by your browser. Please allow popups for this site.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized for OAuth operations in your Firebase Console.';
    case 'auth/operation-not-allowed':
      return 'Email/Password or Google provider is not enabled in your Firebase Console Auth settings.';
    case 'auth/too-many-requests':
      return 'Access to this account has been temporarily disabled due to many failed login attempts. Try again later.';
    case 'auth/network-request-failed':
      return 'Network connection error. Please check your internet connection.';
    default:
      if (typeof errorCode === 'string') return errorCode;
      return errorCode.message || defaultMsg;
  }
}

/**
 * Save additional profile data for user (e.g. Employee ID)
 */
export function saveExtraUserProfile(uid, profileData) {
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY_USER_PROFILE) || '{}');
    existing[uid] = { ...(existing[uid] || {}), ...profileData };
    localStorage.setItem(STORAGE_KEY_USER_PROFILE, JSON.stringify(existing));
  } catch (e) {
    console.error('Error saving extra user profile:', e);
  }
}

/**
 * Get additional profile data for user
 */
export function getExtraUserProfile(uid) {
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY_USER_PROFILE) || '{}');
    return existing[uid] || {};
  } catch (e) {
    return {};
  }
}

export { 
  app, 
  auth, 
  googleProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signOut, 
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged
};
