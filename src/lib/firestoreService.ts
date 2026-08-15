import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';

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
  unlockedAchievements?: string[];
  createdAt?: any;
  updatedAt?: any;
}

export interface CloudLeaderboardEntry {
  userId: string;
  displayName: string;
  avatarIcon?: string;
  totalSips: number;
  totalChugs: number;
  duelWins: number;
  duelPlayed: number;
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

export async function saveUserProfile(profile: Partial<CloudUserProfile>): Promise<void> {
  if (!auth.currentUser) return;
  const userId = auth.currentUser.uid;
  const path = `users/${userId}`;

  try {
    const existing = await getDoc(doc(db, 'users', userId));
    const now = serverTimestamp();

    const dataToSave = {
      userId,
      displayName: (profile.displayName || auth.currentUser.displayName || 'Călugăr Anonim').substring(0, 50),
      avatarIcon: (profile.avatarIcon || 'monk_drunk').substring(0, 64),
      email: auth.currentUser.email ? auth.currentUser.email.substring(0, 256) : '',
      gamesPlayed: Math.max(0, profile.gamesPlayed || 0),
      totalSips: Math.max(0, profile.totalSips || 0),
      totalChugs: Math.max(0, profile.totalChugs || 0),
      duelWins: Math.max(0, profile.duelWins || 0),
      duelPlayed: Math.max(0, profile.duelPlayed || 0),
      unlockedAchievements: (profile.unlockedAchievements || []).slice(0, 50),
      createdAt: existing.exists() ? existing.data()?.createdAt || now : now,
      updatedAt: now,
    };

    await setDoc(doc(db, 'users', userId), dataToSave, { merge: true });

    // Also update public leaderboard
    await setDoc(doc(db, 'leaderboards', userId), {
      userId,
      displayName: dataToSave.displayName,
      avatarIcon: dataToSave.avatarIcon,
      totalSips: dataToSave.totalSips,
      totalChugs: dataToSave.totalChugs,
      duelWins: dataToSave.duelWins,
      duelPlayed: dataToSave.duelPlayed,
      updatedAt: now,
    }, { merge: true });

  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchGlobalLeaderboard(): Promise<CloudLeaderboardEntry[]> {
  const path = 'leaderboards';
  try {
    const q = query(collection(db, 'leaderboards'), orderBy('totalSips', 'desc'), limit(25));
    const querySnapshot = await getDocs(q);
    const results: CloudLeaderboardEntry[] = [];
    querySnapshot.forEach((d) => {
      results.push(d.data() as CloudLeaderboardEntry);
    });
    return results;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
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
    const q = query(collection(db, 'duel_histories'), orderBy('createdAt', 'desc'), limit(15));
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
