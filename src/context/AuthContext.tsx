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
  resetAccountCloudDataAndLeaderboard,
  CloudUserProfile,
} from '../lib/firestoreService';
import { Profile } from '../types';

interface AuthContextType {
  user: User | null;
  cloudProfile: CloudUserProfile | null;
  loading: boolean;
  isSigningIn: boolean;
  authError: string | null;
  hasSetMainProfile: boolean;
  shouldShowMainProfileSetup: boolean;
  setShouldShowMainProfileSetup: (val: boolean) => void;
  markMainProfileAsSet: () => Promise<void>;
  clearAuthError: () => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateCloudProfile: (data: Partial<CloudUserProfile>) => Promise<void>;
  resetCloudAccount: (cleanProfiles: Profile[]) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [cloudProfile, setCloudProfile] = useState<CloudUserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [shouldShowMainProfileSetup, setShouldShowMainProfileSetup] = useState<boolean>(false);

  const clearAuthError = () => setAuthError(null);

  const hasSetMainProfile = Boolean(
    cloudProfile?.hasSetMainProfile ||
      (user && typeof localStorage !== 'undefined' && localStorage.getItem(`barbut_has_set_main_profile_${user.uid}`) === 'true')
  );

  const fetchProfile = async (uid: string) => {
    if (!auth.currentUser || auth.currentUser.uid !== uid) {
      return;
    }
    try {
      const p = await getUserProfile(uid);
      const localHasSet = typeof localStorage !== 'undefined' && localStorage.getItem(`barbut_has_set_main_profile_${uid}`) === 'true';

      if (p) {
        setCloudProfile(p);
        if (!p.hasSetMainProfile && !localHasSet) {
          setShouldShowMainProfileSetup(true);
        }
      } else if (auth.currentUser && auth.currentUser.uid === uid) {
        // Initial setup for new user with Master Profile
        const masterName = auth.currentUser.displayName || 'Starețul Mănăstirii';
        const initialMasterProfile: Profile = {
          id: `master_${uid.substring(0, 8)}`,
          name: masterName,
          avatarIcon: 'monk_master',
          isMaster: true,
          gamesPlayed: 0,
          totalSips: 0,
          totalChugs: 0,
          totalXP: 0,
          currentLevel: 1,
          currentTitle_ro: 'Ucenic de Tavernă',
          currentTitle_en: 'Tavern Apprentice',
          winsBoardgame: 0,
          winsDuel: 0,
          winsCasino: 0,
          winsPineapple: 0,
          winsCrash: 0,
          gamesPlayedCrash: 0,
          sipsDrunkCrash: 0,
          totalPineapplePoints: 0,
          unlockedAchievements: [],
          createdAt: Date.now(),
        };

        const initial: CloudUserProfile = {
          userId: uid,
          displayName: masterName,
          avatarIcon: 'monk_master',
          email: auth.currentUser.email || '',
          masterProfile: initialMasterProfile,
          subProfiles: [],
          profiles: [initialMasterProfile],
          drunkenCoins: 100,
          hasSetMainProfile: false,
          gamesPlayed: 0,
          totalSips: 0,
          totalChugs: 0,
          totalXP: 0,
          currentLevel: 1,
          currentTitle_ro: 'Ucenic de Tavernă',
          currentTitle_en: 'Tavern Apprentice',
          duelWins: 0,
          duelPlayed: 0,
          winsBoardgame: 0,
          winsDuel: 0,
          winsCasino: 0,
          winsPineapple: 0,
          winsCrash: 0,
          unlockedAchievements: [],
        };
        await saveUserProfile(initial);
        setCloudProfile(initial);
        if (!localHasSet) {
          setShouldShowMainProfileSetup(true);
        }
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

  const markMainProfileAsSet = async () => {
    if (user) {
      try {
        localStorage.setItem(`barbut_has_set_main_profile_${user.uid}`, 'true');
      } catch (e) {}
      await saveUserProfile({ hasSetMainProfile: true });
      await refreshProfile();
    }
    setShouldShowMainProfileSetup(false);
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

  const resetCloudAccount = async (cleanProfiles: Profile[]) => {
    if (!user) return;
    await resetAccountCloudDataAndLeaderboard(user.uid, cleanProfiles);
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
        hasSetMainProfile,
        shouldShowMainProfileSetup,
        setShouldShowMainProfileSetup,
        markMainProfileAsSet,
        clearAuthError,
        signInWithGoogle,
        signOut,
        refreshProfile,
        updateCloudProfile,
        resetCloudAccount,
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
