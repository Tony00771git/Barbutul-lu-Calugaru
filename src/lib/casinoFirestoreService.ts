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
  CasinoBet,
  CasinoPenalty,
  CasinoPlayer,
  CasinoRoomState,
  CasinoRound,
  TavernEmoteMessage,
} from '../types';
import { generateRoomCode, getSyncedServerNow } from './duelFirestoreService';

const CASINO_COLLECTION = 'casino_rooms';

/**
 * Removes any undefined values from Firestore payloads (objects & arrays).
 */
export function cleanFirestoreData<T>(obj: T): T {
  if (obj === undefined) {
    return null as any;
  }
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => cleanFirestoreData(item)) as any;
  }
  const result: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const val = (obj as any)[key];
    if (val !== undefined) {
      result[key] = cleanFirestoreData(val);
    }
  }
  return result as T;
}

/**
 * Sanitizes a CasinoBet to prevent undefined numberValue fields.
 */
export function cleanCasinoBet(bet: CasinoBet): CasinoBet {
  const clean: CasinoBet = {
    playerId: bet.playerId,
    type: bet.type,
    amount: Math.max(1, Number(bet.amount) || 1),
  };
  if (bet.numberValue !== undefined && bet.numberValue !== null) {
    clean.numberValue = Number(bet.numberValue);
  }
  return clean;
}

/**
 * Generates a random round penalty: 15% chance of groapa (chug), otherwise 1-10 sips.
 */
export function generateCasinoPenalty(): CasinoPenalty {
  const isGroapa = Math.random() < 0.15;
  if (isGroapa) {
    return { type: 'groapa', amount: 0 };
  }
  const sips = Math.floor(Math.random() * 10) + 1; // 1-10 sips
  return { type: 'sips', amount: sips };
}

/**
 * Normalizes casino room snapshot from Firestore.
 */
export function sanitizeCasinoRoom(raw: any): CasinoRoomState | null {
  if (!raw) return null;
  return {
    code: raw.code,
    startingChips: raw.startingChips || 500,
    hostPlayerId: raw.hostPlayerId || '',
    players: Array.isArray(raw.players) ? raw.players : [],
    status: raw.status || 'lobby',
    currentRound: raw.currentRound || 1,
    round: raw.round || {
      roundNumber: 1,
      penalty: { type: 'sips', amount: 3 },
      bets: [],
      phase: 'betting',
      lockedPlayerIds: [],
    },
    winnerId: raw.winnerId || null,
    eliminationOrder: Array.isArray(raw.eliminationOrder) ? raw.eliminationOrder : [],
    updatedAt: raw.updatedAt,
  };
}

/**
 * Subscribes to real-time updates of a Casino room document.
 */
export function subscribeToCasinoRoom(
  roomCode: string,
  onUpdate: (room: CasinoRoomState | null) => void,
  onError?: (error: any) => void
): () => void {
  const cleanCode = roomCode.trim().toUpperCase();
  const roomRef = doc(db, CASINO_COLLECTION, cleanCode);

  return onSnapshot(
    roomRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(sanitizeCasinoRoom(snapshot.data()));
      } else {
        onUpdate(null);
      }
    },
    (err) => {
      console.error(`[Casino] Error listening to room ${cleanCode}:`, err);
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.GET, `${CASINO_COLLECTION}/${cleanCode}`);
    }
  );
}

/**
 * Creates a new Casino room.
 */
export async function createCasinoRoom(
  hostPlayer: { id: string; name: string; avatarIcon: string; color: string },
  startingChips: number = 500
): Promise<string> {
  const code = generateRoomCode();
  const roomRef = doc(db, CASINO_COLLECTION, code);

  const initialPlayer: CasinoPlayer = {
    id: hostPlayer.id,
    name: hostPlayer.name.trim() || 'Gazda Cazino',
    avatarIcon: hostPlayer.avatarIcon || 'monk_drunk',
    color: hostPlayer.color || '#e8c84a',
    isHost: true,
    connected: true,
    balance: Math.max(50, startingChips),
    eliminated: false,
    guriTotal: 0,
    groapaTotal: 0,
  };

  const initialPenalty = generateCasinoPenalty();

  const roomData: CasinoRoomState = {
    code,
    startingChips: Math.max(50, startingChips),
    hostPlayerId: hostPlayer.id,
    players: [initialPlayer],
    status: 'lobby',
    currentRound: 1,
    round: {
      roundNumber: 1,
      penalty: initialPenalty,
      bets: [],
      phase: 'betting',
      lockedPlayerIds: [],
    },
    winnerId: null,
    eliminationOrder: [],
  };

  try {
    await setDoc(roomRef, cleanFirestoreData({
      ...roomData,
      updatedAt: serverTimestamp(),
    }));
    return code;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${CASINO_COLLECTION}/${code}`);
  }
}

/**
 * Joins an existing Casino room (supports up to 6 players).
 */
export async function joinCasinoRoom(
  roomCode: string,
  guestPlayer: { id: string; name: string; avatarIcon: string; color: string }
): Promise<boolean> {
  const cleanCode = roomCode.trim().toUpperCase();
  const roomRef = doc(db, CASINO_COLLECTION, cleanCode);

  try {
    return await runTransaction(db, async (tx) => {
      const snap = await tx.get(roomRef);
      if (!snap.exists()) {
        throw new Error('Camera nu a fost găsită!');
      }

      const room = sanitizeCasinoRoom(snap.data())!;

      if (room.status !== 'lobby') {
        // Allow reconnecting existing player
        const existingIdx = room.players.findIndex((p) => p.id === guestPlayer.id);
        if (existingIdx !== -1) {
          const updatedPlayers = [...room.players];
          updatedPlayers[existingIdx].connected = true;
          tx.update(roomRef, cleanFirestoreData({ players: updatedPlayers, updatedAt: serverTimestamp() }));
          return true;
        }
        throw new Error('Meciul a început deja în această cameră!');
      }

      const existingPlayerIndex = room.players.findIndex((p) => p.id === guestPlayer.id);
      if (existingPlayerIndex !== -1) {
        const updatedPlayers = [...room.players];
        updatedPlayers[existingPlayerIndex] = {
          ...updatedPlayers[existingPlayerIndex],
          name: guestPlayer.name.trim() || updatedPlayers[existingPlayerIndex].name,
          avatarIcon: guestPlayer.avatarIcon || updatedPlayers[existingPlayerIndex].avatarIcon,
          color: guestPlayer.color || updatedPlayers[existingPlayerIndex].color,
          connected: true,
        };
        tx.update(roomRef, cleanFirestoreData({ players: updatedPlayers, updatedAt: serverTimestamp() }));
        return true;
      }

      if (room.players.length >= 6) {
        throw new Error('Camera este plină! (Maxim 6 jucători permisi)');
      }

      const newPlayer: CasinoPlayer = {
        id: guestPlayer.id,
        name: guestPlayer.name.trim() || `Jucător ${room.players.length + 1}`,
        avatarIcon: guestPlayer.avatarIcon || 'knight',
        color: guestPlayer.color || '#4a90e2',
        isHost: false,
        connected: true,
        balance: room.startingChips,
        eliminated: false,
        guriTotal: 0,
        groapaTotal: 0,
      };

      tx.update(roomRef, cleanFirestoreData({
        players: [...room.players, newPlayer],
        updatedAt: serverTimestamp(),
      }));
      return true;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${CASINO_COLLECTION}/${cleanCode}`);
  }
}

/**
 * Adds an AI Bot player to the casino lobby (for testing or playing with fewer people).
 */
export async function addBotToCasinoRoom(roomCode: string): Promise<void> {
  const cleanCode = roomCode.trim().toUpperCase();
  const roomRef = doc(db, CASINO_COLLECTION, cleanCode);

  const botNames = [
    'Fratele Onufrie (AI)',
    'Starețul Dionisie (AI)',
    'Diaconul Ilie (AI)',
    'Pustnicul Sava (AI)',
    'Ieromonahul Efrem (AI)',
  ];
  const botAvatars = ['wizard', 'archer', 'priestess', 'blacksmith', 'monk_drunk'];
  const botColors = ['#bd10e0', '#50e3c2', '#b8e986', '#e05c3a', '#e8c84a'];

  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(roomRef);
      if (!snap.exists()) return;
      const room = sanitizeCasinoRoom(snap.data())!;
      if (room.status !== 'lobby' || room.players.length >= 6) return;

      const botIdx = room.players.filter((p) => p.isBot).length;
      const botId = `bot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const botPlayer: CasinoPlayer = {
        id: botId,
        name: botNames[botIdx % botNames.length],
        avatarIcon: botAvatars[botIdx % botAvatars.length],
        color: botColors[botIdx % botColors.length],
        isHost: false,
        isBot: true,
        connected: true,
        balance: room.startingChips,
        eliminated: false,
        guriTotal: 0,
        groapaTotal: 0,
      };

      tx.update(roomRef, cleanFirestoreData({
        players: [...room.players, botPlayer],
        updatedAt: serverTimestamp(),
      }));
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${CASINO_COLLECTION}/${cleanCode}`);
  }
}

/**
 * Removes a player or bot from the lobby.
 */
export async function removePlayerFromCasinoLobby(roomCode: string, playerId: string): Promise<void> {
  const cleanCode = roomCode.trim().toUpperCase();
  const roomRef = doc(db, CASINO_COLLECTION, cleanCode);

  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(roomRef);
      if (!snap.exists()) return;
      const room = sanitizeCasinoRoom(snap.data())!;
      if (room.status !== 'lobby') return;

      const remainingPlayers = room.players.filter((p) => p.id !== playerId);
      tx.update(roomRef, cleanFirestoreData({
        players: remainingPlayers,
        updatedAt: serverTimestamp(),
      }));
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${CASINO_COLLECTION}/${cleanCode}`);
  }
}

/**
 * Starts the casino game match.
 */
export async function startCasinoGame(roomCode: string): Promise<void> {
  const cleanCode = roomCode.trim().toUpperCase();
  const roomRef = doc(db, CASINO_COLLECTION, cleanCode);

  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(roomRef);
      if (!snap.exists()) throw new Error('Camera nu există!');
      const room = sanitizeCasinoRoom(snap.data())!;

      if (room.players.length < 2) {
        throw new Error('Sunt necesari minim 2 jucători pentru a începe Cazino-ul!');
      }

      const penalty = generateCasinoPenalty();
      const bettingDurationMs = 25000; // 25 seconds
      const bettingEndsAt = getSyncedServerNow() + bettingDurationMs;

      // Reset all players with startingChips
      const resetPlayers = room.players.map((p) => {
        const playerObj: CasinoPlayer = {
          ...p,
          balance: room.startingChips,
          eliminated: false,
          guriTotal: 0,
          groapaTotal: 0,
        };
        delete playerObj.eliminatedAtRound;
        return playerObj;
      });

      const newRound: CasinoRound = {
        roundNumber: 1,
        penalty,
        bets: [],
        phase: 'betting',
        bettingEndsAt,
        lockedPlayerIds: [],
      };

      tx.update(roomRef, cleanFirestoreData({
        players: resetPlayers,
        status: 'in_game',
        currentRound: 1,
        round: newRound,
        winnerId: null,
        eliminationOrder: [],
        updatedAt: serverTimestamp(),
      }));
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${CASINO_COLLECTION}/${cleanCode}`);
  }
}

/**
 * Places/updates bets for a player during the betting phase.
 * Deducts the bet amount from balance immediately.
 */
export async function placeCasinoBets(
  roomCode: string,
  playerId: string,
  newBets: CasinoBet[],
  lockImmediately: boolean = false
): Promise<void> {
  const cleanCode = roomCode.trim().toUpperCase();
  const roomRef = doc(db, CASINO_COLLECTION, cleanCode);

  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(roomRef);
      if (!snap.exists()) return;
      const room = sanitizeCasinoRoom(snap.data())!;

      if (room.status !== 'in_game' || room.round.phase !== 'betting') return;

      const player = room.players.find((p) => p.id === playerId);
      if (!player || player.eliminated) return;

      const cleanedNewBets = newBets.map(cleanCasinoBet);

      // Calculate total bets for this player
      const oldPlayerBets = room.round.bets.filter((b) => b.playerId === playerId);
      const oldTotalBets = oldPlayerBets.reduce((acc, b) => acc + b.amount, 0);
      const newTotalBets = cleanedNewBets.reduce((acc, b) => acc + b.amount, 0);

      // Effective balance is player.balance + oldTotalBets (available funds before these bets)
      const availableFunds = player.balance + oldTotalBets;
      if (newTotalBets > availableFunds) {
        throw new Error('Pariurile totale depășesc soldul disponibil!');
      }

      const updatedBalance = availableFunds - newTotalBets;
      const otherPlayersBets = room.round.bets.filter((b) => b.playerId !== playerId);
      const updatedBets = [...otherPlayersBets, ...cleanedNewBets];

      let updatedLocked = [...room.round.lockedPlayerIds];
      if (lockImmediately && !updatedLocked.includes(playerId)) {
        updatedLocked.push(playerId);
      }

      const updatedPlayers = room.players.map((p) =>
        p.id === playerId ? { ...p, balance: updatedBalance } : p
      );

      // Check if all active non-eliminated players have locked their bets
      const activePlayers = updatedPlayers.filter((p) => !p.eliminated);
      const allLocked = activePlayers.every((p) => updatedLocked.includes(p.id));

      if (allLocked && activePlayers.length > 0) {
        // Trigger dice roll
        const die1 = Math.floor(Math.random() * 6) + 1;
        const die2 = Math.floor(Math.random() * 6) + 1;

        tx.update(roomRef, cleanFirestoreData({
          players: updatedPlayers,
          'round.bets': updatedBets,
          'round.lockedPlayerIds': updatedLocked,
          'round.phase': 'rolling',
          'round.diceResult': [die1, die2],
          updatedAt: serverTimestamp(),
        }));
      } else {
        tx.update(roomRef, cleanFirestoreData({
          players: updatedPlayers,
          'round.bets': updatedBets,
          'round.lockedPlayerIds': updatedLocked,
          updatedAt: serverTimestamp(),
        }));
      }
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${CASINO_COLLECTION}/${cleanCode}`);
  }
}

/**
 * Locks bets for a player.
 */
export async function lockCasinoBets(roomCode: string, playerId: string): Promise<void> {
  const cleanCode = roomCode.trim().toUpperCase();
  const roomRef = doc(db, CASINO_COLLECTION, cleanCode);

  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(roomRef);
      if (!snap.exists()) return;
      const room = sanitizeCasinoRoom(snap.data())!;

      if (room.status !== 'in_game' || room.round.phase !== 'betting') return;

      const player = room.players.find((p) => p.id === playerId);
      if (!player || player.eliminated) return;

      let updatedLocked = [...room.round.lockedPlayerIds];
      if (!updatedLocked.includes(playerId)) {
        updatedLocked.push(playerId);
      }

      const activePlayers = room.players.filter((p) => !p.eliminated);
      const allLocked = activePlayers.every((p) => updatedLocked.includes(p.id));

      if (allLocked && activePlayers.length > 0) {
        const die1 = Math.floor(Math.random() * 6) + 1;
        const die2 = Math.floor(Math.random() * 6) + 1;

        tx.update(roomRef, cleanFirestoreData({
          'round.lockedPlayerIds': updatedLocked,
          'round.phase': 'rolling',
          'round.diceResult': [die1, die2],
          updatedAt: serverTimestamp(),
        }));
      } else {
        tx.update(roomRef, cleanFirestoreData({
          'round.lockedPlayerIds': updatedLocked,
          updatedAt: serverTimestamp(),
        }));
      }
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${CASINO_COLLECTION}/${cleanCode}`);
  }
}

/**
 * Force locks betting phase when the 25s timer expires.
 */
export async function triggerBettingTimeout(roomCode: string): Promise<void> {
  const cleanCode = roomCode.trim().toUpperCase();
  const roomRef = doc(db, CASINO_COLLECTION, cleanCode);

  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(roomRef);
      if (!snap.exists()) return;
      const room = sanitizeCasinoRoom(snap.data())!;

      if (room.status !== 'in_game' || room.round.phase !== 'betting') return;

      const die1 = Math.floor(Math.random() * 6) + 1;
      const die2 = Math.floor(Math.random() * 6) + 1;

      const activePlayerIds = room.players.filter((p) => !p.eliminated).map((p) => p.id);

      tx.update(roomRef, cleanFirestoreData({
        'round.lockedPlayerIds': activePlayerIds,
        'round.phase': 'rolling',
        'round.diceResult': [die1, die2],
        updatedAt: serverTimestamp(),
      }));
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${CASINO_COLLECTION}/${cleanCode}`);
  }
}

/**
 * Analyzes a player's bets for contradictory or excessive hedging (Fraudulent Bets).
 */
export interface FraudCheckResult {
  isFraudulent: boolean;
  reason?: string;
  coveredNumbersCount?: number;
}

export function analyzePlayerCasinoBets(bets: CasinoBet[]): FraudCheckResult {
  if (!bets || bets.length === 0) {
    return { isFraudulent: false };
  }

  const hasEven = bets.some((b) => b.type === 'even');
  const hasOdd = bets.some((b) => b.type === 'odd');
  const hasOver7 = bets.some((b) => b.type === 'over7');
  const hasUnder7 = bets.some((b) => b.type === 'under7');

  const numberBets = bets.filter((b) => b.type === 'number' && b.numberValue !== undefined);
  const uniqueNumbers = Array.from(new Set(numberBets.map((b) => b.numberValue)));

  const reasons: string[] = [];

  // Check 1: Even + Odd contradictory arbitrage
  if (hasEven && hasOdd) {
    reasons.push('Pariu contradictoriu Par + Impar');
  }

  // Check 2: Over 7 + Under 7 contradictory arbitrage
  if (hasOver7 && hasUnder7) {
    reasons.push('Pariu contradictoriu Peste 7 + Sub 7');
  }

  // Check 3: Too many numbers covered (4, 5, or all 6 numbers)
  if (uniqueNumbers.length >= 4) {
    reasons.push(`Acoperire excesivă de numere (${uniqueNumbers.length}/6 numere pariate)`);
  }

  // Check 4: Combined multi-hedge (Par/Impar + 3 or more numbers)
  if ((hasEven || hasOdd) && uniqueNumbers.length >= 3) {
    reasons.push('Arbitraj compus (Paritate + 3+ numere)');
  }

  if (reasons.length > 0) {
    return {
      isFraudulent: true,
      reason: reasons.join('; '),
      coveredNumbersCount: uniqueNumbers.length,
    };
  }

  return { isFraudulent: false };
}

/**
 * Resolves the round: calculates craps payouts, updates balances, checks eliminations & penalties.
 */
export async function resolveCasinoRound(roomCode: string): Promise<void> {
  const cleanCode = roomCode.trim().toUpperCase();
  const roomRef = doc(db, CASINO_COLLECTION, cleanCode);

  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(roomRef);
      if (!snap.exists()) return;
      const room = sanitizeCasinoRoom(snap.data())!;

      if (room.status !== 'in_game' || room.round.phase !== 'rolling') return;
      if (!room.round.diceResult) return;

      const [d1, d2] = room.round.diceResult;
      const sum = d1 + d2;

      // 1. Calculate Payouts for every bet
      const payoutsByPlayer: Record<
        string,
        {
          totalWon: number;
          totalLost: number;
          netProfit: number;
          winningBetsCount: number;
          details: string[];
          isFraudulent?: boolean;
          fraudReason?: string;
          fraudFine?: number;
          fraudSips?: number;
          isNonBettor?: boolean;
        }
      > = {};

      const playerBalances: Record<string, number> = {};
      const playerBetsByPlayer: Record<string, CasinoBet[]> = {};

      room.players.forEach((p) => {
        playerBalances[p.id] = p.balance;
        playerBetsByPlayer[p.id] = [];
        payoutsByPlayer[p.id] = {
          totalWon: 0,
          totalLost: 0,
          netProfit: 0,
          winningBetsCount: 0,
          details: [],
        };
      });

      room.round.bets.forEach((bet) => {
        if (playerBetsByPlayer[bet.playerId]) {
          playerBetsByPlayer[bet.playerId].push(bet);
        }
      });

      const fraudulentDrinkers: string[] = [];
      const nonBettorDrinkers: string[] = [];

      // Process each player's bets
      for (const player of room.players) {
        const pId = player.id;
        const playerStats = payoutsByPlayer[pId];
        if (!playerStats) continue;

        if (player.eliminated) continue;

        const pBets = playerBetsByPlayer[pId] || [];

        // Check if active player skipped betting entirely
        if (pBets.length === 0) {
          nonBettorDrinkers.push(pId);
          playerStats.isNonBettor = true;
          playerStats.totalWon = 0;
          playerStats.totalLost = 0;
          playerStats.netProfit = 0;
          playerStats.winningBetsCount = 0;
          playerStats.details.push(
            `⚠️ Eschivă de la pariere: Nu ai plasat niciun pariu în această rundă! Ai primit canonul de băutură stabilit de stareț (${
              room.round.penalty.type === 'groapa'
                ? 'CHUG / GROAPĂ'
                : `${room.round.penalty.amount || 1} guri`
            }).`
          );
          continue;
        }

        // Check if player's bets are fraudulent / arbitrage
        const fraudCheck = analyzePlayerCasinoBets(pBets);
        const isPlayerFraud = fraudCheck.isFraudulent;

        let playerRawWon = 0;
        let playerRawLost = 0;
        let playerRawProfit = 0;
        let winningCount = 0;

        for (const bet of pBets) {
          let won = false;
          let profit = 0;
          let betLabel = '';

          switch (bet.type) {
            case 'over7':
              betLabel = 'Peste 7';
              if (sum > 7) {
                won = true;
                profit = bet.amount; // 1:1 payout (+100% profit; sum=7 loses)
              }
              break;

            case 'under7':
              betLabel = 'Sub 7';
              if (sum < 7) {
                won = true;
                profit = bet.amount; // 1:1 payout (+100% profit; sum=7 loses)
              }
              break;

            case 'even':
              betLabel = 'Par';
              if (sum % 2 === 0) {
                won = true;
                profit = bet.amount; // 1:1 payout
              }
              break;

            case 'odd':
              betLabel = 'Impar';
              if (sum % 2 !== 0) {
                won = true;
                profit = bet.amount; // 1:1 payout
              }
              break;

            case 'number':
              const num = bet.numberValue || 1;
              const matches = (d1 === num ? 1 : 0) + (d2 === num ? 1 : 0);
              if (matches === 1) {
                won = true;
                profit = bet.amount; // 1:1 payout for 1 die (+100% profit)
                betLabel = `Numărul ${num} (1 zar)`;
              } else if (matches === 2) {
                won = true;
                profit = bet.amount * 3; // 3:1 payout for double dice (+300% profit)
                betLabel = `Numărul ${num} (DUBLĂ DE AUR! ✨)`;
              } else {
                won = false;
                betLabel = `Numărul ${num}`;
              }
              break;
          }

          if (won) {
            const returnTotal = bet.amount + profit;
            playerRawWon += returnTotal;
            playerRawProfit += profit;
            winningCount += 1;
            playerStats.details.push(
              `✅ ${betLabel} (${bet.amount} fise): +${profit} profit (+${returnTotal} returnat)`
            );
          } else {
            playerRawLost += bet.amount;
            playerRawProfit -= bet.amount;
            playerStats.details.push(`❌ ${betLabel} (${bet.amount} fise): pierdut`);
          }
        }

        playerStats.winningBetsCount = winningCount;
        playerStats.totalLost = playerRawLost;

        if (isPlayerFraud) {
          // FRAUD PENALTY: Confiscate all profit, apply fine & drinking canon
          const totalBetsAmount = pBets.reduce((acc, b) => acc + b.amount, 0);
          const fraudFine = Math.min(
            playerBalances[pId],
            Math.max(25, Math.floor(totalBetsAmount * 0.25))
          );
          const fraudSips = 3;

          playerBalances[pId] = Math.max(0, playerBalances[pId] - fraudFine);
          playerStats.isFraudulent = true;
          playerStats.fraudReason = fraudCheck.reason;
          playerStats.fraudFine = fraudFine;
          playerStats.fraudSips = fraudSips;
          playerStats.totalWon = 0;
          playerStats.netProfit = -playerRawLost - fraudFine;

          playerStats.details.unshift(
            `🚨 FRAUDĂ DETECTATĂ: ${fraudCheck.reason}. Profiturile au fost confiscate! Amendă: -${fraudFine} fise + 3 Guri de Canon.`
          );

          fraudulentDrinkers.push(pId);
        } else {
          playerBalances[pId] += playerRawWon;
          playerStats.totalWon = playerRawWon;
          playerStats.netProfit = playerRawProfit;
        }
      }

      // 2. Elimination check: exactly 0 balance -> CHUG IT ALL & eliminated
      const newlyEliminatedIds: string[] = [];
      const updatedEliminationOrder = [...(room.eliminationOrder || [])];

      const updatedPlayers: CasinoPlayer[] = room.players.map((player) => {
        if (player.eliminated) return player;

        const newBal = Math.max(0, playerBalances[player.id] ?? player.balance);
        let isEliminated = player.eliminated;
        let groapaTotal = player.groapaTotal;
        let guriTotal = player.guriTotal;

        // Apply fraud drinking penalty if caught
        if (fraudulentDrinkers.includes(player.id)) {
          guriTotal += 3;
        }

        // Apply penalty for skipping betting (non-bettors drink the round penalty generated by the game)
        if (nonBettorDrinkers.includes(player.id)) {
          if (room.round.penalty.type === 'groapa') {
            groapaTotal += 1;
          } else {
            guriTotal += room.round.penalty.amount || 1;
          }
        }

        if (newBal === 0) {
          isEliminated = true;
          groapaTotal += 1; // Drank groapa for elimination
          newlyEliminatedIds.push(player.id);
          if (!updatedEliminationOrder.includes(player.id)) {
            updatedEliminationOrder.push(player.id);
          }
        }

        const resPlayer: CasinoPlayer = {
          ...player,
          balance: newBal,
          eliminated: isEliminated,
          groapaTotal,
          guriTotal,
        };

        if (isEliminated) {
          resPlayer.eliminatedAtRound = player.eliminatedAtRound || room.currentRound;
        }

        return resPlayer;
      });

      // 3. Round penalty check:
      // Among remaining active (non-eliminated) players, lowest balance drinks penalty
      const remainingActivePlayers = updatedPlayers.filter((p) => !p.eliminated);
      const lowestBalanceDrinkers: string[] = [];

      if (remainingActivePlayers.length > 0) {
        const minBal = Math.min(...remainingActivePlayers.map((p) => p.balance));
        remainingActivePlayers.forEach((p) => {
          if (p.balance === minBal) {
            lowestBalanceDrinkers.push(p.id);
          }
        });

        // Apply penalty stats to lowest balance drinkers (if not already penalized as non-bettor)
        const penalty = room.round.penalty;
        updatedPlayers.forEach((p) => {
          if (lowestBalanceDrinkers.includes(p.id) && !nonBettorDrinkers.includes(p.id)) {
            if (penalty.type === 'groapa') {
              p.groapaTotal += 1;
            } else {
              p.guriTotal += penalty.amount || 1;
            }
          }
        });
      }

      // 4. Match End Check: If <= 1 active player remains -> winner found!
      let winnerId: string | null = null;
      let newStatus: 'in_game' | 'finished' = 'in_game';

      if (remainingActivePlayers.length === 1) {
        winnerId = remainingActivePlayers[0].id;
        newStatus = 'finished';
      } else if (remainingActivePlayers.length === 0) {
        // All eliminated in the same round -> last one with highest before or draw
        winnerId = newlyEliminatedIds[newlyEliminatedIds.length - 1] || null;
        newStatus = 'finished';
      }

      tx.update(roomRef, cleanFirestoreData({
        players: updatedPlayers,
        status: newStatus,
        winnerId,
        eliminationOrder: updatedEliminationOrder,
        'round.phase': 'resolved',
        'round.payouts': payoutsByPlayer,
        'round.eliminatedThisRound': newlyEliminatedIds,
        'round.lowestBalanceDrinkers': lowestBalanceDrinkers,
        'round.fraudulentDrinkers': fraudulentDrinkers,
        'round.nonBettorDrinkers': nonBettorDrinkers,
        updatedAt: serverTimestamp(),
      }));
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${CASINO_COLLECTION}/${cleanCode}`);
  }
}

/**
 * Advances to the next round.
 */
export async function nextCasinoRound(roomCode: string): Promise<void> {
  const cleanCode = roomCode.trim().toUpperCase();
  const roomRef = doc(db, CASINO_COLLECTION, cleanCode);

  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(roomRef);
      if (!snap.exists()) return;
      const room = sanitizeCasinoRoom(snap.data())!;

      if (room.status !== 'in_game') return;

      const activePlayers = room.players.filter((p) => !p.eliminated);
      if (activePlayers.length <= 1) {
        const winnerId = activePlayers[0]?.id || null;
        tx.update(roomRef, cleanFirestoreData({
          status: 'finished',
          winnerId,
          updatedAt: serverTimestamp(),
        }));
        return;
      }

      const nextRoundNum = room.currentRound + 1;
      const penalty = generateCasinoPenalty();
      const bettingDurationMs = 25000;
      const bettingEndsAt = getSyncedServerNow() + bettingDurationMs;

      const newRound: CasinoRound = {
        roundNumber: nextRoundNum,
        penalty,
        bets: [],
        phase: 'betting',
        bettingEndsAt,
        lockedPlayerIds: [],
      };

      tx.update(roomRef, cleanFirestoreData({
        currentRound: nextRoundNum,
        round: newRound,
        updatedAt: serverTimestamp(),
      }));
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${CASINO_COLLECTION}/${cleanCode}`);
  }
}

/**
 * Closes / ends the casino match manually.
 */
export async function endCasinoGame(roomCode: string): Promise<void> {
  const cleanCode = roomCode.trim().toUpperCase();
  const roomRef = doc(db, CASINO_COLLECTION, cleanCode);

  try {
    await updateDoc(roomRef, cleanFirestoreData({
      status: 'finished',
      updatedAt: serverTimestamp(),
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${CASINO_COLLECTION}/${cleanCode}`);
  }
}

/**
 * Broadcasts an instant Tavern Emote reaction across Casino room.
 */
export async function sendCasinoEmote(roomCode: string, emote: TavernEmoteMessage): Promise<void> {
  const cleanCode = roomCode.trim().toUpperCase();
  const roomRef = doc(db, CASINO_COLLECTION, cleanCode);

  try {
    await updateDoc(roomRef, cleanFirestoreData({
      lastEmote: emote,
      updatedAt: serverTimestamp(),
    }));
  } catch (error) {
    console.warn('[Casino] Error sending emote:', error);
  }
}
