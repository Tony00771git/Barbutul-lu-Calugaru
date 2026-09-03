import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { cleanFirestoreData } from './cleanFirestoreData';
import { getDuelQuestionPool, shuffleDeck } from '../data/duelQuestions';
import {
  DuelDifficulty,
  DuelPlayerInfo,
  DuelQuestion,
  DuelRoomState,
  DuelSubmode,
  TavernEmoteMessage,
} from '../types';

let serverClockOffset = 0;
let isClockSynced = false;

/**
 * Synchronizes client device clock with Firestore server clock.
 * Measures round-trip time and calculates the exact clock offset.
 */
export async function syncServerClock(): Promise<number> {
  try {
    const syncId = `sync_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
    const syncRef = doc(db, 'time_sync', syncId);

    const t0 = Date.now();
    await setDoc(syncRef, {
      clientSendTime: t0,
      serverTimestamp: serverTimestamp(),
    });

    const snap = await getDoc(syncRef);
    const t1 = Date.now();

    if (snap.exists()) {
      const data = snap.data();
      const rawTs = data.serverTimestamp;
      const serverMs =
        typeof rawTs?.toMillis === 'function'
          ? rawTs.toMillis()
          : typeof rawTs?.seconds === 'number'
          ? rawTs.seconds * 1000 + Math.floor((rawTs.nanoseconds || 0) / 1000000)
          : null;

      if (serverMs) {
        const rtt = t1 - t0;
        const estimatedLocalAtServerWrite = t0 + rtt / 2;
        serverClockOffset = serverMs - estimatedLocalAtServerWrite;
        isClockSynced = true;
      }

      // Cleanup calibration document asynchronously
      deleteDoc(syncRef).catch(() => {});
    }
  } catch (e) {
    console.warn('Clock sync warning, using local clock fallback:', e);
  }
  return serverClockOffset;
}

/**
 * Returns current timestamp calibrated against the Firestore server clock.
 */
export function getSyncedServerNow(): number {
  return Date.now() + serverClockOffset;
}

export function getServerClockOffset(): number {
  return serverClockOffset;
}

export function generateRoomCode(): string {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

export function calculateStake(difficulty: DuelDifficulty): { type: 'sips' | 'chug'; count: number } {
  if (difficulty === 'easy') {
    return { type: 'sips', count: Math.floor(Math.random() * 2) + 2 }; // 2-3 sips
  } else if (difficulty === 'medium') {
    const isChug = Math.random() < 0.12; // 12% chance of chug
    return isChug ? { type: 'chug', count: 1 } : { type: 'sips', count: Math.floor(Math.random() * 3) + 3 }; // 3-5 sips
  } else {
    // Hard
    const isChug = Math.random() < 0.3; // 30% chance of chug
    return isChug ? { type: 'chug', count: 1 } : { type: 'sips', count: Math.floor(Math.random() * 4) + 5 }; // 5-8 sips
  }
}

export function sanitizeDuelRoom(rawRoom: any): DuelRoomState | null {
  if (!rawRoom) return null;
  const deck: DuelQuestion[] = rawRoom.deck || [];
  const currentCardIndex: number = rawRoom.currentCardIndex || 0;
  const currentQ = deck.length > 0 ? deck[currentCardIndex % deck.length] : null;

  return {
    code: rawRoom.code,
    submode: rawRoom.submode,
    difficulty: rawRoom.difficulty,
    targetPoints: rawRoom.targetPoints || 30,
    hostPlayer: rawRoom.hostPlayer,
    guestPlayer: rawRoom.guestPlayer || null,
    status: rawRoom.status || 'lobby',
    currentRound: rawRoom.currentRound || 1,
    phase: rawRoom.phase || 'reveal',
    revealEndsAt: rawRoom.revealEndsAt || 0,
    lockedOutPlayerId: rawRoom.lockedOutPlayerId || null,
    answeredBy: rawRoom.answeredBy || null,
    roundResult: rawRoom.roundResult || null,
    scores: rawRoom.scores || {},
    stake: rawRoom.stake || { type: 'sips', count: 2 },
    lastEmote: rawRoom.lastEmote || null,
    currentQuestion: currentQ
      ? {
          id: currentQ.id,
          q_ro: currentQ.q_ro,
          q_en: currentQ.q_en,
          a_ro: currentQ.a_ro,
          a_en: currentQ.a_en,
          correct: rawRoom.phase === 'resolution' ? currentQ.correct : undefined,
        }
      : null,
  };
}

export async function createDuelRoom(
  hostPlayer: { id: string; name: string; avatarIcon: string; color: string },
  submode: DuelSubmode,
  difficulty: DuelDifficulty,
  targetPoints: number = 30
): Promise<string> {
  if (!isClockSynced) {
    await syncServerClock();
  }

  const code = generateRoomCode();
  const deck = shuffleDeck(getDuelQuestionPool(submode, difficulty));
  const stake = calculateStake(difficulty);

  const host: DuelPlayerInfo = {
    id: hostPlayer.id,
    name: hostPlayer.name || 'Jucător 1',
    avatarIcon: hostPlayer.avatarIcon || 'monk_drunk',
    color: hostPlayer.color || '#e8c84a',
    isHost: true,
    connected: true,
  };

  const initialScores = {
    [host.id]: { sipsTotal: 0, chugsTotal: 0, roundsWon: 0, correct: 0, wrong: 0 },
  };

  const roomData = {
    code,
    submode,
    difficulty,
    targetPoints: Number(targetPoints) > 0 ? Number(targetPoints) : 30,
    hostPlayer: host,
    guestPlayer: null,
    status: 'lobby',
    currentRound: 1,
    currentCardIndex: 0,
    deck,
    stake,
    phase: 'reveal',
    revealEndsAt: 0,
    lockedOutPlayerId: null,
    answeredBy: null,
    roundResult: null,
    scores: initialScores,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const path = `duel_rooms/${code}`;
  try {
    await setDoc(doc(db, 'duel_rooms', code), cleanFirestoreData(roomData));
    return code;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
    throw err;
  }
}

export async function joinDuelRoom(
  roomCode: string,
  guestPlayer: { id: string; name: string; avatarIcon: string; color: string }
): Promise<void> {
  if (!isClockSynced) {
    await syncServerClock();
  }

  const formattedCode = roomCode.toUpperCase().trim();
  const path = `duel_rooms/${formattedCode}`;

  try {
    const roomRef = doc(db, 'duel_rooms', formattedCode);
    const snap = await getDoc(roomRef);

    if (!snap.exists()) {
      throw new Error('Camera nu a fost găsită (Cod invalid)!');
    }

    const data = snap.data();
    if (data.guestPlayer && data.guestPlayer.id !== guestPlayer.id && data.status !== 'lobby') {
      throw new Error('Camera este deja plină cu 2 jucători!');
    }

    const guest: DuelPlayerInfo = {
      id: guestPlayer.id,
      name: guestPlayer.name || 'Jucător 2',
      avatarIcon: guestPlayer.avatarIcon || 'knight',
      color: guestPlayer.color || '#e05c3a',
      isHost: false,
      connected: true,
    };

    const scores = { ...(data.scores || {}) };
    if (!scores[guest.id]) {
      scores[guest.id] = { sipsTotal: 0, chugsTotal: 0, roundsWon: 0, correct: 0, wrong: 0 };
    }

    await updateDoc(roomRef, {
      guestPlayer: guest,
      scores,
      updatedAt: Date.now(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function addBotToDuelRoom(roomCode: string): Promise<void> {
  const formattedCode = roomCode.toUpperCase().trim();
  const path = `duel_rooms/${formattedCode}`;

  try {
    const roomRef = doc(db, 'duel_rooms', formattedCode);
    const snap = await getDoc(roomRef);
    if (!snap.exists()) return;

    const data = snap.data();
    if (data.status !== 'lobby') return;

    const botGuest: DuelPlayerInfo = {
      id: 'bot_onufrie',
      name: 'Călugărul Onufrie (AI)',
      avatarIcon: 'monk_drunk',
      color: '#e05c3a',
      isHost: false,
      connected: true,
    };

    const scores = { ...(data.scores || {}) };
    scores[botGuest.id] = { sipsTotal: 0, chugsTotal: 0, roundsWon: 0, correct: 0, wrong: 0 };

    await updateDoc(roomRef, {
      guestPlayer: botGuest,
      scores,
      updatedAt: Date.now(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function startDuelGame(roomCode: string, playerId: string): Promise<void> {
  if (!isClockSynced) {
    await syncServerClock();
  }

  const formattedCode = roomCode.toUpperCase().trim();
  const path = `duel_rooms/${formattedCode}`;

  try {
    const roomRef = doc(db, 'duel_rooms', formattedCode);
    const snap = await getDoc(roomRef);
    if (!snap.exists()) return;

    const data = snap.data();
    if (data.hostPlayer?.id !== playerId) return;
    if (!data.guestPlayer) {
      throw new Error('Așteaptă să intre al doilea jucător!');
    }

    const stake = calculateStake(data.difficulty || 'easy');
    // Synchronized absolute server target timestamp for option reveal (5 seconds countdown)
    const revealEndsAt = getSyncedServerNow() + 5000;

    await updateDoc(roomRef, {
      status: 'in_game',
      currentRound: 1,
      currentCardIndex: 0,
      phase: 'reveal',
      revealEndsAt,
      lockedOutPlayerId: null,
      answeredBy: null,
      roundResult: null,
      stake,
      updatedAt: Date.now(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function skipDuelReveal(roomCode: string): Promise<void> {
  const formattedCode = roomCode.toUpperCase().trim();
  const path = `duel_rooms/${formattedCode}`;

  try {
    const roomRef = doc(db, 'duel_rooms', formattedCode);
    await updateDoc(roomRef, {
      phase: 'race',
      updatedAt: Date.now(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

/**
 * Submits player answer using an atomic Firestore transaction.
 * Resolves race conditions on the server rather than trusting client-side timestamps.
 */
export async function submitDuelAnswer(
  roomCode: string,
  playerId: string,
  optionIndex: number
): Promise<void> {
  const formattedCode = roomCode.toUpperCase().trim();
  const path = `duel_rooms/${formattedCode}`;

  try {
    const roomRef = doc(db, 'duel_rooms', formattedCode);

    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(roomRef);
      if (!snap.exists()) return;

      const data = snap.data();
      // Only process if active game and not yet resolved
      if (data.status !== 'in_game' || data.phase === 'resolution') return;

      // Check if reveal countdown has elapsed or phase is race
      const currentServerNow = getSyncedServerNow();
      const isRevealed =
        data.phase === 'race' ||
        (data.phase === 'reveal' && currentServerNow >= (data.revealEndsAt || 0));

      if (!isRevealed) return;

      // If this player is locked out from a previous wrong attempt in this round, ignore
      if (data.lockedOutPlayerId === playerId) return;

      // If an answer has already been claimed and locked atomically, reject further submissions
      if (data.answeredBy) return;

      const deck: DuelQuestion[] = data.deck || [];
      const currentCardIndex: number = data.currentCardIndex || 0;
      const currentQ = deck[currentCardIndex % deck.length];
      if (!currentQ) return;

      const isCorrect = optionIndex === currentQ.correct;
      const otherPlayerId =
        data.hostPlayer.id === playerId ? data.guestPlayer?.id : data.hostPlayer.id;

      const scores = { ...(data.scores || {}) };
      if (!scores[playerId]) {
        scores[playerId] = { sipsTotal: 0, chugsTotal: 0, roundsWon: 0, correct: 0, wrong: 0 };
      }
      if (otherPlayerId && !scores[otherPlayerId]) {
        scores[otherPlayerId] = { sipsTotal: 0, chugsTotal: 0, roundsWon: 0, correct: 0, wrong: 0 };
      }

      const stake = data.stake || { type: 'sips', count: 2 };
      const targetPoints = data.targetPoints || 30;

      if (isCorrect) {
        // CORRECT ANSWER: Atomically claim answeredBy and transition round to resolution
        const winnerId = playerId;
        const loserId = otherPlayerId || '';

        scores[winnerId].roundsWon += 1;
        scores[winnerId].correct += 1;

        if (loserId && scores[loserId]) {
          if (stake.type === 'sips') {
            scores[loserId].sipsTotal += stake.count;
          } else {
            scores[loserId].chugsTotal += 1;
          }
        }

        const hostPts =
          (scores[data.hostPlayer.id]?.sipsTotal || 0) +
          25 * (scores[data.hostPlayer.id]?.chugsTotal || 0);
        const guestPts = data.guestPlayer
          ? (scores[data.guestPlayer.id]?.sipsTotal || 0) +
            25 * (scores[data.guestPlayer.id]?.chugsTotal || 0)
          : 0;

        const isTargetReached = hostPts >= targetPoints || guestPts >= targetPoints;
        const targetLoserId =
          hostPts >= targetPoints
            ? data.hostPlayer.id
            : guestPts >= targetPoints && data.guestPlayer
            ? data.guestPlayer.id
            : null;

        const roundResult = {
          winnerId,
          loserIds: loserId ? [loserId] : [],
          stakeType: stake.type,
          stakeAmount: stake.count,
          correctAnswerRo: currentQ.a_ro[currentQ.correct],
          correctAnswerEn: currentQ.a_en[currentQ.correct],
          reason: data.lockedOutPlayerId ? 'rebound_correct' : 'first_correct',
          drinkCountdownEndsAt: null,
          isTargetReached,
          targetLoserId,
        };

        transaction.update(roomRef, {
          answeredBy: playerId,
          phase: 'resolution',
          scores,
          roundResult,
          updatedAt: Date.now(),
        });
      } else {
        // WRONG ANSWER
        scores[playerId].wrong += 1;

        if (!data.lockedOutPlayerId) {
          // First player wrong -> atomically lock out this player and give opponent rebound opportunity
          transaction.update(roomRef, {
            lockedOutPlayerId: playerId,
            scores,
            updatedAt: Date.now(),
          });
        } else {
          // Second player also answered wrong -> both players wrong!
          const loserIds = [data.hostPlayer.id, data.guestPlayer?.id].filter(Boolean) as string[];

          loserIds.forEach((pId) => {
            if (scores[pId]) {
              if (stake.type === 'sips') {
                scores[pId].sipsTotal += stake.count;
              } else {
                scores[pId].chugsTotal += 1;
              }
            }
          });

          const hostPts =
            (scores[data.hostPlayer.id]?.sipsTotal || 0) +
            25 * (scores[data.hostPlayer.id]?.chugsTotal || 0);
          const guestPts = data.guestPlayer
            ? (scores[data.guestPlayer.id]?.sipsTotal || 0) +
              25 * (scores[data.guestPlayer.id]?.chugsTotal || 0)
            : 0;

          const isTargetReached = hostPts >= targetPoints || guestPts >= targetPoints;
          const targetLoserId =
            hostPts >= targetPoints
              ? data.hostPlayer.id
              : guestPts >= targetPoints && data.guestPlayer
              ? data.guestPlayer.id
              : null;

          const roundResult = {
            winnerId: null,
            loserIds,
            stakeType: stake.type,
            stakeAmount: stake.count,
            correctAnswerRo: currentQ.a_ro[currentQ.correct],
            correctAnswerEn: currentQ.a_en[currentQ.correct],
            reason: 'both_wrong',
            drinkCountdownEndsAt: null,
            isTargetReached,
            targetLoserId,
          };

          transaction.update(roomRef, {
            answeredBy: null,
            phase: 'resolution',
            scores,
            roundResult,
            updatedAt: Date.now(),
          });
        }
      }
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function startDuelDrinkTimer(roomCode: string): Promise<void> {
  const formattedCode = roomCode.toUpperCase().trim();
  const path = `duel_rooms/${formattedCode}`;

  try {
    const roomRef = doc(db, 'duel_rooms', formattedCode);
    const snap = await getDoc(roomRef);
    if (!snap.exists()) return;

    const data = snap.data();
    if (data.status !== 'in_game' || data.phase !== 'resolution' || !data.roundResult) return;

    const roundResult = {
      ...data.roundResult,
      drinkCountdownEndsAt: Date.now() + 10000,
    };

    await updateDoc(roomRef, {
      roundResult,
      updatedAt: Date.now(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function nextDuelRound(roomCode: string): Promise<void> {
  if (!isClockSynced) {
    await syncServerClock();
  }

  const formattedCode = roomCode.toUpperCase().trim();
  const path = `duel_rooms/${formattedCode}`;

  try {
    const roomRef = doc(db, 'duel_rooms', formattedCode);
    const snap = await getDoc(roomRef);
    if (!snap.exists()) return;

    const data = snap.data();
    if (data.status !== 'in_game') return;

    const stake = calculateStake(data.difficulty || 'easy');
    // Synchronized absolute server target timestamp for option reveal
    const revealEndsAt = getSyncedServerNow() + 5000;

    await updateDoc(roomRef, {
      currentRound: (data.currentRound || 1) + 1,
      currentCardIndex: (data.currentCardIndex || 0) + 1,
      phase: 'reveal',
      revealEndsAt,
      lockedOutPlayerId: null,
      answeredBy: null,
      roundResult: null,
      stake,
      updatedAt: Date.now(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function endDuelGame(roomCode: string): Promise<void> {
  const formattedCode = roomCode.toUpperCase().trim();
  const path = `duel_rooms/${formattedCode}`;

  try {
    const roomRef = doc(db, 'duel_rooms', formattedCode);
    await updateDoc(roomRef, {
      status: 'finished',
      updatedAt: Date.now(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function sendDuelEmote(roomCode: string, emote: TavernEmoteMessage): Promise<void> {
  const formattedCode = roomCode.toUpperCase().trim();
  const path = `duel_rooms/${formattedCode}`;

  try {
    const roomRef = doc(db, 'duel_rooms', formattedCode);
    const cleanEmote = {
      id: emote.id || `em_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      senderId: emote.senderId || 'player',
      senderName: emote.senderName || 'Călugăr',
      senderAvatar: emote.senderAvatar || '🍺',
      emoteKey: emote.emoteKey,
      textRo: emote.textRo || '',
      textEn: emote.textEn || '',
      icon: emote.icon || '🍺',
      timestamp: emote.timestamp || Date.now(),
    };
    await updateDoc(roomRef, {
      lastEmote: cleanEmote,
      updatedAt: Date.now(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export function subscribeToDuelRoom(
  roomCode: string,
  onUpdate: (room: DuelRoomState | null) => void,
  onError: (error: Error) => void
): () => void {
  const formattedCode = roomCode.toUpperCase().trim();
  const path = `duel_rooms/${formattedCode}`;

  const unsubscribe = onSnapshot(
    doc(db, 'duel_rooms', formattedCode),
    (snapshot) => {
      if (snapshot.exists()) {
        const sanitized = sanitizeDuelRoom(snapshot.data());
        onUpdate(sanitized);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (e: any) {
        onError(e);
      }
    }
  );

  return unsubscribe;
}
