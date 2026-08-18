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
import {
  PineappleBoard,
  PineappleHandResult,
  PineappleMatchSettings,
  PineapplePlayerState,
  PineappleRoomState,
  PlayingCard,
} from '../types';
import {
  checkFantasyLandTriggers,
  checkIsFoul,
  createDeck,
  shuffleCards,
} from './pineapplePokerEvaluator';
import { calculatePineappleHandScore } from './pineapplePokerScoring';

export function generateRoomCode(): string {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

export function createEmptyBoard(): PineappleBoard {
  return {
    top: [],
    middle: [],
    bottom: [],
  };
}

/**
 * Creates a new 1v1 Pineapple Poker Room
 */
export async function createPineappleRoom(
  hostPlayer: { id: string; name: string; avatarIcon: string; color: string },
  settings: PineappleMatchSettings
): Promise<string> {
  const code = generateRoomCode();
  const roomRef = doc(db, 'pineapple_rooms', code);

  const initialHostState: PineapplePlayerState = {
    id: hostPlayer.id,
    name: hostPlayer.name,
    avatarIcon: hostPlayer.avatarIcon,
    color: hostPlayer.color,
    isHost: true,
    connected: true,
    board: createEmptyBoard(),
    currentHandCards: [],
    discarded: [],
    inFantasyLand: false,
    qualifiesNextFantasyLand: false,
    sipsAccumulated: 0,
    handLocked: false,
    isReadyNextHand: false,
  };

  const roomState: PineappleRoomState = {
    code,
    hostPlayerId: hostPlayer.id,
    players: [initialHostState],
    settings: {
      sipsPerPoint: settings.sipsPerPoint || 0.5,
      sipsToEndGame: settings.sipsToEndGame || 30,
    },
    status: 'lobby',
    currentHand: 0,
    currentRoundInHand: 0,
    deck: [],
    lastHandResult: null,
    winnerId: null,
    loserId: null,
  };

  await setDoc(roomRef, {
    ...roomState,
    updatedAt: serverTimestamp(),
  });

  return code;
}

/**
 * Joins an existing Pineapple Room
 */
export async function joinPineappleRoom(
  code: string,
  guestPlayer: { id: string; name: string; avatarIcon: string; color: string }
): Promise<{ success: boolean; error?: string }> {
  const cleanCode = code.trim().toUpperCase();
  const roomRef = doc(db, 'pineapple_rooms', cleanCode);

  try {
    return await runTransaction(db, async transaction => {
      const snap = await transaction.get(roomRef);
      if (!snap.exists()) {
        return { success: false, error: 'Chilia / Camera nu a fost găsită!' };
      }

      const data = snap.data() as PineappleRoomState;

      // Check if already in room
      const existingIdx = data.players.findIndex(p => p.id === guestPlayer.id);
      if (existingIdx !== -1) {
        data.players[existingIdx].connected = true;
        data.players[existingIdx].name = guestPlayer.name;
        data.players[existingIdx].avatarIcon = guestPlayer.avatarIcon;
        transaction.update(roomRef, {
          players: data.players,
          updatedAt: serverTimestamp(),
        });
        return { success: true };
      }

      if (data.players.length >= 2) {
        return { success: false, error: 'Chilia este deja plină (maxim 2 călugări)!' };
      }

      const newGuest: PineapplePlayerState = {
        id: guestPlayer.id,
        name: guestPlayer.name,
        avatarIcon: guestPlayer.avatarIcon,
        color: guestPlayer.color,
        isHost: false,
        connected: true,
        board: createEmptyBoard(),
        currentHandCards: [],
        discarded: [],
        inFantasyLand: false,
        qualifiesNextFantasyLand: false,
        sipsAccumulated: 0,
        handLocked: false,
        isReadyNextHand: false,
      };

      data.players.push(newGuest);

      transaction.update(roomRef, {
        players: data.players,
        updatedAt: serverTimestamp(),
      });

      return { success: true };
    });
  } catch (err: any) {
    return { success: false, error: err.message || 'Eroare la conectare!' };
  }
}

/**
 * Adds an AI Bot monk to fill the 2nd slot for solo testing/play
 */
export async function addPineappleBot(code: string): Promise<boolean> {
  const roomRef = doc(db, 'pineapple_rooms', code.trim().toUpperCase());
  try {
    const snap = await getDoc(roomRef);
    if (!snap.exists()) return false;
    const data = snap.data() as PineappleRoomState;
    if (data.players.length >= 2) return false;

    const botNames = ['Fratele Arsenie (AI)', 'Cuviosul Pafnutie (AI)', 'Părintele Cleopa (AI)', 'Fratele Ilarion (AI)'];
    const selectedName = botNames[Math.floor(Math.random() * botNames.length)];

    const bot: PineapplePlayerState = {
      id: `bot_${Date.now()}`,
      name: selectedName,
      avatarIcon: '🧙‍♂️',
      color: '#9333ea',
      isHost: false,
      isBot: true,
      connected: true,
      board: createEmptyBoard(),
      currentHandCards: [],
      discarded: [],
      inFantasyLand: false,
      qualifiesNextFantasyLand: false,
      sipsAccumulated: 0,
      handLocked: false,
      isReadyNextHand: false,
    };

    await updateDoc(roomRef, {
      players: [...data.players, bot],
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (e) {
    console.error('Error adding bot:', e);
    return false;
  }
}

/**
 * Removes a player or AI Bot from the room
 */
export async function removePineapplePlayer(code: string, playerId: string): Promise<boolean> {
  const roomRef = doc(db, 'pineapple_rooms', code.trim().toUpperCase());
  try {
    const snap = await getDoc(roomRef);
    if (!snap.exists()) return false;
    const data = snap.data() as PineappleRoomState;
    const remainingPlayers = data.players.filter(p => p.id !== playerId);

    await updateDoc(roomRef, {
      players: remainingPlayers,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (e) {
    console.error('Error removing player:', e);
    return false;
  }
}

/**
 * Removes the AI Bot from the room (if host wants to wait for a real player)
 */
export async function removePineappleBot(code: string): Promise<boolean> {
  const roomRef = doc(db, 'pineapple_rooms', code.trim().toUpperCase());
  try {
    const snap = await getDoc(roomRef);
    if (!snap.exists()) return false;
    const data = snap.data() as PineappleRoomState;
    const remainingPlayers = data.players.filter(p => !p.isBot);

    await updateDoc(roomRef, {
      players: remainingPlayers,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (e) {
    console.error('Error removing bot:', e);
    return false;
  }
}

/**
 * Subscribes to real-time room updates
 */
export function subscribeToPineappleRoom(
  code: string,
  onUpdate: (state: PineappleRoomState | null) => void,
  onError?: (err: Error) => void
): () => void {
  const roomRef = doc(db, 'pineapple_rooms', code.trim().toUpperCase());
  return onSnapshot(
    roomRef,
    snap => {
      if (snap.exists()) {
        onUpdate(snap.data() as PineappleRoomState);
      } else {
        onUpdate(null);
      }
    },
    error => {
      if (onError) onError(error);
    }
  );
}

/**
 * Starts match from Lobby (Host only)
 */
export async function startPineappleMatch(code: string): Promise<void> {
  const roomRef = doc(db, 'pineapple_rooms', code);

  await runTransaction(db, async transaction => {
    const snap = await transaction.get(roomRef);
    if (!snap.exists()) return;
    const data = snap.data() as PineappleRoomState;

    if (data.players.length < 2) {
      throw new Error('Sunt necesari 2 jucători pentru a începe!');
    }

    const freshDeck = shuffleCards(createDeck());
    let deckIdx = 0;

    // Reset boards and handle initial deals
    const updatedPlayers = data.players.map(p => {
      const isFL = p.inFantasyLand;
      let dealtCards: PlayingCard[] = [];

      if (isFL) {
        // Fantasy Land receives all 13 cards at once
        dealtCards = freshDeck.slice(deckIdx, deckIdx + 13);
        deckIdx += 13;
      } else {
        // Normal deal 5 cards
        dealtCards = freshDeck.slice(deckIdx, deckIdx + 5);
        deckIdx += 5;
      }

      return {
        ...p,
        board: createEmptyBoard(),
        currentHandCards: dealtCards,
        discarded: [],
        handLocked: false,
        isReadyNextHand: false,
      };
    });

    const remainingDeck = freshDeck.slice(deckIdx);

    transaction.update(roomRef, {
      status: 'in_hand',
      currentHand: 1,
      currentRoundInHand: 1,
      players: updatedPlayers,
      deck: remainingDeck,
      lastHandResult: null,
      winnerId: null,
      loserId: null,
      updatedAt: serverTimestamp(),
    });
  });
}

/**
 * Live updates the player's board and hand cards during placement so opponent sees open face
 */
export async function updatePineapplePlayerBoard(
  code: string,
  playerId: string,
  board: PineappleBoard,
  currentHandCards: PlayingCard[],
  discarded: PlayingCard[]
): Promise<void> {
  const roomRef = doc(db, 'pineapple_rooms', code);
  try {
    const snap = await getDoc(roomRef);
    if (!snap.exists()) return;
    const data = snap.data() as PineappleRoomState;

    const playerIdx = data.players.findIndex(p => p.id === playerId);
    if (playerIdx === -1) return;

    data.players[playerIdx].board = board;
    data.players[playerIdx].currentHandCards = currentHandCards;
    data.players[playerIdx].discarded = discarded;

    await updateDoc(roomRef, {
      players: data.players,
      updatedAt: serverTimestamp(),
    });
  } catch (e) {
    console.error('Error updating live board:', e);
  }
}

/**
 * Locks the current round for the player.
 * If both players have locked, advances to next round OR triggers scoring!
 */
export async function lockPineapplePlayerHand(
  code: string,
  playerId: string,
  board: PineappleBoard,
  discarded: PlayingCard[]
): Promise<void> {
  const roomRef = doc(db, 'pineapple_rooms', code);

  await runTransaction(db, async transaction => {
    const snap = await transaction.get(roomRef);
    if (!snap.exists()) return;
    const data = snap.data() as PineappleRoomState;

    const pIdx = data.players.findIndex(p => p.id === playerId);
    if (pIdx === -1) return;

    data.players[pIdx].board = board;
    data.players[pIdx].currentHandCards = [];
    data.players[pIdx].discarded = discarded;
    data.players[pIdx].handLocked = true;

    // Check if the other player is already locked (or if bot needs to auto-lock)
    const otherIdx = pIdx === 0 ? 1 : 0;
    const otherPlayer = data.players[otherIdx];

    // If other player is a Bot and not locked, auto-play bot move!
    if (otherPlayer?.isBot && !otherPlayer.handLocked) {
      const botMove = executeBotPlacement(otherPlayer, data.currentRoundInHand);
      data.players[otherIdx].board = botMove.board;
      data.players[otherIdx].currentHandCards = [];
      data.players[otherIdx].discarded = botMove.discarded;
      data.players[otherIdx].handLocked = true;
    }

    const allLocked = data.players.every(p => p.handLocked);

    if (!allLocked) {
      // Just save this player's lock
      transaction.update(roomRef, {
        players: data.players,
        updatedAt: serverTimestamp(),
      });
      return;
    }

    // Both players have locked their hand for current round!
    // Check if this was the final round (all 13 cards placed on both boards)
    const p0Count =
      data.players[0].board.top.length +
      data.players[0].board.middle.length +
      data.players[0].board.bottom.length;
    const p1Count =
      data.players[1].board.top.length +
      data.players[1].board.middle.length +
      data.players[1].board.bottom.length;

    const handComplete = p0Count === 13 && p1Count === 13;

    if (handComplete) {
      // SCORING PHASE!
      const handResult = calculatePineappleHandScore(
        data.currentHand,
        data.players[0],
        data.players[1],
        data.settings
      );

      // Accumulate sips
      data.players[0].sipsAccumulated += handResult.sipsAddedA;
      data.players[1].sipsAccumulated += handResult.sipsAddedB;

      // Check Fantasy Land triggers for next hand
      const foulAData = checkIsFoul(
        data.players[0].board.top,
        data.players[0].board.middle,
        data.players[0].board.bottom
      );
      const foulBData = checkIsFoul(
        data.players[1].board.top,
        data.players[1].board.middle,
        data.players[1].board.bottom
      );

      const flTriggerA = checkFantasyLandTriggers(
        foulAData.isFoul,
        data.players[0].inFantasyLand,
        foulAData.topEval,
        foulAData.middleEval,
        foulAData.bottomEval
      );

      const flTriggerB = checkFantasyLandTriggers(
        foulBData.isFoul,
        data.players[1].inFantasyLand,
        foulBData.topEval,
        foulBData.middleEval,
        foulBData.bottomEval
      );

      data.players[0].qualifiesNextFantasyLand = flTriggerA.qualifies;
      data.players[1].qualifiesNextFantasyLand = flTriggerB.qualifies;

      // Check Game Over threshold
      const threshold = data.settings.sipsToEndGame || 30;
      const p0Over = data.players[0].sipsAccumulated >= threshold;
      const p1Over = data.players[1].sipsAccumulated >= threshold;

      let isFinished = false;
      let winnerId: string | null = null;
      let loserId: string | null = null;

      if (p0Over || p1Over) {
        isFinished = true;
        if (p0Over && !p1Over) {
          loserId = data.players[0].id;
          winnerId = data.players[1].id;
        } else if (p1Over && !p0Over) {
          loserId = data.players[1].id;
          winnerId = data.players[0].id;
        } else {
          // If both hit threshold, the one with more sips loses
          if (data.players[0].sipsAccumulated > data.players[1].sipsAccumulated) {
            loserId = data.players[0].id;
            winnerId = data.players[1].id;
          } else {
            loserId = data.players[1].id;
            winnerId = data.players[0].id;
          }
        }
      }

      transaction.update(roomRef, {
        status: isFinished ? 'finished' : 'hand_scoring',
        players: data.players,
        lastHandResult: handResult,
        winnerId,
        loserId,
        updatedAt: serverTimestamp(),
      });
    } else {
      // ADVANCE TO NEXT ROUND (Deal 3 cards to non-Fantasy Land players)
      let deckCopy = [...data.deck];
      const nextRound = data.currentRoundInHand + 1;

      data.players.forEach(p => {
        p.handLocked = false;
        if (!p.inFantasyLand) {
          // Deal 3 cards
          const dealt = deckCopy.slice(0, 3);
          deckCopy = deckCopy.slice(3);
          p.currentHandCards = dealt;
        }
      });

      transaction.update(roomRef, {
        currentRoundInHand: nextRound,
        players: data.players,
        deck: deckCopy,
        updatedAt: serverTimestamp(),
      });
    }
  });
}

/**
 * Starts the next hand after scoring inspection
 */
export async function startNextPineappleHand(code: string): Promise<void> {
  const roomRef = doc(db, 'pineapple_rooms', code);

  await runTransaction(db, async transaction => {
    const snap = await transaction.get(roomRef);
    if (!snap.exists()) return;
    const data = snap.data() as PineappleRoomState;

    const freshDeck = shuffleCards(createDeck());
    let deckIdx = 0;

    const updatedPlayers = data.players.map(p => {
      const willBeInFL = p.qualifiesNextFantasyLand;
      let dealt: PlayingCard[] = [];

      if (willBeInFL) {
        dealt = freshDeck.slice(deckIdx, deckIdx + 13);
        deckIdx += 13;
      } else {
        dealt = freshDeck.slice(deckIdx, deckIdx + 5);
        deckIdx += 5;
      }

      return {
        ...p,
        inFantasyLand: willBeInFL,
        qualifiesNextFantasyLand: false,
        board: createEmptyBoard(),
        currentHandCards: dealt,
        discarded: [],
        handLocked: false,
        isReadyNextHand: false,
      };
    });

    const remainingDeck = freshDeck.slice(deckIdx);

    transaction.update(roomRef, {
      status: 'in_hand',
      currentHand: data.currentHand + 1,
      currentRoundInHand: 1,
      players: updatedPlayers,
      deck: remainingDeck,
      lastHandResult: null,
      updatedAt: serverTimestamp(),
    });
  });
}

/**
 * Smart OFC Pineapple Bot solver for placing cards
 */
export function executeBotPlacement(
  bot: PineapplePlayerState,
  round: number
): { board: PineappleBoard; discarded: PlayingCard[] } {
  const board: PineappleBoard = {
    top: [...bot.board.top],
    middle: [...bot.board.middle],
    bottom: [...bot.board.bottom],
  };
  const discarded = [...bot.discarded];
  const handCards = [...bot.currentHandCards];

  const rankValues: Record<string, number> = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, 'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
  };

  // Helper to sort cards descending
  const sortDesc = (cards: PlayingCard[]) => {
    return [...cards].sort((a, b) => (rankValues[b.rank] || 0) - (rankValues[a.rank] || 0));
  };

  if (bot.inFantasyLand && handCards.length >= 13) {
    const sorted = sortDesc(handCards);
    // Find rank counts
    const counts: Record<string, PlayingCard[]> = {};
    for (const c of sorted) {
      if (!counts[c.rank]) counts[c.rank] = [];
      counts[c.rank].push(c);
    }
    const grouped = Object.values(counts).sort((a, b) => {
      if (b.length !== a.length) return b.length - a.length;
      return (rankValues[b[0].rank] || 0) - (rankValues[a[0].rank] || 0);
    });

    const flatRankOrdered = grouped.flat();
    board.bottom = flatRankOrdered.slice(0, 5);
    board.middle = flatRankOrdered.slice(5, 10);
    board.top = flatRankOrdered.slice(10, 13);
    return { board, discarded };
  }

  if (round === 1 && handCards.length >= 5) {
    const sorted = sortDesc(handCards);
    // Check for pairs
    const counts: Record<string, PlayingCard[]> = {};
    for (const c of sorted) {
      if (!counts[c.rank]) counts[c.rank] = [];
      counts[c.rank].push(c);
    }
    const pairs = Object.values(counts).filter(arr => arr.length >= 2);

    if (pairs.length >= 1) {
      // Place best pair on Bottom
      const bestPair = pairs[0];
      const remaining = sorted.filter(c => !bestPair.some(p => p.id === c.id));
      board.bottom = [...bestPair, remaining[0]];
      board.middle = remaining.slice(1, 3);
    } else {
      // High cards on bottom, next on middle
      board.bottom = sorted.slice(0, 3);
      board.middle = sorted.slice(3, 5);
    }
    return { board, discarded };
  }

  // Rounds 2..5: 3 cards dealt -> pick 2 to place, 1 to discard
  if (handCards.length >= 3) {
    const sorted = sortDesc(handCards);
    // Score cards based on matching existing board ranks
    const getCardValue = (card: PlayingCard): number => {
      let score = rankValues[card.rank] || 0;
      if (board.bottom.some(c => c.rank === card.rank)) score += 30;
      if (board.middle.some(c => c.rank === card.rank)) score += 20;
      if (board.top.some(c => c.rank === card.rank)) score += 15;
      return score;
    };

    const scoredCards = sorted.map(c => ({ card: c, score: getCardValue(c) }));
    scoredCards.sort((a, b) => b.score - a.score);

    const toPlace = [scoredCards[0].card, scoredCards[1].card];
    const toDiscard = scoredCards[2].card;
    discarded.push(toDiscard);

    for (const card of toPlace) {
      // Try to match bottom first if bottom has room
      if (board.bottom.length < 5 && board.bottom.some(c => c.rank === card.rank)) {
        board.bottom.push(card);
      } else if (board.middle.length < 5 && board.middle.some(c => c.rank === card.rank)) {
        board.middle.push(card);
      } else if (board.bottom.length < 5) {
        board.bottom.push(card);
      } else if (board.middle.length < 5) {
        board.middle.push(card);
      } else if (board.top.length < 3) {
        board.top.push(card);
      }
    }
  }

  return { board, discarded };
}
