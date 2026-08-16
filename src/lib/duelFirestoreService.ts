import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { getDuelQuestionPool, shuffleDeck } from '../data/duelQuestions';
import {
  DuelDifficulty,
  DuelPlayerInfo,
  DuelQuestion,
  DuelRoomState,
  DuelSubmode,
} from '../types';

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
    roundResult: rawRoom.roundResult || null,
    scores: rawRoom.scores || {},
    stake: rawRoom.stake || { type: 'sips', count: 2 },
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
    roundResult: null,
    scores: initialScores,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const path = `duel_rooms/${code}`;
  try {
    await setDoc(doc(db, 'duel_rooms', code), roomData);
    return code;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function joinDuelRoom(
  roomCode: string,
  guestPlayer: { id: string; name: string; avatarIcon: string; color: string }
): Promise<void> {
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

    await updateDoc(roomRef, {
      status: 'in_game',
      currentRound: 1,
      currentCardIndex: 0,
      phase: 'reveal',
      revealEndsAt: Date.now() + 5000,
      lockedOutPlayerId: null,
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
      if (data.status !== 'in_game' || data.phase !== 'race') return;
      if (data.lockedOutPlayerId === playerId) return;

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
        // Correct answer!
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
          phase: 'resolution',
          scores,
          roundResult,
          updatedAt: Date.now(),
        });
      } else {
        // Wrong answer
        scores[playerId].wrong += 1;

        if (!data.lockedOutPlayerId) {
          // First wrong answer -> lock out
          transaction.update(roomRef, {
            lockedOutPlayerId: playerId,
            scores,
            updatedAt: Date.now(),
          });
        } else {
          // Both wrong!
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
  const formattedCode = roomCode.toUpperCase().trim();
  const path = `duel_rooms/${formattedCode}`;

  try {
    const roomRef = doc(db, 'duel_rooms', formattedCode);
    const snap = await getDoc(roomRef);
    if (!snap.exists()) return;

    const data = snap.data();
    if (data.status !== 'in_game') return;

    const stake = calculateStake(data.difficulty || 'easy');

    await updateDoc(roomRef, {
      currentRound: (data.currentRound || 1) + 1,
      currentCardIndex: (data.currentCardIndex || 0) + 1,
      phase: 'reveal',
      revealEndsAt: Date.now() + 5000,
      lockedOutPlayerId: null,
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
