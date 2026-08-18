import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  query,
  limit,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { Profile } from '../types';

export interface CloudUserProfile {
  userId: string;
  displayName: string;
  avatarIcon?: string;
  email?: string;
  gamesPlayed: number;
  totalSips: number;
  totalChugs: number;
  duelWins?: number;
  duelPlayed?: number;
  winsBoardgame?: number;
  winsDuel?: number;
  winsCasino?: number;
  profiles?: Profile[];
  unlockedAchievements?: string[];
  createdAt?: any;
  updatedAt?: any;
}

export interface CloudLeaderboardEntry {
  id?: string;
  userId: string;
  profileId: string;
  accountName?: string;
  displayName: string;
  avatarIcon?: string;
  totalSips: number;
  totalChugs: number;
  totalScore: number;
  winsBoardgame: number;
  winsDuel: number;
  winsCasino: number;
  gamesPlayed: number;
  duelWins?: number;
  duelPlayed?: number;
  updatedAt?: any;
}

export interface CloudDuelHistory {
  matchId: string;
  roomCode: string;
  submode: 'general' | 'football';
  difficulty: 'easy' | 'medium' | 'hard';
  hostPlayerName: string;
  guestPlayerName: string;
  winnerName?: string;
  roundsTotal: number;
  creatorUid: string;
  createdAt?: any;
}

export async function getUserProfile(userId: string): Promise<CloudUserProfile | null> {
  // If user is not authenticated or the ID doesn't match current user, do not attempt to read private doc
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    return null;
  }
  const path = `users/${userId}`;
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    if (snap.exists()) {
      return snap.data() as CloudUserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

const sanitizeId = (str: string): string => {
  return str.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 60);
};

export async function syncAccountProfilesToCloud(profiles: Profile[]): Promise<void> {
  if (!auth.currentUser) return;
  const userId = auth.currentUser.uid;
  const accountName = auth.currentUser.displayName || auth.currentUser.email || 'Călugăr Google';
  const path = `users/${userId}`;

  try {
    const existing = await getDoc(doc(db, 'users', userId));
    const now = serverTimestamp();

    // 1. Delete legacy account-level aggregate leaderboard entry if it exists
    try {
      await deleteDoc(doc(db, 'leaderboards', userId));
    } catch {
      // Ignore if document did not exist
    }

    const sanitizedProfiles: Profile[] = profiles.map(p => ({
      id: p.id,
      name: (p.name || 'Călugăr').substring(0, 50),
      avatarIcon: (p.avatarIcon || 'monk_drunk').substring(0, 50000),
      gamesPlayed: Math.max(0, p.gamesPlayed || 0),
      totalSips: Math.max(0, p.totalSips || 0),
      totalChugs: Math.max(0, p.totalChugs || 0),
      winsBoardgame: Math.max(0, p.winsBoardgame || 0),
      winsDuel: Math.max(0, p.winsDuel || 0),
      winsCasino: Math.max(0, p.winsCasino || 0),
      unlockedAchievements: (p.unlockedAchievements || []).slice(0, 50),
      createdAt: p.createdAt || Date.now(),
    }));

    const totalLocalSips = sanitizedProfiles.reduce((s, p) => s + p.totalSips, 0);
    const totalLocalChugs = sanitizedProfiles.reduce((s, p) => s + p.totalChugs, 0);
    const totalLocalGames = sanitizedProfiles.reduce((s, p) => s + p.gamesPlayed, 0);
    const totalBoardWins = sanitizedProfiles.reduce((s, p) => s + (p.winsBoardgame || 0), 0);
    const totalDuelWins = sanitizedProfiles.reduce((s, p) => s + (p.winsDuel || 0), 0);
    const totalCasinoWins = sanitizedProfiles.reduce((s, p) => s + (p.winsCasino || 0), 0);

    const mergedAchievements = Array.from(
      new Set(sanitizedProfiles.flatMap(p => p.unlockedAchievements || []))
    ).slice(0, 50);

    const userDocData = {
      userId,
      displayName: accountName.substring(0, 100),
      avatarIcon: (sanitizedProfiles[0]?.avatarIcon || 'monk_drunk').substring(0, 50000),
      email: auth.currentUser.email ? auth.currentUser.email.substring(0, 256) : '',
      profiles: sanitizedProfiles,
      gamesPlayed: totalLocalGames,
      totalSips: totalLocalSips,
      totalChugs: totalLocalChugs,
      duelWins: totalDuelWins,
      duelPlayed: totalDuelWins,
      winsBoardgame: totalBoardWins,
      winsDuel: totalDuelWins,
      winsCasino: totalCasinoWins,
      unlockedAchievements: mergedAchievements,
      createdAt: existing.exists() ? existing.data()?.createdAt || now : now,
      updatedAt: now,
    };

    // Save to private user account
    await setDoc(doc(db, 'users', userId), userDocData, { merge: true });

    // Sync each INDIVIDUAL sub-profile as its own distinct entry on the global leaderboard
    for (const p of sanitizedProfiles) {
      const entryId = `${userId}_${sanitizeId(p.id)}`;
      const totalScore = p.totalSips + 25 * p.totalChugs;

      const leaderboardData = {
        userId,
        profileId: p.id,
        accountName: accountName.substring(0, 100),
        displayName: p.name.substring(0, 100),
        avatarIcon: p.avatarIcon || 'monk_drunk',
        totalSips: p.totalSips,
        totalChugs: p.totalChugs,
        totalScore,
        winsBoardgame: p.winsBoardgame || 0,
        winsDuel: p.winsDuel || 0,
        winsCasino: p.winsCasino || 0,
        gamesPlayed: p.gamesPlayed || 0,
        updatedAt: now,
      };

      await setDoc(doc(db, 'leaderboards', entryId), leaderboardData, { merge: true });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveUserProfile(profile: Partial<CloudUserProfile>): Promise<void> {
  if (!auth.currentUser) return;
  const userId = auth.currentUser.uid;
  const path = `users/${userId}`;

  try {
    const existing = await getDoc(doc(db, 'users', userId));
    const now = serverTimestamp();

    const dataToSave = {
      userId,
      displayName: (profile.displayName || auth.currentUser.displayName || 'Călugăr Google').substring(0, 100),
      avatarIcon: (profile.avatarIcon || 'monk_drunk').substring(0, 50000),
      email: auth.currentUser.email ? auth.currentUser.email.substring(0, 256) : '',
      profiles: profile.profiles || existing.data()?.profiles || [],
      gamesPlayed: Math.max(0, profile.gamesPlayed || 0),
      totalSips: Math.max(0, profile.totalSips || 0),
      totalChugs: Math.max(0, profile.totalChugs || 0),
      duelWins: Math.max(0, profile.duelWins || 0),
      duelPlayed: Math.max(0, profile.duelPlayed || 0),
      winsBoardgame: Math.max(0, profile.winsBoardgame || 0),
      winsDuel: Math.max(0, profile.winsDuel || 0),
      winsCasino: Math.max(0, profile.winsCasino || 0),
      unlockedAchievements: (profile.unlockedAchievements || []).slice(0, 50),
      createdAt: existing.exists() ? existing.data()?.createdAt || now : now,
      updatedAt: now,
    };

    await setDoc(doc(db, 'users', userId), dataToSave, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Fetches the global leaderboard.
 * CRITICAL: ONLY returns individual subprofiles! Filters out any master account aggregate docs.
 */
export async function fetchGlobalLeaderboard(): Promise<CloudLeaderboardEntry[]> {
  const path = 'leaderboards';
  try {
    const q = query(collection(db, 'leaderboards'), limit(200));
    const querySnapshot = await getDocs(q);
    const results: CloudLeaderboardEntry[] = [];
    const currentUid = auth.currentUser?.uid;

    for (const d of querySnapshot.docs) {
      const data = d.data();
      const docId = d.id;
      const entryUserId = data.userId || '';
      const profileId = data.profileId || '';

      // 1. Detect and filter out legacy aggregate master account documents
      const isLegacyAccountDoc =
        docId === entryUserId ||
        !profileId ||
        profileId === entryUserId ||
        data.isAccountAggregate === true;

      if (isLegacyAccountDoc) {
        // If this legacy account document belongs to the currently signed in user or admin, clean it up from Firestore!
        if (
          currentUid &&
          (entryUserId === currentUid ||
            auth.currentUser?.email === 'antoniu.andrei.radu@gmail.com')
        ) {
          deleteDoc(doc(db, 'leaderboards', docId)).catch(() => {});
        }
        // Skip from leaderboard results
        continue;
      }

      const sips = data.totalSips || 0;
      const chugs = data.totalChugs || 0;
      results.push({
        id: docId,
        userId: entryUserId,
        profileId: profileId,
        accountName: data.accountName || '',
        displayName: data.displayName || 'Călugăr Anonim',
        avatarIcon: data.avatarIcon || 'monk_drunk',
        totalSips: sips,
        totalChugs: chugs,
        totalScore: typeof data.totalScore === 'number' ? data.totalScore : sips + 25 * chugs,
        winsBoardgame: data.winsBoardgame || 0,
        winsDuel: data.winsDuel || data.duelWins || 0,
        winsCasino: data.winsCasino || 0,
        gamesPlayed: data.gamesPlayed || data.duelPlayed || 0,
        updatedAt: data.updatedAt,
      });
    }

    return results;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/**
 * Resets the global leaderboard entries from Firestore.
 * Deletes any existing entries and re-synchronizes the individual sub-profiles.
 */
export async function resetGlobalLeaderboard(activeProfiles?: Profile[]): Promise<void> {
  const path = 'leaderboards';
  try {
    const q = query(collection(db, 'leaderboards'), limit(300));
    const querySnapshot = await getDocs(q);
    const currentUid = auth.currentUser?.uid;
    const isAdmin = auth.currentUser?.email === 'antoniu.andrei.radu@gmail.com';

    // Delete all eligible entries (user's own or all if admin/owner)
    const deletePromises: Promise<void>[] = [];
    querySnapshot.forEach((d) => {
      const data = d.data();
      if (isAdmin || !currentUid || data.userId === currentUid || d.id === currentUid) {
        deletePromises.push(deleteDoc(doc(db, 'leaderboards', d.id)));
      }
    });

    await Promise.allSettled(deletePromises);

    // If active profiles are passed, re-sync them as fresh individual subprofiles
    if (activeProfiles && activeProfiles.length > 0 && currentUid) {
      await syncAccountProfilesToCloud(activeProfiles);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function recordDuelMatchHistory(match: Omit<CloudDuelHistory, 'creatorUid' | 'createdAt'>): Promise<void> {
  if (!auth.currentUser) return;
  const path = `duel_histories/${match.matchId}`;

  try {
    await setDoc(doc(db, 'duel_histories', match.matchId), {
      ...match,
      creatorUid: auth.currentUser.uid,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function fetchRecentDuelHistories(): Promise<CloudDuelHistory[]> {
  const path = 'duel_histories';
  try {
    const q = query(collection(db, 'duel_histories'), limit(20));
    const querySnapshot = await getDocs(q);
    const results: CloudDuelHistory[] = [];
    querySnapshot.forEach((d) => {
      results.push(d.data() as CloudDuelHistory);
    });
    return results;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}
