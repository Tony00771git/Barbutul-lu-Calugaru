import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  fbSignOut,
  onAuthStateChanged,
  User,
} from '../lib/firebase';
import {
  getUserProfile,
  saveUserProfile,
  CloudUserProfile,
} from '../lib/firestoreService';

interface AuthContextType {
  user: User | null;
  cloudProfile: CloudUserProfile | null;
  loading: boolean;
  isSigningIn: boolean;
  authError: string | null;
  clearAuthError: () => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateCloudProfile: (data: Partial<CloudUserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [cloudProfile, setCloudProfile] = useState<CloudUserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = () => setAuthError(null);

  const fetchProfile = async (uid: string) => {
    if (!auth.currentUser || auth.currentUser.uid !== uid) {
      return;
    }
    try {
      const p = await getUserProfile(uid);
      if (p) {
        setCloudProfile(p);
      } else if (auth.currentUser && auth.currentUser.uid === uid) {
        // Initial setup for new user
        const initial: CloudUserProfile = {
          userId: uid,
          displayName: auth.currentUser.displayName || 'Călugăr Pelerin',
          avatarIcon: 'monk_drunk',
          email: auth.currentUser.email || '',
          gamesPlayed: 0,
          totalSips: 0,
          totalChugs: 0,
          duelWins: 0,
          duelPlayed: 0,
          unlockedAchievements: [],
        };
        await saveUserProfile(initial);
        setCloudProfile(initial);
      }
    } catch (e) {
      console.warn('Could not fetch cloud profile:', e);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser.uid);
      } else {
        setCloudProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      if (res.user) {
        await fetchProfile(res.user.uid);
      }
    } catch (err: any) {
      console.warn('Sign-in issue:', err);
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        // User closed the popup intentionally
        setIsSigningIn(false);
        return;
      }
      if (err?.code === 'auth/popup-blocked') {
        setAuthError('Fereastra Google Popup a fost blocată de browser. Te rugăm să permiți pop-up-urile sau să deschizi aplicația într-o filă nouă.');
        setIsSigningIn(false);
        return;
      }
      // If IndexedDB or database is closing error occurred, retry once
      if (err?.message?.includes('closing') || err?.message?.includes('Database is closing')) {
        try {
          const res = await signInWithPopup(auth, googleProvider);
          if (res.user) {
            await fetchProfile(res.user.uid);
            setIsSigningIn(false);
            return;
          }
        } catch (retryErr: any) {
          console.error('Sign-in retry failed:', retryErr);
        }
      }
      setAuthError(err?.message || 'Eroare la autentificarea Google. Dacă ești într-un iframe, deschide jocul într-o filă nouă.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
      setCloudProfile(null);
    } catch (err) {
      console.error('Sign-out error:', err);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.uid);
    }
  };

  const updateCloudProfile = async (data: Partial<CloudUserProfile>) => {
    if (!user) return;
    await saveUserProfile(data);
    await refreshProfile();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        cloudProfile,
        loading,
        isSigningIn,
        authError,
        clearAuthError,
        signInWithGoogle,
        signOut,
        refreshProfile,
        updateCloudProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
