import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import {
  UserFriendProfile,
  FriendEntry,
  FriendRequest,
  GameInvite,
  ActiveRoomInfo,
} from '../types';

/**
 * Deterministically generates or formats a default unique player Short ID (e.g. M7F9A2).
 */
export function generateShortId(uid: string): string {
  if (!uid) return 'M-DEF1';
  const clean = uid.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (clean.length >= 6) {
    return `M${clean.slice(-5)}`;
  }
  return `MK${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

/**
 * Retrieves the user's active short ID (either their custom set ID or generated default).
 */
export function getUserCurrentShortId(uid: string, customShortId?: string): string {
  if (customShortId && customShortId.trim().length >= 3) {
    return customShortId.trim().toUpperCase().replace(/#/g, '');
  }
  try {
    const saved = localStorage.getItem(`user_custom_short_id_${uid}`);
    if (saved && saved.trim().length >= 3) {
      return saved.trim().toUpperCase().replace(/#/g, '');
    }
  } catch {}
  return generateShortId(uid);
}

/**
 * Validates a custom short ID.
 * Must be 3-20 characters, alphanumeric, hyphens or underscores.
 */
export function validateCustomId(
  rawId: string,
  language: 'ro' | 'en' = 'ro'
): { isValid: boolean; normalized: string; error?: string } {
  const normalized = rawId.trim().toUpperCase().replace(/#/g, '');
  if (!normalized) {
    return {
      isValid: false,
      normalized: '',
      error: language === 'ro' ? 'Te rugăm să introduci un ID.' : 'Please enter an ID.',
    };
  }
  if (normalized.length < 3 || normalized.length > 20) {
    return {
      isValid: false,
      normalized,
      error:
        language === 'ro'
          ? 'ID-ul trebuie să aibă între 3 și 20 de caractere.'
          : 'ID must be between 3 and 20 characters long.',
    };
  }
  if (!/^[A-Z0-9_-]+$/.test(normalized)) {
    return {
      isValid: false,
      normalized,
      error:
        language === 'ro'
          ? 'ID-ul poate conține doar litere (fără diacritice), cifre, cratime (-) sau linii jos (_).'
          : 'ID can only contain letters, numbers, hyphens (-) or underscores (_).',
    };
  }
  return { isValid: true, normalized };
}

/**
 * Checks if a custom short ID is available in Firestore public profiles.
 */
export async function checkCustomIdAvailability(
  rawId: string,
  myUid: string,
  language: 'ro' | 'en' = 'ro'
): Promise<{ available: boolean; normalized: string; message: string }> {
  const validation = validateCustomId(rawId, language);
  if (!validation.isValid) {
    return { available: false, normalized: validation.normalized, message: validation.error! };
  }

  const { normalized } = validation;
  try {
    const docRef = doc(db, 'public_profiles', normalized);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return {
        available: true,
        normalized,
        message: language === 'ro' ? '✅ ID-ul este liber și disponibil!' : '✅ This ID is free and available!',
      };
    }
    const data = snap.data();
    if (data.uid === myUid) {
      return {
        available: true,
        normalized,
        message:
          language === 'ro'
            ? '✅ Acesta este deja ID-ul tău actual.'
            : '✅ This is already your current ID.',
      };
    }
    return {
      available: false,
      normalized,
      message:
        language === 'ro'
          ? '❌ Acest ID este deja folosit de un alt jucător.'
          : '❌ This ID is already claimed by another player.',
    };
  } catch (error) {
    console.warn('Error checking custom ID availability:', error);
    return {
      available: false,
      normalized,
      message:
        language === 'ro'
          ? 'Eroare la verificarea disponibilității ID-ului.'
          : 'Error checking ID availability.',
    };
  }
}

/**
 * Updates the user's custom short ID in Firestore public_profiles, user document, and local cache.
 */
export async function updateUserCustomShortId(
  uid: string,
  newCustomId: string,
  currentProfileData: Partial<UserFriendProfile>,
  language: 'ro' | 'en' = 'ro'
): Promise<{ success: boolean; updatedShortId?: string; error?: string }> {
  if (!auth.currentUser || auth.currentUser.uid !== uid) {
    return {
      success: false,
      error: language === 'ro' ? 'Nu ești autentificat.' : 'Not authenticated.',
    };
  }

  const check = await checkCustomIdAvailability(newCustomId, uid, language);
  if (!check.available) {
    return { success: false, error: check.message };
  }

  const newShortId = check.normalized;
  const oldShortId = currentProfileData.shortId;

  try {
    const newDocRef = doc(db, 'public_profiles', newShortId);
    const payload: UserFriendProfile = {
      uid,
      shortId: newShortId,
      displayName: currentProfileData.displayName || auth.currentUser.displayName || 'Călugăr Pelerin',
      avatarIcon: currentProfileData.avatarIcon || 'monk_drunk',
      currentLevel: currentProfileData.currentLevel || 1,
      currentTitle_ro: currentProfileData.currentTitle_ro || 'Frate Pelerin',
      currentTitle_en: currentProfileData.currentTitle_en || 'Pilgrim Brother',
      activeRoom: currentProfileData.activeRoom || null,
      updatedAt: serverTimestamp(),
    };

    // 1. Create/Update new public profile
    await setDoc(newDocRef, payload, { merge: true });

    // 2. If changing from a different previous shortId, remove the old public profile doc
    if (oldShortId && oldShortId !== newShortId) {
      try {
        const oldDocRef = doc(db, 'public_profiles', oldShortId);
        const oldSnap = await getDoc(oldDocRef);
        if (oldSnap.exists() && oldSnap.data()?.uid === uid) {
          await deleteDoc(oldDocRef);
        }
      } catch (delErr) {
        console.warn('Could not clean up old public profile doc:', delErr);
      }
    }

    // 3. Update in user's root document
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        shortId: newShortId,
        customShortId: newShortId,
        updatedAt: serverTimestamp(),
      });
    } catch (uErr) {
      // If user doc doesn't exist yet or update fails, try merge
      try {
        const userRef = doc(db, 'users', uid);
        await setDoc(
          userRef,
          {
            userId: uid,
            shortId: newShortId,
            customShortId: newShortId,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (mergeErr) {
        console.warn('Could not save customShortId in user doc:', mergeErr);
      }
    }

    // 4. Save to localStorage for instant UI loading
    try {
      localStorage.setItem(`user_custom_short_id_${uid}`, newShortId);
    } catch {}

    return { success: true, updatedShortId: newShortId };
  } catch (err: any) {
    console.error('Error saving custom short ID:', err);
    return {
      success: false,
      error:
        err?.message ||
        (language === 'ro' ? 'Eroare la salvarea noului ID.' : 'Error saving new ID.'),
    };
  }
}

/**
 * Resets the user's short ID back to the automatic generated ID.
 */
export async function resetToAutoGeneratedId(
  uid: string,
  currentProfileData: Partial<UserFriendProfile>,
  language: 'ro' | 'en' = 'ro'
): Promise<{ success: boolean; updatedShortId?: string; error?: string }> {
  const autoId = generateShortId(uid);
  return updateUserCustomShortId(uid, autoId, currentProfileData, language);
}

export const ACTIVE_ROOM_MAX_AGE_MS = 45000; // 45 seconds TTL for active room presence
export const USER_ONLINE_THRESHOLD_MS = 45000; // 45 seconds TTL for active vs stale presence

/**
 * Extracts numeric timestamp in ms from various date/timestamp formats (Firestore Timestamp, number, string, Date).
 */
export function extractTimestampMs(val: any): number | null {
  if (val === undefined || val === null) return null;
  if (typeof val === 'number') {
    return val > 0 ? val : null;
  }
  if (typeof val.toMillis === 'function') {
    return val.toMillis();
  }
  if (typeof val.toDate === 'function') {
    return val.toDate().getTime();
  }
  if (typeof val.seconds === 'number') {
    return val.seconds * 1000;
  }
  if (typeof val === 'string') {
    const parsed = Date.parse(val);
    return !isNaN(parsed) && parsed > 0 ? parsed : null;
  }
  if (val instanceof Date) {
    return val.getTime();
  }
  return null;
}

/**
 * Extracts the most recent 'lastSeen' or 'updatedAt' timestamp from a user/friend profile.
 */
export function getUserLastSeenTimestamp(
  profile?: Partial<UserFriendProfile> | Partial<FriendEntry> | null
): number | null {
  if (!profile) return null;
  // 1. Try explicit lastSeen
  const lastSeenMs = extractTimestampMs(profile.lastSeen);
  if (lastSeenMs !== null && lastSeenMs > 0) return lastSeenMs;

  // 2. Try active room updatedAt ONLY if active room is fresh
  if (profile.activeRoom && isRoomActiveAndFresh(profile.activeRoom)) {
    const roomMs = extractTimestampMs(profile.activeRoom.updatedAt);
    if (roomMs !== null && roomMs > 0) return roomMs;
  }

  // 3. Try profile updatedAt as fallback for relative time display
  const updatedMs = extractTimestampMs(profile.updatedAt);
  if (updatedMs !== null && updatedMs > 0) return updatedMs;

  return null;
}

/**
 * Compares the 'lastSeen' timestamp with current server/client time to determine
 * if the user is truly active (green) or stale/offline (grey).
 */
export function isUserActiveOnline(
  profile?: Partial<UserFriendProfile> | Partial<FriendEntry> | null,
  thresholdMs: number = USER_ONLINE_THRESHOLD_MS
): boolean {
  if (!profile) return false;

  // 1. If in an active, fresh room with verified recent heartbeat, definitely active
  if (isRoomActiveAndFresh(profile.activeRoom)) {
    return true;
  }

  // 2. Check explicit lastSeen timestamp: must be recent within thresholdMs
  const lastSeenMs = extractTimestampMs(profile.lastSeen);
  if (lastSeenMs !== null && lastSeenMs > 0) {
    const diff = Date.now() - lastSeenMs;
    return diff >= -30000 && diff <= thresholdMs;
  }

  // 3. We do NOT mark someone online just because of general updatedAt or addedAt
  return false;
}

/**
 * Returns formatted status metadata and visual styles (green vs grey indicator) for friends.
 */
export function formatLastSeenStatus(
  profile?: Partial<UserFriendProfile> | Partial<FriendEntry> | null,
  language: 'ro' | 'en' = 'ro'
): {
  isOnline: boolean;
  statusText: string;
  timeAgoText: string;
  colorClass: string;
  dotClass: string;
  badgeBgClass: string;
} {
  const isOnline = isUserActiveOnline(profile);
  const timeMs = getUserLastSeenTimestamp(profile);

  // Check if actively in a game/lobby room
  if (profile?.activeRoom && isRoomActiveAndFresh(profile.activeRoom)) {
    const isLobby = profile.activeRoom.status === 'lobby';
    const modeName =
      profile.activeRoom.mode === 'crash'
        ? '🐉 Crash'
        : profile.activeRoom.mode === 'duel'
        ? '⚔️ Duel'
        : profile.activeRoom.mode === 'pineapple'
        ? '🍍 Pineapple'
        : '🎰 Cazino';

    if (isLobby) {
      return {
        isOnline: true,
        statusText: language === 'ro' ? `${modeName} • Lobby Deschis` : `${modeName} • Open Lobby`,
        timeAgoText: language === 'ro' ? 'Lobby' : 'Lobby',
        colorClass: 'text-green-400',
        dotClass: 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]',
        badgeBgClass: 'bg-green-950/60 border-green-700/50 text-green-300',
      };
    } else {
      return {
        isOnline: true,
        statusText: language === 'ro' ? `${modeName} • În Meci` : `${modeName} • In Match`,
        timeAgoText: language === 'ro' ? 'În Meci' : 'In Game',
        colorClass: 'text-amber-400',
        dotClass: 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]',
        badgeBgClass: 'bg-amber-950/50 border-amber-700/40 text-amber-300',
      };
    }
  }

  if (isOnline) {
    return {
      isOnline: true,
      statusText: language === 'ro' ? 'Online acum' : 'Online now',
      timeAgoText: language === 'ro' ? 'Online' : 'Online',
      colorClass: 'text-emerald-400',
      dotClass: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]',
      badgeBgClass: 'bg-emerald-950/40 border-emerald-700/40 text-emerald-300',
    };
  }

  // Stale / Offline
  if (timeMs !== null && timeMs > 0) {
    const now = Date.now();
    const diffMs = Math.max(0, now - timeMs);
    const diffMin = Math.floor(diffMs / 60000);

    let formattedAgo = '';
    if (diffMin < 2) {
      formattedAgo = language === 'ro' ? 'Văzut adineauri' : 'Seen just now';
    } else if (diffMin < 60) {
      formattedAgo = language === 'ro' ? `Văzut acum ${diffMin}m` : `Seen ${diffMin}m ago`;
    } else if (diffMin < 1440) {
      const hours = Math.floor(diffMin / 60);
      formattedAgo = language === 'ro' ? `Văzut acum ${hours}h` : `Seen ${hours}h ago`;
    } else {
      const days = Math.floor(diffMin / 1440);
      formattedAgo = language === 'ro' ? `Văzut acum ${days}z` : `Seen ${days}d ago`;
    }

    return {
      isOnline: false,
      statusText: formattedAgo,
      timeAgoText: formattedAgo,
      colorClass: 'text-gray-400',
      dotClass: 'bg-gray-500 opacity-60',
      badgeBgClass: 'bg-gray-900/50 border-gray-700/30 text-gray-400',
    };
  }

  return {
    isOnline: false,
    statusText: language === 'ro' ? 'Deconectat' : 'Offline',
    timeAgoText: language === 'ro' ? 'Deconectat' : 'Offline',
    colorClass: 'text-gray-500',
    dotClass: 'bg-gray-600 opacity-50',
    badgeBgClass: 'bg-gray-900/40 border-gray-800 text-gray-500',
  };
}

/**
 * Checks if an active room presence object is strictly fresh, valid, and non-expired.
 */
export function isRoomActiveAndFresh(
  activeRoom?: ActiveRoomInfo | null,
  maxAgeMs: number = ACTIVE_ROOM_MAX_AGE_MS
): boolean {
  if (!activeRoom || typeof activeRoom !== 'object') return false;
  if (!activeRoom.roomCode || !activeRoom.mode) return false;
  if (activeRoom.status !== 'lobby' && activeRoom.status !== 'in_game') return false;

  // CRITICAL: An active room MUST have a fresh updatedAt timestamp.
  // If updatedAt is missing or invalid, it is from an older or abandoned session.
  if (activeRoom.updatedAt === undefined || activeRoom.updatedAt === null) {
    return false;
  }

  const timeMs = extractTimestampMs(activeRoom.updatedAt);
  if (timeMs === null || timeMs <= 0) {
    return false;
  }

  const age = Date.now() - timeMs;
  // If older than maxAgeMs (45s) or skewed more than 30s in the future, it is stale
  if (age > maxAgeMs || age < -30000) {
    return false;
  }

  return true;
}

/**
 * Updates the user's presence timestamp in public_profiles.
 */
export async function touchUserPresence(
  uid: string,
  shortId: string
): Promise<void> {
  if (!uid || !shortId || !auth.currentUser || auth.currentUser.uid !== uid) return;
  const profileDocRef = doc(db, 'public_profiles', shortId);
  try {
    await updateDoc(profileDocRef, {
      lastSeen: Date.now(),
      updatedAt: serverTimestamp(),
    });
  } catch {
    try {
      await setDoc(
        profileDocRef,
        {
          uid,
          shortId,
          lastSeen: Date.now(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch {
      // Ignore background presence failures
    }
  }
}

/**
 * Initiates continuous heartbeat for general user presence (online/stale indicator).
 * Sends pulse every 15s and handles window focus / visibility change events.
 */
export function startUserPresenceHeartbeat(
  uid: string,
  shortId: string
): () => void {
  if (!uid || !shortId) return () => {};

  let isStopped = false;
  let lastTouch = 0;

  const pulse = () => {
    if (isStopped) return;
    const now = Date.now();
    // Throttle duplicate pulses within 8 seconds
    if (now - lastTouch < 8000) return;
    lastTouch = now;
    touchUserPresence(uid, shortId).catch(() => {});
  };

  // Immediate initial touch
  pulse();

  // Periodic pulse every 15 seconds (well within 45s online threshold)
  const intervalId = setInterval(pulse, 15000);

  const handleInteraction = () => {
    pulse();
  };

  const handleUnload = () => {
    isStopped = true;
    try {
      const profileDocRef = doc(db, 'public_profiles', shortId);
      updateDoc(profileDocRef, {
        lastSeen: Date.now() - 120000,
        activeRoom: null,
      }).catch(() => {});
    } catch {}
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('focus', handleInteraction);
    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        pulse();
      }
    });
  }

  return () => {
    isStopped = true;
    clearInterval(intervalId);
    if (typeof window !== 'undefined') {
      window.removeEventListener('focus', handleInteraction);
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
    }
  };
}

/**
 * Sets or clears the user's active room in their public profile with an exact client timestamp.
 */
export async function setUserActiveRoom(
  uid: string,
  shortId: string,
  activeRoom: ActiveRoomInfo | null
): Promise<void> {
  if (!uid || !shortId) return;
  const profileDocRef = doc(db, 'public_profiles', shortId);
  const formattedRoom: ActiveRoomInfo | null = activeRoom
    ? {
        ...activeRoom,
        updatedAt: Date.now(),
      }
    : null;

  try {
    await updateDoc(profileDocRef, {
      activeRoom: formattedRoom,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    try {
      await setDoc(
        profileDocRef,
        {
          uid,
          shortId,
          activeRoom: formattedRoom,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (e) {
      console.warn('Could not update active room:', e);
    }
  }
}

/**
 * Initiates a continuous in-game heartbeat that keeps activeRoom.updatedAt fresh every 15 seconds.
 * Registers pagehide/beforeunload listeners to clear activeRoom when the tab or browser is closed.
 * Returns an unregister cleanup function that clears the active room upon exiting the game.
 */
export function startActiveRoomHeartbeat(
  uid: string,
  shortId: string,
  getRoomInfo: () => ActiveRoomInfo | null
): () => void {
  if (!uid || !shortId) return () => {};

  let isStopped = false;

  const sendPulse = () => {
    if (isStopped) return;
    try {
      const info = getRoomInfo();
      if (info && (info.status === 'lobby' || info.status === 'in_game')) {
        setUserActiveRoom(uid, shortId, info).catch(() => {});
      } else {
        setUserActiveRoom(uid, shortId, null).catch(() => {});
      }
    } catch (err) {
      console.warn('Heartbeat pulse error:', err);
    }
  };

  // Immediate pulse
  sendPulse();

  // Periodic pulse every 15 seconds (well within 45s TTL)
  const intervalId = setInterval(sendPulse, 15000);

  const handleUnload = () => {
    if (isStopped) return;
    setUserActiveRoom(uid, shortId, null).catch(() => {});
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);
  }

  return () => {
    isStopped = true;
    clearInterval(intervalId);
    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
    }
    setUserActiveRoom(uid, shortId, null).catch(() => {});
  };
}

/**
 * Ensures the logged in player has a public profile registered by their shortId.
 */
export async function ensureUserPublicProfile(
  uid: string,
  displayName: string,
  avatarIcon: string = 'monk_drunk',
  currentLevel: number = 1,
  currentTitle_ro: string = 'Frate Pelerin',
  currentTitle_en: string = 'Pilgrim Brother',
  customShortId?: string,
  extraStats?: {
    winsBoardgame?: number;
    winsDuel?: number;
    winsCasino?: number;
    winsPineapple?: number;
    winsCrash?: number;
    highestCrashMultiplier?: number;
    highestWinStreak?: number;
    totalDrinksServedToFriends?: number;
    totalSips?: number;
    totalChugs?: number;
    gamesPlayed?: number;
    totalXP?: number;
    showcasedItemIds?: string[];
  }
): Promise<UserFriendProfile | null> {
  if (!auth.currentUser || auth.currentUser.uid !== uid) {
    return null;
  }

  const shortId = getUserCurrentShortId(uid, customShortId);
  const profileDocRef = doc(db, 'public_profiles', shortId);

  try {
    const snap = await getDoc(profileDocRef);
    const profileData: any = {
      uid,
      shortId,
      displayName: displayName || auth.currentUser.displayName || 'Călugăr Pelerin',
      avatarIcon: avatarIcon || 'monk_drunk',
      email: auth.currentUser.email || '',
      currentLevel: Math.max(1, currentLevel || 1),
      currentTitle_ro: currentTitle_ro || 'Frate Pelerin',
      currentTitle_en: currentTitle_en || 'Pilgrim Brother',
      updatedAt: serverTimestamp(),
      ...(extraStats || {}),
    };

    if (!snap.exists() || snap.data()?.uid === uid) {
      await setDoc(profileDocRef, profileData, { merge: true });
    }

    return profileData as UserFriendProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `public_profiles/${shortId}`);
    return null;
  }
}

/**
 * Searches for a player using their Short ID (e.g. M9A3B1).
 */
export async function searchPlayerByShortId(
  searchQuery: string
): Promise<UserFriendProfile | null> {
  const cleanId = searchQuery.trim().toUpperCase().replace(/#/g, '');
  if (!cleanId || cleanId.length < 3) return null;

  const path = `public_profiles/${cleanId}`;
  try {
    const snap = await getDoc(doc(db, 'public_profiles', cleanId));
    if (snap.exists()) {
      const data = snap.data();
      return {
        ...data,
        uid: data.uid,
        shortId: data.shortId || cleanId,
        displayName: data.displayName || 'Călugăr Pelerin',
        avatarIcon: data.avatarIcon || 'monk_drunk',
        currentLevel: data.currentLevel || 1,
        currentTitle_ro: data.currentTitle_ro || 'Frate Pelerin',
        currentTitle_en: data.currentTitle_en || 'Pilgrim Brother',
      } as UserFriendProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

/**
 * Sends a friend request to another player.
 */
export async function sendFriendRequest(
  target: UserFriendProfile,
  sender: {
    uid: string;
    displayName: string;
    avatarIcon?: string;
    shortId?: string;
  }
): Promise<{ success: boolean; message?: string }> {
  if (!auth.currentUser || auth.currentUser.uid !== sender.uid) {
    return { success: false, message: 'Trebuie să fii conectat pentru a trimite cereri.' };
  }

  if (target.uid === sender.uid) {
    return { success: false, message: 'Nu te poți adăuga pe tine însuți ca prieten.' };
  }

  const requestId = `req_${sender.uid.substring(0, 20)}_${target.uid.substring(0, 20)}`;
  const path = `friend_requests/${requestId}`;

  try {
    const requestData: FriendRequest = {
      id: requestId,
      fromUid: sender.uid,
      fromName: sender.displayName || 'Călugăr Pelerin',
      fromAvatar: sender.avatarIcon || 'monk_drunk',
      fromShortId: sender.shortId || generateShortId(sender.uid),
      toUid: target.uid,
      toName: target.displayName || 'Călugăr Pelerin',
      toAvatar: target.avatarIcon || 'monk_drunk',
      toShortId: target.shortId || generateShortId(target.uid),
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'friend_requests', requestId), requestData);
    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return { success: false, message: 'Eroare la trimiterea cererii de prietenie.' };
  }
}

/**
 * Accepts a friend request and saves the friend in the user's private subcollection.
 * Also updates the friend_requests document with the receiver's information so the sender's client
 * can immediately and automatically add the receiver to their friends list in real time.
 */
export async function acceptFriendRequest(
  request: FriendRequest,
  myProfile: {
    uid: string;
    displayName: string;
    avatarIcon?: string;
    shortId?: string;
    currentLevel?: number;
    currentTitle_ro?: string;
  }
): Promise<boolean> {
  if (!auth.currentUser || auth.currentUser.uid !== myProfile.uid) {
    return false;
  }

  try {
    const receiverDisplayName = myProfile.displayName || auth.currentUser.displayName || 'Călugăr Pelerin';
    const receiverAvatar = myProfile.avatarIcon || 'monk_drunk';
    const receiverShortId = myProfile.shortId || generateShortId(myProfile.uid);

    // 1. Mark request as accepted and attach receiver profile info for sender's sync
    if (request.id) {
      await updateDoc(doc(db, 'friend_requests', request.id), {
        status: 'accepted',
        toName: receiverDisplayName,
        toAvatar: receiverAvatar,
        toShortId: receiverShortId,
        updatedAt: serverTimestamp(),
      });
    }

    // 2. Add to current user's (receiver) friends subcollection
    const receiverFriendDocRef = doc(db, 'users', myProfile.uid, 'friends', request.fromUid);
    const friendForReceiver: FriendEntry = {
      friendUid: request.fromUid,
      displayName: request.fromName,
      avatarIcon: request.fromAvatar || 'monk_drunk',
      shortId: request.fromShortId || '',
      addedAt: serverTimestamp(),
    };
    await setDoc(receiverFriendDocRef, friendForReceiver, { merge: true });

    // 3. Immediately add receiver to sender's friends subcollection as well
    try {
      const senderFriendDocRef = doc(db, 'users', request.fromUid, 'friends', myProfile.uid);
      const friendForSender: FriendEntry = {
        friendUid: myProfile.uid,
        displayName: receiverDisplayName,
        avatarIcon: receiverAvatar,
        shortId: receiverShortId,
        addedAt: serverTimestamp(),
      };
      await setDoc(senderFriendDocRef, friendForSender, { merge: true });
    } catch (senderWriteErr) {
      console.warn('Reciprocal friend write to sender failed, fallback listener will handle it:', senderWriteErr);
    }

    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${myProfile.uid}/friends/${request.fromUid}`);
    return false;
  }
}

/**
 * Declines or cancels a friend request.
 */
export async function declineFriendRequest(requestId: string): Promise<boolean> {
  if (!auth.currentUser) return false;
  const path = `friend_requests/${requestId}`;
  try {
    await updateDoc(doc(db, 'friend_requests', requestId), {
      status: 'declined',
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    return false;
  }
}

/**
 * Removes a friend from the user's subcollection and cleans up any friend request records.
 */
export async function removeFriend(myUid: string, friendUid: string): Promise<boolean> {
  if (!auth.currentUser || auth.currentUser.uid !== myUid) return false;
  const path = `users/${myUid}/friends/${friendUid}`;
  try {
    // 1. Delete from my friends subcollection
    await deleteDoc(doc(db, 'users', myUid, 'friends', friendUid));

    // 2. Also try deleting reciprocally
    try {
      await deleteDoc(doc(db, 'users', friendUid, 'friends', myUid));
    } catch {}

    // 3. Delete any friend requests between the two to prevent auto-recreation
    const reqId1 = `req_${myUid.substring(0, 20)}_${friendUid.substring(0, 20)}`;
    const reqId2 = `req_${friendUid.substring(0, 20)}_${myUid.substring(0, 20)}`;

    try {
      await deleteDoc(doc(db, 'friend_requests', reqId1));
    } catch {}
    try {
      await deleteDoc(doc(db, 'friend_requests', reqId2));
    } catch {}

    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    return false;
  }
}

/**
 * Subscribes to the user's friends subcollection and merges live active room data.
 * Also automatically watches outgoing friend requests accepted by friends and synchronizes
 * them into the user's friends subcollection so both users are instantly friends in real time.
 */
export function subscribeToFriends(
  myUid: string,
  onUpdate: (friends: FriendEntry[]) => void,
  onError?: (error: any) => void
): () => void {
  if (!myUid) return () => {};

  const colRef = collection(db, 'users', myUid, 'friends');
  const profileUnsubs: { [key: string]: () => void } = {};
  let currentBaseFriends: FriendEntry[] = [];
  const friendProfileMap: { [shortId: string]: Partial<UserFriendProfile> } = {};

  const emitCombined = () => {
    const combined = currentBaseFriends.map((f) => {
      const extra = f.shortId ? friendProfileMap[f.shortId] : null;
      const rawRoom = extra?.activeRoom || f.activeRoom || null;
      const validRoom = isRoomActiveAndFresh(rawRoom) ? rawRoom : null;
      const rawLastSeen = extra?.lastSeen ?? f.lastSeen ?? extra?.updatedAt ?? f.updatedAt ?? null;
      return {
        ...f,
        displayName: extra?.displayName || f.displayName,
        avatarIcon: extra?.avatarIcon || f.avatarIcon,
        currentLevel: extra?.currentLevel || f.currentLevel,
        currentTitle_ro: extra?.currentTitle_ro || f.currentTitle_ro,
        activeRoom: validRoom,
        lastSeen: rawLastSeen,
        updatedAt: extra?.updatedAt || f.updatedAt || null,
      };
    });
    onUpdate(combined);
  };

  // Periodic ticker to purge expired / stale active room statuses and presence in real-time (every 4s)
  const freshnessTicker = setInterval(() => {
    emitCombined();
  }, 4000);

  // 1. Main listener for user's confirmed friends
  const unsubMain = onSnapshot(
    colRef,
    (snapshot) => {
      const list: FriendEntry[] = [];
      const newShortIds = new Set<string>();

      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as FriendEntry;
        list.push(data);
        if (data.shortId) {
          newShortIds.add(data.shortId);
        }
      });
      currentBaseFriends = list;

      // Clean up old unsubs
      Object.keys(profileUnsubs).forEach((sId) => {
        if (!newShortIds.has(sId)) {
          if (profileUnsubs[sId]) profileUnsubs[sId]();
          delete profileUnsubs[sId];
          delete friendProfileMap[sId];
        }
      });

      // Subscribe to public profiles for activeRoom info
      newShortIds.forEach((sId) => {
        if (!profileUnsubs[sId]) {
          profileUnsubs[sId] = onSnapshot(
            doc(db, 'public_profiles', sId),
            (pSnap) => {
              if (pSnap.exists()) {
                const pData = pSnap.data() as UserFriendProfile;
                const freshRoom = isRoomActiveAndFresh(pData.activeRoom) ? pData.activeRoom : null;
                friendProfileMap[sId] = {
                  displayName: pData.displayName,
                  avatarIcon: pData.avatarIcon,
                  currentLevel: pData.currentLevel,
                  currentTitle_ro: pData.currentTitle_ro,
                  activeRoom: freshRoom,
                  lastSeen: pData.lastSeen || pData.updatedAt || null,
                  updatedAt: pData.updatedAt || null,
                };
              } else {
                delete friendProfileMap[sId];
              }
              emitCombined();
            },
            (err) => {
              console.warn(`Error subscribing to profile ${sId}:`, err);
            }
          );
        }
      });

      emitCombined();
    },
    (err) => {
      console.warn('Friends subscription error:', err);
      if (onError) onError(err);
    }
  );

  // 2. Real-time auto-sync for outgoing friend requests accepted by the other player
  const outgoingAcceptedQuery = query(
    collection(db, 'friend_requests'),
    where('fromUid', '==', myUid),
    where('status', '==', 'accepted')
  );

  const unsubOutgoingAccepted = onSnapshot(
    outgoingAcceptedQuery,
    (snapshot) => {
      snapshot.forEach(async (docSnap) => {
        const reqData = docSnap.data() as FriendRequest;
        if (!reqData.toUid) return;

        // Check if we already have this friend in currentBaseFriends to avoid unnecessary writes
        const alreadyHasFriend = currentBaseFriends.some((f) => f.friendUid === reqData.toUid);
        if (!alreadyHasFriend) {
          try {
            const targetDocRef = doc(db, 'users', myUid, 'friends', reqData.toUid);
            let friendDisplayName = reqData.toName || 'Călugăr Pelerin';
            let friendAvatar = reqData.toAvatar || 'monk_drunk';
            let friendShortId = reqData.toShortId || '';

            // If any details are missing from the request doc, fetch public profile
            if (!reqData.toName || !reqData.toShortId) {
              try {
                const pubSnap = await getDoc(doc(db, 'public_profiles', reqData.toShortId || generateShortId(reqData.toUid)));
                if (pubSnap.exists()) {
                  const pub = pubSnap.data() as UserFriendProfile;
                  friendDisplayName = pub.displayName || friendDisplayName;
                  friendAvatar = pub.avatarIcon || friendAvatar;
                  friendShortId = pub.shortId || friendShortId;
                }
              } catch {}
            }

            const targetFriendData: FriendEntry = {
              friendUid: reqData.toUid,
              displayName: friendDisplayName,
              avatarIcon: friendAvatar,
              shortId: friendShortId,
              addedAt: serverTimestamp(),
            };

            await setDoc(targetDocRef, targetFriendData, { merge: true });
          } catch (syncErr) {
            console.warn('Error auto-syncing accepted friend for sender:', syncErr);
          }
        }
      });
    },
    (err) => {
      console.warn('Outgoing accepted friend requests listener error:', err);
    }
  );

  return () => {
    clearInterval(freshnessTicker);
    unsubMain();
    unsubOutgoingAccepted();
    Object.values(profileUnsubs).forEach((u) => u());
  };
}

/**
 * Subscribes to incoming pending friend requests for the user.
 */
export function subscribeToIncomingFriendRequests(
  myUid: string,
  onUpdate: (requests: FriendRequest[]) => void,
  onError?: (error: any) => void
): () => void {
  if (!myUid) return () => {};

  const q = query(
    collection(db, 'friend_requests'),
    where('toUid', '==', myUid),
    where('status', '==', 'pending')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const list: FriendRequest[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as any) } as FriendRequest);
      });
      onUpdate(list);
    },
    (err) => {
      console.warn('Friend requests subscription error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Subscribes to outgoing friend requests sent by the user to check status.
 */
export function subscribeToSentFriendRequests(
  myUid: string,
  onUpdate: (requests: FriendRequest[]) => void,
  onError?: (error: any) => void
): () => void {
  if (!myUid) return () => {};

  const q = query(
    collection(db, 'friend_requests'),
    where('fromUid', '==', myUid)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const list: FriendRequest[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as any) } as FriendRequest);
      });
      onUpdate(list);
    },
    (err) => {
      console.warn('Sent friend requests subscription error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Global background sync helper to ensure any accepted friend requests
 * sent by the user are immediately synced to users/{myUid}/friends.
 */
export function syncAcceptedFriendships(myUid: string): () => void {
  if (!myUid) return () => {};

  const outgoingAcceptedQuery = query(
    collection(db, 'friend_requests'),
    where('fromUid', '==', myUid),
    where('status', '==', 'accepted')
  );

  return onSnapshot(
    outgoingAcceptedQuery,
    (snapshot) => {
      snapshot.forEach(async (docSnap) => {
        const reqData = docSnap.data() as FriendRequest;
        if (!reqData.toUid) return;

        try {
          const targetDocRef = doc(db, 'users', myUid, 'friends', reqData.toUid);
          const existingSnap = await getDoc(targetDocRef);

          if (!existingSnap.exists()) {
            let friendDisplayName = reqData.toName || 'Călugăr Pelerin';
            let friendAvatar = reqData.toAvatar || 'monk_drunk';
            let friendShortId = reqData.toShortId || '';

            if (!reqData.toName || !reqData.toShortId) {
              try {
                const pubSnap = await getDoc(doc(db, 'public_profiles', reqData.toShortId || generateShortId(reqData.toUid)));
                if (pubSnap.exists()) {
                  const pub = pubSnap.data() as UserFriendProfile;
                  friendDisplayName = pub.displayName || friendDisplayName;
                  friendAvatar = pub.avatarIcon || friendAvatar;
                  friendShortId = pub.shortId || friendShortId;
                }
              } catch {}
            }

            const targetFriendData: FriendEntry = {
              friendUid: reqData.toUid,
              displayName: friendDisplayName,
              avatarIcon: friendAvatar,
              shortId: friendShortId,
              addedAt: serverTimestamp(),
            };

            await setDoc(targetDocRef, targetFriendData, { merge: true });
          }
        } catch (syncErr) {
          console.warn('Background sync error for accepted friend:', syncErr);
        }
      });
    },
    (err) => {
      console.warn('Background sync listener error:', err);
    }
  );
}

/**
 * Sends a direct 1v1 Game Invite (Duel, Pineapple, Crash) to a friend.
 */
export async function sendGameInvite(params: {
  fromUid: string;
  fromName: string;
  fromAvatar?: string;
  toUid: string;
  mode: 'duel' | 'pineapple' | 'crash';
  roomCode: string;
}): Promise<{ success: boolean; inviteId?: string; message?: string }> {
  if (!auth.currentUser || auth.currentUser.uid !== params.fromUid) {
    return { success: false, message: 'Trebuie să fii conectat pentru a trimite invitații.' };
  }

  const inviteId = `inv_${params.fromUid.substring(0, 10)}_${Date.now()}`;
  const path = `game_invites/${inviteId}`;

  try {
    const inviteData: GameInvite = {
      id: inviteId,
      fromUid: params.fromUid,
      fromName: params.fromName || 'Călugăr Pelerin',
      fromAvatar: params.fromAvatar || 'monk_drunk',
      toUid: params.toUid,
      mode: params.mode,
      roomCode: params.roomCode,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'game_invites', inviteId), inviteData);
    return { success: true, inviteId };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return { success: false, message: 'Eroare la trimiterea invitației de joc.' };
  }
}

/**
 * Responds to a game invite (accept or decline).
 */
export async function respondToGameInvite(
  inviteId: string,
  status: 'accepted' | 'declined'
): Promise<boolean> {
  if (!auth.currentUser) return false;
  const path = `game_invites/${inviteId}`;
  try {
    await updateDoc(doc(db, 'game_invites', inviteId), {
      status,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    return false;
  }
}

/**
 * Subscribes to pending incoming game invites for the user.
 */
export function subscribeToIncomingGameInvites(
  myUid: string,
  onUpdate: (invites: GameInvite[]) => void,
  onError?: (error: any) => void
): () => void {
  if (!myUid) return () => {};

  const q = query(
    collection(db, 'game_invites'),
    where('toUid', '==', myUid),
    where('status', '==', 'pending')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const list: GameInvite[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as any) } as GameInvite);
      });
      onUpdate(list);
    },
    (err) => {
      console.warn('Game invites subscription error:', err);
      if (onError) onError(err);
    }
  );
}
