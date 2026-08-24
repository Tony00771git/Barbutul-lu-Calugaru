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
} from '../types';

/**
 * Deterministically generates or formats a unique player Short ID (e.g. M7F9A2).
 */
export function generateShortId(uid: string): string {
  const clean = uid.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (clean.length >= 6) {
    return `M${clean.slice(-5)}`;
  }
  return `MK${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
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
  currentTitle_en: string = 'Pilgrim Brother'
): Promise<UserFriendProfile | null> {
  if (!auth.currentUser || auth.currentUser.uid !== uid) {
    return null;
  }

  const shortId = generateShortId(uid);
  const profileDocRef = doc(db, 'public_profiles', shortId);

  try {
    const snap = await getDoc(profileDocRef);
    const profileData: UserFriendProfile = {
      uid,
      shortId,
      displayName: displayName || auth.currentUser.displayName || 'Călugăr Pelerin',
      avatarIcon: avatarIcon || 'monk_drunk',
      email: auth.currentUser.email || '',
      currentLevel: Math.max(1, currentLevel || 1),
      currentTitle_ro: currentTitle_ro || 'Frate Pelerin',
      currentTitle_en: currentTitle_en || 'Pilgrim Brother',
      updatedAt: serverTimestamp(),
    };

    if (!snap.exists() || snap.data()?.uid === uid) {
      await setDoc(profileDocRef, profileData, { merge: true });
    }

    return profileData;
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
        uid: data.uid,
        shortId: data.shortId || cleanId,
        displayName: data.displayName || 'Călugăr Pelerin',
        avatarIcon: data.avatarIcon || 'monk_drunk',
        currentLevel: data.currentLevel || 1,
        currentTitle_ro: data.currentTitle_ro || 'Frate Pelerin',
        currentTitle_en: data.currentTitle_en || 'Pilgrim Brother',
      };
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
    // 1. Mark request as accepted
    if (request.id) {
      await updateDoc(doc(db, 'friend_requests', request.id), {
        status: 'accepted',
        updatedAt: serverTimestamp(),
      });
    }

    // 2. Add to current user's friends subcollection
    const friendDocRef = doc(db, 'users', myProfile.uid, 'friends', request.fromUid);
    const friendData: FriendEntry = {
      friendUid: request.fromUid,
      displayName: request.fromName,
      avatarIcon: request.fromAvatar || 'monk_drunk',
      shortId: request.fromShortId || '',
      addedAt: serverTimestamp(),
    };
    await setDoc(friendDocRef, friendData, { merge: true });

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
 * Removes a friend from the user's subcollection.
 */
export async function removeFriend(myUid: string, friendUid: string): Promise<boolean> {
  if (!auth.currentUser || auth.currentUser.uid !== myUid) return false;
  const path = `users/${myUid}/friends/${friendUid}`;
  try {
    await deleteDoc(doc(db, 'users', myUid, 'friends', friendUid));
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    return false;
  }
}

/**
 * Subscribes to the user's friends subcollection.
 */
export function subscribeToFriends(
  myUid: string,
  onUpdate: (friends: FriendEntry[]) => void,
  onError?: (error: any) => void
): () => void {
  if (!myUid) return () => {};

  const colRef = collection(db, 'users', myUid, 'friends');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: FriendEntry[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as FriendEntry);
      });
      onUpdate(list);
    },
    (err) => {
      console.warn('Friends subscription error:', err);
      if (onError) onError(err);
    }
  );
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
