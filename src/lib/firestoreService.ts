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
import { calculateProgression } from './progression';

export interface CloudUserProfile {
  userId: string;
  displayName: string;
  avatarIcon?: string;
  email?: string;
  masterProfile?: Profile;
  subProfiles?: Profile[];
  profiles?: Profile[];
  drunkenCoins?: number;
  gamesPlayed: number;
  totalSips: number;
  totalChugs: number;
  totalXP?: number;
  currentLevel?: number;
  currentTitle_ro?: string;
  currentTitle_en?: string;
  duelWins?: number;
  duelPlayed?: number;
  winsBoardgame?: number;
  winsDuel?: number;
  winsCasino?: number;
  winsPineapple?: number;
  winsCrash?: number;
  gamesPlayedCrash?: number;
  shortId?: string;
  customShortId?: string;
  unlockedAchievements?: string[];
  hasSetMainProfile?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface CloudLeaderboardEntry {
  id?: string;
  userId: string;
  profileId: string;
  isMaster?: boolean;
  accountName?: string;
  displayName: string;
  avatarIcon?: string;
  totalSips: number;
  totalChugs: number;
  totalScore: number;
  totalXP?: number;
  drunkenCoins?: number;
  currentLevel?: number;
  currentTitle_ro?: string;
  currentTitle_en?: string;
  winsBoardgame: number;
  winsDuel: number;
  winsCasino: number;
  winsPineapple?: number;
  winsCrash?: number;
  gamesPlayedCrash?: number;
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

function cleanForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as any;
  }
  if (Array.isArray(data)) {
    return data.map(item => cleanForFirestore(item)) as any;
  }
  if (typeof data === 'object') {
    // Keep Firestore FieldValue / Timestamp / Date intact
    if (
      typeof (data as any)?.toMillis === 'function' ||
      (data as any)?._methodName !== undefined ||
      data instanceof Date
    ) {
      return data;
    }
    const res: any = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        res[key] = cleanForFirestore(value);
      }
    }
    return res;
  }
  return data;
}

export async function syncAccountProfilesToCloud(profiles: Profile[], drunkenCoins: number = 100): Promise<void> {
  if (!auth.currentUser) return;
  const userId = auth.currentUser.uid;
  const accountName = auth.currentUser.displayName || auth.currentUser.email || 'Călugăr Google';
  const path = `users/${userId}`;

  try {
    const existing = await getDoc(doc(db, 'users', userId));
    const now = serverTimestamp();

    const rawList = Array.isArray(profiles) ? profiles.filter(Boolean) : [];
    let activeProfilesList = [...rawList];

    if (activeProfilesList.length === 0) {
      const defaultProg = calculateProgression(0);
      activeProfilesList = [
        {
          id: `master_${userId.substring(0, 8)}`,
          name: accountName,
          avatarIcon: 'monk_master',
          isMaster: true,
          gamesPlayed: 0,
          totalSips: 0,
          totalChugs: 0,
          totalXP: 0,
          currentLevel: 1,
          currentTitle_ro: defaultProg.titleRo,
          currentTitle_en: defaultProg.titleEn,
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
        },
      ];
    }

    // Determine Master Profile vs Sub-Profiles
    const master = activeProfilesList.find(p => p && p.isMaster) || activeProfilesList[0];
    const masterId = master ? master.id : `master_${userId.substring(0, 8)}`;

    const sanitizedProfiles: Profile[] = activeProfilesList.map(p => {
      const isMaster = p.id === masterId || p.isMaster === true;
      const prog = calculateProgression(p.totalXP || 0);
      return {
        id: p.id || `profile_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: (p.name || 'Călugăr').substring(0, 50),
        avatarIcon: (p.avatarIcon || (isMaster ? 'monk_master' : 'monk_drunk')).substring(0, 50000),
        isMaster,
        gamesPlayed: Math.max(0, p.gamesPlayed || 0),
        totalSips: Math.max(0, p.totalSips || 0),
        totalChugs: Math.max(0, p.totalChugs || 0),
        totalXP: Math.max(0, p.totalXP || 0),
        currentLevel: p.currentLevel || prog.currentLevel,
        currentTitle_ro: p.currentTitle_ro || prog.titleRo,
        currentTitle_en: p.currentTitle_en || prog.titleEn,
        winsBoardgame: Math.max(0, p.winsBoardgame || 0),
        winsDuel: Math.max(0, p.winsDuel || 0),
        winsCasino: Math.max(0, p.winsCasino || 0),
        winsPineapple: Math.max(0, p.winsPineapple || 0),
        winsCrash: Math.max(0, p.winsCrash || 0),
        gamesPlayedCrash: Math.max(0, p.gamesPlayedCrash || 0),
        sipsDrunkCrash: Math.max(0, p.sipsDrunkCrash || 0),
        totalPineapplePoints: Math.max(0, p.totalPineapplePoints || 0),
        unlockedAchievements: (p.unlockedAchievements || []).slice(0, 80),
        createdAt: p.createdAt || Date.now(),
      };
    });

    const sanitizedMaster: Profile = sanitizedProfiles.find(p => p.isMaster) || sanitizedProfiles[0];
    const sanitizedSubProfiles = sanitizedProfiles.filter(p => !p.isMaster && p.id !== sanitizedMaster.id);

    const totalLocalSips = sanitizedProfiles.reduce((s, p) => s + (p.totalSips || 0), 0);
    const totalLocalChugs = sanitizedProfiles.reduce((s, p) => s + (p.totalChugs || 0), 0);
    const totalLocalGames = sanitizedProfiles.reduce((s, p) => s + (p.gamesPlayed || 0), 0);
    const totalLocalXP = sanitizedProfiles.reduce((s, p) => s + (p.totalXP || 0), 0);
    const totalBoardWins = sanitizedProfiles.reduce((s, p) => s + (p.winsBoardgame || 0), 0);
    const totalDuelWins = sanitizedProfiles.reduce((s, p) => s + (p.winsDuel || 0), 0);
    const totalCasinoWins = sanitizedProfiles.reduce((s, p) => s + (p.winsCasino || 0), 0);
    const totalPineappleWins = sanitizedProfiles.reduce((s, p) => s + (p.winsPineapple || 0), 0);
    const totalCrashWins = sanitizedProfiles.reduce((s, p) => s + (p.winsCrash || 0), 0);

    const mergedAchievements = Array.from(
      new Set(sanitizedProfiles.flatMap(p => p.unlockedAchievements || []))
    ).slice(0, 80);

    const masterProg = calculateProgression(sanitizedMaster ? (sanitizedMaster.totalXP || totalLocalXP) : totalLocalXP);

    const userDocData: CloudUserProfile = {
      userId,
      displayName: ((sanitizedMaster && sanitizedMaster.name) || accountName).substring(0, 100),
      avatarIcon: ((sanitizedMaster && sanitizedMaster.avatarIcon) || 'monk_drunk').substring(0, 50000),
      email: auth.currentUser.email ? auth.currentUser.email.substring(0, 256) : '',
      masterProfile: sanitizedMaster,
      subProfiles: sanitizedSubProfiles,
      profiles: sanitizedProfiles,
      drunkenCoins: Math.max(0, drunkenCoins),
      gamesPlayed: totalLocalGames,
      totalSips: totalLocalSips,
      totalChugs: totalLocalChugs,
      totalXP: totalLocalXP,
      currentLevel: sanitizedMaster?.currentLevel || masterProg.currentLevel,
      currentTitle_ro: sanitizedMaster?.currentTitle_ro || masterProg.titleRo,
      currentTitle_en: sanitizedMaster?.currentTitle_en || masterProg.titleEn,
      duelWins: totalDuelWins,
      duelPlayed: totalDuelWins,
      winsBoardgame: totalBoardWins,
      winsDuel: totalDuelWins,
      winsCasino: totalCasinoWins,
      winsPineapple: totalPineappleWins,
      winsCrash: totalCrashWins,
      unlockedAchievements: mergedAchievements,
      hasSetMainProfile: existing.exists() ? (existing.data()?.hasSetMainProfile ?? false) : false,
      createdAt: (existing.exists() && existing.data()?.createdAt?.nanoseconds !== undefined) ? existing.data()?.createdAt : now,
      updatedAt: now,
    };

    // Save to private user account document
    await setDoc(doc(db, 'users', userId), cleanForFirestore(userDocData), { merge: true });

    // Sync each profile (Master and Sub-Profiles) as distinct entries on the global leaderboard
    const currentValidEntryIds = new Set<string>();

    for (const p of sanitizedProfiles) {
      const entryId = `${userId}_${sanitizeId(p.id)}`;
      currentValidEntryIds.add(entryId);
      const totalScore = p.totalSips + 25 * p.totalChugs;
      const prog = calculateProgression(p.totalXP || 0);

      const leaderboardData: CloudLeaderboardEntry = {
        userId,
        profileId: p.id,
        isMaster: p.isMaster === true,
        accountName: accountName.substring(0, 100),
        displayName: p.name.substring(0, 100),
        avatarIcon: p.avatarIcon || 'monk_drunk',
        totalSips: p.totalSips,
        totalChugs: p.totalChugs,
        totalScore,
        totalXP: p.totalXP || 0,
        drunkenCoins: p.isMaster ? Math.max(0, drunkenCoins) : 0,
        currentLevel: p.currentLevel || prog.currentLevel,
        currentTitle_ro: p.currentTitle_ro || prog.titleRo,
        currentTitle_en: p.currentTitle_en || prog.titleEn,
        winsBoardgame: p.winsBoardgame || 0,
        winsDuel: p.winsDuel || 0,
        winsCasino: p.winsCasino || 0,
        winsPineapple: p.winsPineapple || 0,
        winsCrash: p.winsCrash || 0,
        gamesPlayedCrash: p.gamesPlayedCrash || 0,
        gamesPlayed: p.gamesPlayed || 0,
        updatedAt: now,
      };

      await setDoc(doc(db, 'leaderboards', entryId), cleanForFirestore(leaderboardData), { merge: true });
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
    const existingData = existing.exists() ? existing.data() : {};

    const dataToSave = {
      userId,
      displayName: (profile.displayName || existingData?.displayName || auth.currentUser.displayName || 'Călugăr Google').substring(0, 100),
      avatarIcon: (profile.avatarIcon || existingData?.avatarIcon || 'monk_drunk').substring(0, 50000),
      email: auth.currentUser.email ? auth.currentUser.email.substring(0, 256) : '',
      masterProfile: profile.masterProfile || existingData?.masterProfile || null,
      subProfiles: profile.subProfiles || existingData?.subProfiles || [],
      profiles: profile.profiles || existingData?.profiles || [],
      drunkenCoins: profile.drunkenCoins ?? existingData?.drunkenCoins ?? 100,
      hasSetMainProfile: profile.hasSetMainProfile ?? existingData?.hasSetMainProfile ?? false,
      gamesPlayed: Math.max(0, profile.gamesPlayed ?? existingData?.gamesPlayed ?? 0),
      totalSips: Math.max(0, profile.totalSips ?? existingData?.totalSips ?? 0),
      totalChugs: Math.max(0, profile.totalChugs ?? existingData?.totalChugs ?? 0),
      totalXP: Math.max(0, profile.totalXP ?? existingData?.totalXP ?? 0),
      currentLevel: profile.currentLevel ?? existingData?.currentLevel ?? 1,
      currentTitle_ro: profile.currentTitle_ro || existingData?.currentTitle_ro || 'Ucenic de Tavernă',
      currentTitle_en: profile.currentTitle_en || existingData?.currentTitle_en || 'Tavern Apprentice',
      duelWins: Math.max(0, profile.duelWins ?? existingData?.duelWins ?? 0),
      duelPlayed: Math.max(0, profile.duelPlayed ?? existingData?.duelPlayed ?? 0),
      winsBoardgame: Math.max(0, profile.winsBoardgame ?? existingData?.winsBoardgame ?? 0),
      winsDuel: Math.max(0, profile.winsDuel ?? existingData?.winsDuel ?? 0),
      winsCasino: Math.max(0, profile.winsCasino ?? existingData?.winsCasino ?? 0),
      winsPineapple: Math.max(0, profile.winsPineapple ?? existingData?.winsPineapple ?? 0),
      winsCrash: Math.max(0, profile.winsCrash ?? existingData?.winsCrash ?? 0),
      gamesPlayedCrash: Math.max(0, profile.gamesPlayedCrash ?? existingData?.gamesPlayedCrash ?? 0),
      unlockedAchievements: (profile.unlockedAchievements || existingData?.unlockedAchievements || []).slice(0, 80),
      createdAt: (existing.exists() && existing.data()?.createdAt?.nanoseconds !== undefined) ? existing.data()?.createdAt : now,
      updatedAt: now,
    };

    await setDoc(doc(db, 'users', userId), cleanForFirestore(dataToSave), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Fetches the global leaderboard.
 * Returns individual profiles (Master and Sub-Profiles) with their ranking statistics.
 */
export async function fetchGlobalLeaderboard(): Promise<CloudLeaderboardEntry[]> {
  const path = 'leaderboards';
  try {
    const q = query(collection(db, 'leaderboards'), limit(300));
    const querySnapshot = await getDocs(q);
    const results: CloudLeaderboardEntry[] = [];
    const currentUid = auth.currentUser?.uid;

    for (const d of querySnapshot.docs) {
      const data = d.data();
      const docId = d.id;
      const entryUserId = data.userId || '';
      const profileId = data.profileId || '';

      // Clean up legacy aggregate documents if found
      const isOldAggregateWithoutProfileId = docId === entryUserId && !profileId;
      if (isOldAggregateWithoutProfileId) {
        if (currentUid && (entryUserId === currentUid || auth.currentUser?.email === 'antoniu.andrei.radu@gmail.com')) {
          deleteDoc(doc(db, 'leaderboards', docId)).catch(() => {});
        }
        continue;
      }

      const sips = data.totalSips || 0;
      const chugs = data.totalChugs || 0;
      const rawXp = typeof data.totalXP === 'number' ? data.totalXP : 0;
      const prog = calculateProgression(rawXp);

      results.push({
        id: docId,
        userId: entryUserId,
        profileId: profileId || docId,
        isMaster: data.isMaster === true,
        accountName: data.accountName || '',
        displayName: data.displayName || 'Călugăr Anonim',
        avatarIcon: data.avatarIcon || 'monk_drunk',
        totalSips: sips,
        totalChugs: chugs,
        totalScore: typeof data.totalScore === 'number' ? data.totalScore : sips + 25 * chugs,
        totalXP: rawXp,
        drunkenCoins: data.drunkenCoins,
        currentLevel: data.currentLevel || prog.currentLevel,
        currentTitle_ro: data.currentTitle_ro || prog.titleRo,
        currentTitle_en: data.currentTitle_en || prog.titleEn,
        winsBoardgame: data.winsBoardgame || 0,
        winsDuel: data.winsDuel || data.duelWins || 0,
        winsCasino: data.winsCasino || 0,
        winsPineapple: data.winsPineapple || 0,
        winsCrash: data.winsCrash || 0,
        gamesPlayedCrash: data.gamesPlayedCrash || 0,
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
 * Deletes all leaderboard documents across the tavern (admin/owner) and re-syncs active profiles.
 */
export async function resetGlobalLeaderboard(activeProfiles?: Profile[]): Promise<void> {
  const path = 'leaderboards';
  try {
    const q = query(collection(db, 'leaderboards'), limit(500));
    const querySnapshot = await getDocs(q);
    const currentUid = auth.currentUser?.uid;
    const isAdmin = auth.currentUser?.email === 'antoniu.andrei.radu@gmail.com';

    // Delete all eligible entries
    const deletePromises: Promise<void>[] = [];
    querySnapshot.forEach((d) => {
      const data = d.data();
      if (isAdmin || !currentUid || data.userId === currentUid || d.id === currentUid || (currentUid && d.id.startsWith(`${currentUid}_`))) {
        deletePromises.push(deleteDoc(doc(db, 'leaderboards', d.id)));
      }
    });

    await Promise.allSettled(deletePromises);

    // If active profiles are provided, re-sync them cleanly
    if (activeProfiles && activeProfiles.length > 0 && currentUid) {
      await syncAccountProfilesToCloud(activeProfiles, 100);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * COMPLETELY resets user backend profile document (users/{userId}) and associated leaderboard records in Firestore.
 * Leaves 1 clean Master Profile (Level 1, 0 stats, 100 Drunken Coins, 0 subprofiles) and wipes all leaderboard records.
 */
export async function resetAccountCloudDataAndLeaderboard(userId: string, cleanProfiles: Profile[]): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) return;
  const path = `users/${userId}`;

  try {
    const existing = await getDoc(doc(db, 'users', userId));
    const now = serverTimestamp();
    const defaultProg = calculateProgression(0);

    const masterName = (cleanProfiles[0]?.name || auth.currentUser.displayName || 'Starețul Mănăstirii').substring(0, 50);
    const masterAvatar = cleanProfiles[0]?.avatarIcon || 'monk_master';

    const cleanMasterProfile: Profile = {
      id: cleanProfiles[0]?.id || sanitizeId(`master_${userId.substring(0, 8)}`),
      name: masterName,
      avatarIcon: masterAvatar,
      isMaster: true,
      gamesPlayed: 0,
      totalSips: 0,
      totalChugs: 0,
      totalXP: 0,
      currentLevel: 1,
      currentTitle_ro: defaultProg.titleRo,
      currentTitle_en: defaultProg.titleEn,
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

    const userCleanDoc: CloudUserProfile = {
      userId,
      displayName: masterName,
      avatarIcon: masterAvatar,
      email: auth.currentUser.email ? auth.currentUser.email.substring(0, 256) : '',
      masterProfile: cleanMasterProfile,
      subProfiles: [],
      profiles: [cleanMasterProfile],
      drunkenCoins: 100, // Fresh starting treasury
      gamesPlayed: 0,
      totalSips: 0,
      totalChugs: 0,
      totalXP: 0,
      currentLevel: 1,
      currentTitle_ro: defaultProg.titleRo,
      currentTitle_en: defaultProg.titleEn,
      duelWins: 0,
      duelPlayed: 0,
      winsBoardgame: 0,
      winsDuel: 0,
      winsCasino: 0,
      winsPineapple: 0,
      winsCrash: 0,
      unlockedAchievements: [],
      createdAt: (existing.exists() && existing.data()?.createdAt?.nanoseconds !== undefined) ? existing.data()?.createdAt : now,
      updatedAt: now,
    };

    // 1. Overwrite users/{userId}
    await setDoc(doc(db, 'users', userId), cleanForFirestore(userCleanDoc), { merge: true });

    // 2. Query and delete all old leaderboard records for this user
    const q = query(collection(db, 'leaderboards'), limit(300));
    const querySnapshot = await getDocs(q);
    const isAdmin = auth.currentUser.email === 'antoniu.andrei.radu@gmail.com';
    const deletePromises: Promise<void>[] = [];

    querySnapshot.forEach((d) => {
      const data = d.data();
      if (isAdmin || data.userId === userId || d.id === userId || d.id.startsWith(`${userId}_`)) {
        deletePromises.push(deleteDoc(doc(db, 'leaderboards', d.id)));
      }
    });

    await Promise.allSettled(deletePromises);

    // 3. Re-create single clean 0-stat leaderboard document for the Master Profile
    const masterEntryId = `${userId}_${sanitizeId(cleanMasterProfile.id)}`;
    const leaderboardData: CloudLeaderboardEntry = {
      userId,
      profileId: cleanMasterProfile.id,
      isMaster: true,
      accountName: (auth.currentUser.displayName || 'Călugăr Google').substring(0, 100),
      displayName: cleanMasterProfile.name,
      avatarIcon: cleanMasterProfile.avatarIcon || 'monk_master',
      totalSips: 0,
      totalChugs: 0,
      totalScore: 0,
      totalXP: 0,
      drunkenCoins: 100,
      currentLevel: 1,
      currentTitle_ro: defaultProg.titleRo,
      currentTitle_en: defaultProg.titleEn,
      winsBoardgame: 0,
      winsDuel: 0,
      winsCasino: 0,
      winsPineapple: 0,
      winsCrash: 0,
      gamesPlayedCrash: 0,
      gamesPlayed: 0,
      updatedAt: now,
    };

    await setDoc(doc(db, 'leaderboards', masterEntryId), cleanForFirestore(leaderboardData));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function recordDuelMatchHistory(match: Omit<CloudDuelHistory, 'creatorUid' | 'createdAt'>): Promise<void> {
  if (!auth.currentUser) return;
  const path = `duel_histories/${match.matchId}`;

  try {
    await setDoc(doc(db, 'duel_histories', match.matchId), cleanForFirestore({
      ...match,
      creatorUid: auth.currentUser.uid,
      createdAt: serverTimestamp(),
    }));
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
