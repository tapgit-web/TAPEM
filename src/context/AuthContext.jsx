import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  auth, 
  googleProvider,
  isFirebaseConfigured, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signOut, 
  sendPasswordResetEmail, 
  updateProfile, 
  onAuthStateChanged,
  formatAuthError,
  saveExtraUserProfile,
  getExtraUserProfile
} from '../services/firebase';

const AuthContext = createContext(null);

const STORAGE_KEY_DEMO_USER = 'worklog_demo_auth_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(() => isFirebaseConfigured());

  // Restore user from Firebase or local demo session
  useEffect(() => {
    setConfigured(isFirebaseConfigured());

    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        if (currentUser) {
          const extra = getExtraUserProfile(currentUser.uid);
          setUser({
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName || currentUser.email.split('@')[0],
            photoURL: currentUser.photoURL || null,
            employeeId: extra.employeeId || 'EMP-' + currentUser.uid.substring(0, 4).toUpperCase(),
            isDemo: false
          });
        } else {
          // Check if demo user is active
          const savedDemo = localStorage.getItem(STORAGE_KEY_DEMO_USER);
          if (savedDemo) {
            try {
              setUser(JSON.parse(savedDemo));
            } catch (e) {
              setUser(null);
            }
          } else {
            setUser(null);
          }
        }
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      // Firebase not configured yet, check for demo session
      const savedDemo = localStorage.getItem(STORAGE_KEY_DEMO_USER);
      if (savedDemo) {
        try {
          setUser(JSON.parse(savedDemo));
        } catch (e) {
          setUser(null);
        }
      }
      setLoading(false);
    }
  }, []);

  /**
   * Sign In with Email & Password
   */
  const login = async (email, password) => {
    if (!auth || !configured) {
      throw new Error(
        'Firebase Authentication is not configured. Please add your Firebase configuration to the .env file or use Quick Demo Login.'
      );
    }

    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const extra = getExtraUserProfile(cred.user.uid);
      const fullUser = {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: cred.user.displayName || cred.user.email.split('@')[0],
        photoURL: cred.user.photoURL || null,
        employeeId: extra.employeeId || 'EMP-' + cred.user.uid.substring(0, 4).toUpperCase(),
        isDemo: false
      };
      setUser(fullUser);
      localStorage.removeItem(STORAGE_KEY_DEMO_USER);
      return fullUser;
    } catch (err) {
      throw new Error(formatAuthError(err));
    }
  };

  /**
   * Register with Email & Password, Display Name and optional Employee ID
   */
  const register = async (email, password, displayName, employeeId) => {
    if (!auth || !configured) {
      throw new Error(
        'Firebase Authentication is not configured. Please add your Firebase configuration to the .env file.'
      );
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      
      // Update display name
      if (displayName && displayName.trim()) {
        await updateProfile(cred.user, { displayName: displayName.trim() });
      }

      // Store employee ID
      const assignedEmpId = employeeId && employeeId.trim() 
        ? employeeId.trim().toUpperCase() 
        : 'EMP-' + cred.user.uid.substring(0, 4).toUpperCase();

      saveExtraUserProfile(cred.user.uid, {
        displayName: displayName || '',
        employeeId: assignedEmpId
      });

      const fullUser = {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: displayName || cred.user.email.split('@')[0],
        photoURL: null,
        employeeId: assignedEmpId,
        isDemo: false
      };

      setUser(fullUser);
      localStorage.removeItem(STORAGE_KEY_DEMO_USER);
      return fullUser;
    } catch (err) {
      throw new Error(formatAuthError(err));
    }
  };

  /**
   * Sign In with Google
   */
  const loginWithGoogle = async () => {
    if (!auth || !googleProvider || !configured) {
      throw new Error(
        'Firebase Authentication is not configured. Please add your Firebase credentials to the .env file.'
      );
    }

    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const extra = getExtraUserProfile(cred.user.uid);
      const fullUser = {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: cred.user.displayName || cred.user.email.split('@')[0],
        photoURL: cred.user.photoURL || null,
        employeeId: extra.employeeId || 'EMP-' + cred.user.uid.substring(0, 4).toUpperCase(),
        isDemo: false
      };
      setUser(fullUser);
      localStorage.removeItem(STORAGE_KEY_DEMO_USER);
      return fullUser;
    } catch (err) {
      throw new Error(formatAuthError(err));
    }
  };

  /**
   * Send Password Reset Email
   */
  const resetPassword = async (email) => {
    if (!auth || !configured) {
      throw new Error('Firebase Authentication is not configured.');
    }

    try {
      await sendPasswordResetEmail(auth, email.trim());
      return true;
    } catch (err) {
      throw new Error(formatAuthError(err));
    }
  };

  /**
   * Quick Demo Login for instant testing without Firebase keys
   */
  const loginAsDemo = (role = 'engineer') => {
    const demoProfiles = {
      engineer: {
        uid: 'demo_eng_001',
        email: 'ravi.kumar@apex-industrial.com',
        displayName: 'Ravi Kumar',
        employeeId: 'EMP-104',
        role: 'Senior Automation Engineer',
        photoURL: null,
        isDemo: true
      },
      supervisor: {
        uid: 'demo_sup_002',
        email: 'priya.sharma@apex-industrial.com',
        displayName: 'Priya Sharma',
        employeeId: 'EMP-088',
        role: 'Site Operations Lead',
        photoURL: null,
        isDemo: true
      }
    };

    const selected = demoProfiles[role] || demoProfiles.engineer;
    setUser(selected);
    localStorage.setItem(STORAGE_KEY_DEMO_USER, JSON.stringify(selected));
    return selected;
  };

  /**
   * Update Employee ID and profile details for the active user
   */
  const updateUserProfile = async ({ displayName, employeeId }) => {
    if (!user) return null;

    const cleanId = employeeId && employeeId.trim() 
      ? employeeId.trim().toUpperCase() 
      : user.employeeId;
    const cleanName = displayName && displayName.trim() 
      ? displayName.trim() 
      : user.displayName;

    // Persist in custom user profile storage
    saveExtraUserProfile(user.uid, {
      displayName: cleanName,
      employeeId: cleanId
    });

    // Update Firebase display name if changed
    if (auth && auth.currentUser && cleanName !== user.displayName) {
      try {
        await updateProfile(auth.currentUser, { displayName: cleanName });
      } catch (e) {
        console.warn('Could not update Firebase profile display name:', e);
      }
    }

    const updatedUser = {
      ...user,
      displayName: cleanName,
      employeeId: cleanId
    };

    setUser(updatedUser);

    if (user.isDemo) {
      localStorage.setItem(STORAGE_KEY_DEMO_USER, JSON.stringify(updatedUser));
    }

    return updatedUser;
  };

  /**
   * Sign Out
   */
  const logout = async () => {
    localStorage.removeItem(STORAGE_KEY_DEMO_USER);
    setUser(null);

    if (auth && auth.currentUser) {
      try {
        await signOut(auth);
      } catch (err) {
        console.error('Sign out error:', err);
      }
    }
  };

  const value = {
    user,
    loading,
    configured,
    login,
    register,
    loginWithGoogle,
    resetPassword,
    loginAsDemo,
    updateUserProfile,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
