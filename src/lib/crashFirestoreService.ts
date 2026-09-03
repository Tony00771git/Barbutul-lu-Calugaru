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
import {
  CrashBotStyle,
  CrashMatchSettings,
  CrashPlayerState,
  CrashRoomState,
  CrashRound,
  CrashStakeMode,
  TavernEmoteMessage,
} from '../types';
import { getSyncedServerNow, syncServerClock } from './duelFirestoreService';

export function generateRoomCode(): string {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

/**
 * Crash growth rate parameter k in M(t) = e^(k * t)
 * With k = 0.075:
 *  - 1.50x in ~5.4s
 *  - 2.00x in ~9.2s
 *  - 3.00x in ~14.6s
 *  - 5.00x in ~21.4s
 *  - 10.00x in ~30.7s
 *  - 20.00x in ~40.0s
 */
export const CRASH_GROWTH_RATE = 0.075;

/**
 * Calculates multiplier from elapsed seconds
 */
export function calculateMultiplier(elapsedSeconds: number): number {
  if (elapsedSeconds <= 0) return 1.00;
  const mult = Math.exp(CRASH_GROWTH_RATE * elapsedSeconds);
  return Math.max(1.00, Number(mult.toFixed(2)));
}

/**
 * Calculates required elapsed seconds to reach multiplier
 */
export function calculateElapsedForMultiplier(multiplier: number): number {
  if (multiplier <= 1.00) return 0;
  return Math.log(multiplier) / CRASH_GROWTH_RATE;
}

/**
 * Generates crash point according to game mode.
 * - Standard/Dynamic/Guri: balanced crash distribution with lower frequency of < 2.0x crashes (~16%),
 *   and strictly prevents streaks of 3-5 consecutive sub-2x crashes.
 * - High Multipliers (high_mult): higher chance for multipliers > 5x, up to x100.
 */
export function generateCrashPoint(mode?: CrashStakeMode, recentHistory?: number[]): number {
  // Prevent streaks of sub-2x crashes: if the previous round was < 2.0x, guarantee >= 2.0x
  const hadRecentLowCrash =
    recentHistory &&
    recentHistory.length > 0 &&
    recentHistory.slice(-1).some((pt) => pt < 2.0);

  if (mode === 'high_mult') {
    const roll = Math.random();
    let val: number;
    // If the last round was sub-2x, guarantee at least 2.50x
    if (hadRecentLowCrash || roll >= 0.12) {
      if (roll < 0.38) {
        // Medium multiplier (2.50 - 5.50) ~26% chance
        val = 2.50 + Math.random() * 3.00;
      } else if (roll < 0.70) {
        // High multiplier (5.51 - 18.00) ~32% chance
        val = 5.51 + Math.random() * 12.49;
      } else if (roll < 0.90) {
        // Very High multiplier (18.01 - 45.00) ~20% chance
        val = 18.01 + Math.random() * 26.99;
      } else {
        // Peak flight (45.01 - 100.00) ~10% chance
        val = 45.01 + Math.random() * 54.99;
      }
    } else {
      // Occasional small multiplier (1.20 - 1.99) ~12% chance
      val = 1.20 + Math.random() * 0.79;
    }
    return Math.min(100.00, Math.max(1.00, Number(val.toFixed(2))));
  }

  // Standard/Dynamic/Guri mode - balanced distribution:
  // Sub-2x crashes occur occasionally (~16%), but if previous round crashed < 2x, it won't crash < 2x again!
  const roll = Math.random();
  let val: number;

  if (!hadRecentLowCrash && roll < 0.16) {
    // Occasional low multiplier (1.18 - 1.95) ~16% chance
    val = 1.18 + Math.random() * 0.77;
  } else if (roll < 0.58) {
    // Solid base multipliers (2.05 - 4.50) ~42% chance
    val = 2.05 + Math.random() * 2.45;
  } else if (roll < 0.84) {
    // Great flight multipliers (4.51 - 11.50) ~26% chance
    val = 4.51 + Math.random() * 6.99;
  } else if (roll < 0.96) {
    // High flight multipliers (11.51 - 28.00) ~12% chance
    val = 11.51 + Math.random() * 16.49;
  } else {
    // Legendary peak flight (28.01 - 100.00) ~4% chance
    val = 28.01 + Math.random() * 71.99;
  }

  return Math.min(100.00, Math.max(1.00, Number(val.toFixed(2))));
}

/**
 * Generates random bet value for sips (1 to 10)
 */
export function generateRoundBetValue(): number {
  return Math.floor(Math.random() * 10) + 1;
}

/**
 * Generates round stake and type (guri vs groapa) based on match settings and thresholds
 * Rules:
 * - 'high_mult' mode: Pure guri rounds (1-5 sips) with high multipliers
 * - 'groapa' mode: 100% Groapă (legacy support)
 * - 'dynamic' (balansat) or when playing on >= 50 sips: 10% chance for a Groapă round (maximum 1 groapă per match)
 * - 'guri' mode under 50 sips: pure guri rounds (1-5 sips)
 */
export function generateRoundStake(
  settings?: CrashMatchSettings,
  roundNumber: number = 1,
  groapaCountSoFar: number = 0
): { stakeType: 'guri' | 'groapa'; betValue: number } {
  const mode = settings?.stakeMode || 'dynamic';
  const threshold = settings?.sipsThreshold || 50;

  // Multiplicatoare Mari mode
  if (mode === 'high_mult') {
    return {
      stakeType: 'guri',
      betValue: generateRoundBetValue(),
    };
  }

  // Pure Groapă match mode (legacy)
  if (mode === 'groapa') {
    return { stakeType: 'groapa', betValue: 1 };
  }

  // Pure Guri mode ONLY if threshold < 50 and mode explicitly set to 'guri'
  if (mode === 'guri' && threshold < 50) {
    return {
      stakeType: 'guri',
      betValue: generateRoundBetValue(),
    };
  }

  // Balanced ('dynamic') mode OR any match played on >= 50 sips:
  // 10% chance for a Groapă round (up to max 1 groapă in the entire match)
  if (groapaCountSoFar < 1) {
    const isGroapa = Math.random() < 0.10;
    if (isGroapa) {
      return { stakeType: 'groapa', betValue: 1 };
    }
  }

  // Default standard guri round (1 - 5 sips)
  return {
    stakeType: 'guri',
    betValue: generateRoundBetValue(),
  };
}

/**
 * Generates human-like target multiplier for the Bot
 */
export function generateBotTargetMultiplier(botStyle?: CrashBotStyle, mode?: CrashStakeMode): number {
  if (mode === 'high_mult') {
    if (botStyle === 'prudent') {
      // 1.80x to 4.50x
      const target = 1.80 + Math.random() * 2.70;
      return Number(target.toFixed(2));
    } else if (botStyle === 'risky') {
      // 3.50x to 12.00x
      const target = 3.50 + Math.random() * 8.50;
      return Number(target.toFixed(2));
    }
  }

  if (botStyle === 'prudent') {
    // 1.20x to 2.00x
    const target = 1.20 + Math.random() * 0.80;
    return Number(target.toFixed(2));
  } else if (botStyle === 'risky') {
    // 2.00x to 5.50x
    const target = 2.00 + Math.random() * 3.50;
    return Number(target.toFixed(2));
  }

  // Balanced default human-like distribution
  const rand = Math.random();
  if (rand < 0.65) {
    // 65%: Moderate safe range 1.20x - 3.20x
    return Number((1.20 + Math.random() * 2.00).toFixed(2));
  } else if (rand < 0.90) {
    // 25%: Ambitious range 3.20x - 6.00x
    return Number((3.20 + Math.random() * 2.80).toFixed(2));
  } else {
    // 10%: High roller or greedy 6.00x - 12.00x
    return Number((6.00 + Math.random() * 6.00).toFixed(2));
  }
}

/**
 * Creates a new Crash room
 */
export async function createCrashRoom(
  hostPlayer: { id: string; name: string; avatarIcon: string; color: string },
  settings: CrashMatchSettings,
  autoAddBot?: boolean,
  botStyle: CrashBotStyle = 'prudent'
): Promise<string> {
  const code = generateRoomCode();
  const roomRef = doc(db, 'crash_rooms', code);

  const initialHostState: CrashPlayerState = {
    id: hostPlayer.id,
    name: hostPlayer.name,
    avatarIcon: hostPlayer.avatarIcon,
    color: hostPlayer.color,
    isHost: true,
    connected: true,
    autoCashoutEnabled: false,
    autoCashoutTarget: 2.00,
    cashedOutAt: null,
    score: 0,
    roundSipsToDrink: 0,
    totalGuriAcumulate: 0,
    chickenStreak: 0,
    isReadyNextRound: false,
  };

  const initialPlayers: CrashPlayerState[] = [initialHostState];

  if (autoAddBot) {
    const botName = botStyle === 'risky' ? 'Dragonul Înflăcărat (Bot)' : 'Fratele Prudent (Bot)';
    const botAvatar = botStyle === 'risky' ? 'wizard' : 'monk_drunk';
    const botPlayer: CrashPlayerState = {
      id: `bot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: botName,
      avatarIcon: botAvatar,
      color: botStyle === 'risky' ? '#e05c3a' : '#50e3c2',
      isHost: false,
      isBot: true,
      botStyle,
      connected: true,
      autoCashoutEnabled: true,
      autoCashoutTarget: generateBotTargetMultiplier(botStyle, settings.stakeMode),
      cashedOutAt: null,
      score: 0,
      roundSipsToDrink: 0,
      totalGuriAcumulate: 0,
      chickenStreak: 0,
      isReadyNextRound: true,
    };
    initialPlayers.push(botPlayer);
  }

  const initialStake = generateRoundStake(settings, 1);
  const initialRound: CrashRound = {
    roundNumber: 1,
    phase: 'prep',
    stakeType: initialStake.stakeType,
    betValue: initialStake.betValue,
    crashPoint: generateCrashPoint(settings.stakeMode),
    roundStartTimestamp: Date.now(),
    isGroapaRound: initialStake.stakeType === 'groapa',
  };

  const roomState: CrashRoomState = {
    code,
    hostPlayerId: hostPlayer.id,
    players: initialPlayers,
    settings: {
      sipsThreshold: settings.sipsThreshold || 30,
      stakeMode: settings.stakeMode || 'dynamic',
      groapaThreshold: settings.groapaThreshold || 3,
    },
    status: autoAddBot ? 'in_game' : 'lobby',
    currentRound: initialRound,
    winnerId: null,
    loserId: null,
    history: [],
  };

  await setDoc(roomRef, cleanFirestoreData({
    ...roomState,
    updatedAt: serverTimestamp(),
  }));

  return code;
}

/**
 * Joins an existing Crash room (supports up to 6 players)
 */
export async function joinCrashRoom(
  code: string,
  guestPlayer: { id: string; name: string; avatarIcon: string; color: string }
): Promise<{ success: boolean; error?: string }> {
  const cleanCode = code.trim().toUpperCase();
  const roomRef = doc(db, 'crash_rooms', cleanCode);

  try {
    return await runTransaction(db, async transaction => {
      const snap = await transaction.get(roomRef);
      if (!snap.exists()) {
        return { success: false, error: 'Chilia / Camera nu a fost găsită!' };
      }

      const data = snap.data() as CrashRoomState;

      const existingIdx = data.players.findIndex(p => p.id === guestPlayer.id);
      if (existingIdx !== -1) {
        // Reconnect player
        const updatedPlayers = [...data.players];
        updatedPlayers[existingIdx] = {
          ...updatedPlayers[existingIdx],
          connected: true,
          name: guestPlayer.name,
          avatarIcon: guestPlayer.avatarIcon,
          color: guestPlayer.color,
        };
        transaction.update(roomRef, {
          players: updatedPlayers,
          updatedAt: serverTimestamp(),
        });
        return { success: true };
      }

      if (data.players.length >= 6) {
        return { success: false, error: 'Camera este deja plină (maxim 6 jucători)!' };
      }

      const newGuestState: CrashPlayerState = {
        id: guestPlayer.id,
        name: guestPlayer.name,
        avatarIcon: guestPlayer.avatarIcon,
        color: guestPlayer.color,
        isHost: false,
        connected: true,
        autoCashoutEnabled: false,
        autoCashoutTarget: 2.00,
        cashedOutAt: null,
        score: 0,
        roundSipsToDrink: 0,
        totalGuriAcumulate: 0,
        chickenStreak: 0,
        isReadyNextRound: false,
      };

      const updatedPlayers = [...data.players, newGuestState];
      transaction.update(roomRef, {
        players: updatedPlayers,
        updatedAt: serverTimestamp(),
      });

      return { success: true };
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `crash_rooms/${cleanCode}`);
    return { success: false, error: 'Eroare la conectare!' };
  }
}

const BOT_PRESETS = [
  { name: 'Fratele Prudent (Bot)', avatar: 'monk_drunk', color: '#50e3c2', style: 'prudent' as CrashBotStyle },
  { name: 'Dragonul Înflăcărat (Bot)', avatar: 'wizard', color: '#e05c3a', style: 'risky' as CrashBotStyle },
  { name: 'Diaconul Calculat (Bot)', avatar: 'monk_old', color: '#4a90e2', style: 'prudent' as CrashBotStyle },
  { name: 'Starețul Îndrăzneț (Bot)', avatar: 'king', color: '#f5a623', style: 'risky' as CrashBotStyle },
  { name: 'Pelerinul Neînfricat (Bot)', avatar: 'knight', color: '#bd10e0', style: 'risky' as CrashBotStyle },
  { name: 'Ieromonahul Înțelept (Bot)', avatar: 'monk_hood', color: '#7ed321', style: 'prudent' as CrashBotStyle },
];

/**
 * Adds an AI Bot player to the Crash room (supports up to 6 players total)
 */
export async function addCrashBot(
  code: string,
  botStyle: CrashBotStyle = 'prudent'
): Promise<void> {
  const cleanCode = code.trim().toUpperCase();
  const roomRef = doc(db, 'crash_rooms', cleanCode);

  const snap = await getDoc(roomRef);
  if (!snap.exists()) return;
  const currentPlayers = (snap.data() as CrashRoomState).players || [];
  if (currentPlayers.length >= 6) return;

  const existingBotCount = currentPlayers.filter(p => p.isBot).length;
  const matchedPresets = BOT_PRESETS.filter(p => p.style === botStyle);
  const preset = matchedPresets[existingBotCount % matchedPresets.length] || BOT_PRESETS[existingBotCount % BOT_PRESETS.length];

  const botPlayer: CrashPlayerState = {
    id: `bot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: preset.name,
    avatarIcon: preset.avatar,
    color: preset.color,
    isHost: false,
    isBot: true,
    botStyle,
    connected: true,
    autoCashoutEnabled: true,
    autoCashoutTarget: generateBotTargetMultiplier(botStyle),
    cashedOutAt: null,
    score: 0,
    roundSipsToDrink: 0,
    totalGuriAcumulate: 0,
    chickenStreak: 0,
    isReadyNextRound: true,
  };

  await updateDoc(roomRef, {
    players: [...currentPlayers, botPlayer],
    updatedAt: serverTimestamp(),
  });
}

/**
 * Removes a player or bot from the room in lobby (Host action)
 */
export async function removeCrashPlayer(code: string, playerId: string): Promise<void> {
  const cleanCode = code.trim().toUpperCase();
  const roomRef = doc(db, 'crash_rooms', cleanCode);

  const snap = await getDoc(roomRef);
  if (!snap.exists()) return;
  const currentPlayers = (snap.data() as CrashRoomState).players || [];

  const updatedPlayers = currentPlayers.filter(p => p.id !== playerId);
  await updateDoc(roomRef, {
    players: updatedPlayers,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Subscribes to real-time room updates
 */
export function subscribeToCrashRoom(
  code: string,
  callback: (room: CrashRoomState | null) => void,
  onError?: (error: any) => void
): () => void {
  const cleanCode = code.trim().toUpperCase();
  const roomRef = doc(db, 'crash_rooms', cleanCode);

  return onSnapshot(
    roomRef,
    docSnap => {
      if (docSnap.exists()) {
        callback(docSnap.data() as CrashRoomState);
      } else {
        callback(null);
      }
    },
    error => {
      console.warn('Crash room snapshot error:', error);
      if (onError) {
        onError(error);
      }
      handleFirestoreError(error, OperationType.GET, `crash_rooms/${cleanCode}`);
    }
  );
}

/**
 * Starts the Crash match (transitions from lobby to game prep)
 */
export async function startCrashMatch(code: string): Promise<void> {
  const cleanCode = code.trim().toUpperCase();
  const roomRef = doc(db, 'crash_rooms', cleanCode);
  await syncServerClock();

  const snap = await getDoc(roomRef);
  if (!snap.exists()) return;
  const data = snap.data() as CrashRoomState;

  // Initialize bot target if bot present
  const players = data.players.map(p => {
    if (p.isBot) {
      return {
        ...p,
        autoCashoutTarget: generateBotTargetMultiplier(p.botStyle, data.settings?.stakeMode),
      };
    }
    return p;
  });

  const firstStake = generateRoundStake(data.settings, 1);
  const firstRound: CrashRound = {
    roundNumber: 1,
    phase: 'prep',
    stakeType: firstStake.stakeType,
    betValue: firstStake.betValue,
    crashPoint: generateCrashPoint(data.settings?.stakeMode),
    roundStartTimestamp: getSyncedServerNow(),
    isGroapaRound: firstStake.stakeType === 'groapa',
  };

  await updateDoc(roomRef, {
    status: 'in_game',
    players,
    currentRound: firstRound,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Transitions round from 'prep' to 'flying'
 */
export async function startFlyingPhase(code: string): Promise<void> {
  const cleanCode = code.trim().toUpperCase();
  const roomRef = doc(db, 'crash_rooms', cleanCode);
  const now = getSyncedServerNow();

  try {
    const snap = await getDoc(roomRef);
    if (!snap.exists()) return;
    const room = snap.data() as CrashRoomState;

    await updateDoc(roomRef, {
      currentRound: {
        ...room.currentRound,
        phase: 'flying',
        roundStartTimestamp: now,
      },
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error('startFlyingPhase error:', err);
  }
}

/**
 * Handles player cashout during flight
 */
export async function playerCashOut(
  code: string,
  playerId: string,
  cashedMultiplier: number
): Promise<{ success: boolean; multiplier: number; score: number }> {
  const cleanCode = code.trim().toUpperCase();
  const roomRef = doc(db, 'crash_rooms', cleanCode);

  try {
    return await runTransaction(db, async transaction => {
      const snap = await transaction.get(roomRef);
      if (!snap.exists()) return { success: false, multiplier: 0, score: 0 };
      const room = snap.data() as CrashRoomState;

      if (room.currentRound.phase !== 'flying') {
        return { success: false, multiplier: 0, score: 0 };
      }

      // Check if multiplier reached or exceeded crash point (strict cashout before crash rule)
      if (cashedMultiplier >= room.currentRound.crashPoint) {
        return { success: false, multiplier: 0, score: 0 };
      }

      // Also verify server elapsed flight time
      const now = getSyncedServerNow();
      const flightElapsedSec = Math.max(0, (now - room.currentRound.roundStartTimestamp) / 1000);
      const serverCurrentMult = calculateMultiplier(flightElapsedSec);
      if (serverCurrentMult >= room.currentRound.crashPoint) {
        return { success: false, multiplier: 0, score: 0 };
      }

      const safeMultiplier = Math.min(cashedMultiplier, serverCurrentMult, Number((room.currentRound.crashPoint - 0.01).toFixed(2)));
      if (safeMultiplier < 1.00) {
        return { success: false, multiplier: 0, score: 0 };
      }

      const pIdx = room.players.findIndex(p => p.id === playerId);
      if (pIdx === -1) return { success: false, multiplier: 0, score: 0 };

      // Prevent double cashout
      if (room.players[pIdx].cashedOutAt != null) {
        return {
          success: true,
          multiplier: room.players[pIdx].cashedOutAt!,
          score: room.players[pIdx].score,
        };
      }

      const score = Number((room.currentRound.betValue * safeMultiplier).toFixed(1));
      
      // Update Chicken streak:
      // If cashout is < 1.50 -> increment streak
      // If cashout >= 1.50 -> reset to 0
      const prevStreak = room.players[pIdx].chickenStreak || 0;
      const newStreak = safeMultiplier < 1.50 ? prevStreak + 1 : 0;

      const updatedPlayers = [...room.players];
      updatedPlayers[pIdx] = {
        ...updatedPlayers[pIdx],
        cashedOutAt: safeMultiplier,
        score,
        chickenStreak: newStreak,
      };

      transaction.update(roomRef, {
        players: updatedPlayers,
        updatedAt: serverTimestamp(),
      });

      return { success: true, multiplier: safeMultiplier, score };
    });
  } catch (err) {
    console.error('playerCashOut error:', err);
    return { success: false, multiplier: 0, score: 0 };
  }
}

/**
 * Triggers crash when multiplier hits crash point or timeout occurs
 */
export async function crashDragon(code: string): Promise<void> {
  const cleanCode = code.trim().toUpperCase();
  const roomRef = doc(db, 'crash_rooms', cleanCode);

  try {
    await runTransaction(db, async transaction => {
      const snap = await transaction.get(roomRef);
      if (!snap.exists()) return;
      const room = snap.data() as CrashRoomState;

      if (room.currentRound.phase !== 'flying') return;

      // Anyone who didn't cash out gets score 0 and chicken streak resets to 0
      const updatedPlayers = room.players.map(p => {
        if (p.cashedOutAt == null) {
          return {
            ...p,
            score: 0,
            chickenStreak: 0, // Reset streak because crashed without cashing out
          };
        }
        return p;
      });

      const updatedRound: CrashRound = {
        ...room.currentRound,
        phase: 'crashed',
        crashedAtTimestamp: getSyncedServerNow(),
      };

      transaction.update(roomRef, {
        currentRound: updatedRound,
        players: updatedPlayers,
        updatedAt: serverTimestamp(),
      });
    });
  } catch (err) {
    console.error('crashDragon transaction error, attempting fallback update:', err);
    try {
      const snap = await getDoc(roomRef);
      if (snap.exists()) {
        const room = snap.data() as CrashRoomState;
        if (room.currentRound.phase === 'flying') {
          const updatedPlayers = room.players.map(p => {
            if (p.cashedOutAt == null) {
              return { ...p, score: 0, chickenStreak: 0 };
            }
            return p;
          });
          await updateDoc(roomRef, {
            currentRound: {
              ...room.currentRound,
              phase: 'crashed',
              crashedAtTimestamp: getSyncedServerNow(),
            },
            players: updatedPlayers,
            updatedAt: serverTimestamp(),
          });
        }
      }
    } catch (fallbackErr) {
      console.error('crashDragon fallback error:', fallbackErr);
    }
  }
}

/**
 * Resolves round scores, calculates drinking penalty and checks match end threshold
 * Supports both standard GURI and GROAPĂ rounds, and double crash penalty.
 */
export async function resolveCrashRound(code: string): Promise<void> {
  const cleanCode = code.trim().toUpperCase();
  const roomRef = doc(db, 'crash_rooms', cleanCode);

  try {
    await runTransaction(db, async transaction => {
      const snap = await transaction.get(roomRef);
      if (!snap.exists()) return;
      const room = snap.data() as CrashRoomState;

      if (room.currentRound.phase === 'resolved') return;

      const players = room.players;
      if (!players || players.length === 0) return;

      const round = room.currentRound;
      const isGroapaRound = round.stakeType === 'groapa' || round.isGroapaRound;
      const sipsThreshold = room.settings?.sipsThreshold || 30;
      const groapaThreshold = room.settings?.groapaThreshold || 3;
      const isGroapaMode = room.settings?.stakeMode === 'groapa';

      // Check if all players crashed (nobody cashed out)
      const allPlayersCrashed = players.every(p => p.cashedOutAt == null);

      let hasReachedThreshold = false;
      let worstPlayerId: string | null = null;
      let bestPlayerId: string | null = null;
      let maxGuri = -1;
      let minGuri = Infinity;

      let updatedPlayers: CrashPlayerState[] = [];

      if (isGroapaRound) {
        // === GROAPĂ ROUND RULES ===
        // "cand se joaca la groapa, castiga cel care a dat cash out mai târziu, sau daca unul a dat cash out si celalalt crash. daca dau ambii crash ambii dau groapa. la crash groapa ar trebui sa se contorizeze 25 de guri"
        const GROAPA_SIP_EQUIVALENT = 25;
        if (allPlayersCrashed) {
          // Both crashed: AMBII DAU GROAPA!
          updatedPlayers = players.map(p => {
            const newGroapaTotal = (p.totalGroapaAcumulate || 0) + 1;
            const newGuriTotal = Number(((p.totalGuriAcumulate || 0) + GROAPA_SIP_EQUIVALENT).toFixed(1));
            return {
              ...p,
              roundGroapaToDrink: 1,
              roundSipsToDrink: GROAPA_SIP_EQUIVALENT,
              totalGroapaAcumulate: newGroapaTotal,
              totalGuriAcumulate: newGuriTotal,
            };
          });
        } else {
          // Find the player who cashed out latest (highest multiplier)
          const highestMultiplier = Math.max(...players.map(p => p.cashedOutAt || 0));

          updatedPlayers = players.map(p => {
            const myMult = p.cashedOutAt || 0;
            // If cashed out at highest multiplier and > 0 -> winner of groapa round (no groapa)
            const isWinner = myMult === highestMultiplier && myMult > 0;
            const groapaToDrink = isWinner ? 0 : 1;
            const sipsEquiv = isWinner ? 0 : GROAPA_SIP_EQUIVALENT;
            const newGroapaTotal = (p.totalGroapaAcumulate || 0) + groapaToDrink;
            const newGuriTotal = Number(((p.totalGuriAcumulate || 0) + sipsEquiv).toFixed(1));

            return {
              ...p,
              roundGroapaToDrink: groapaToDrink,
              roundSipsToDrink: sipsEquiv,
              totalGroapaAcumulate: newGroapaTotal,
              totalGuriAcumulate: newGuriTotal,
            };
          });
        }
      } else {
        // === GURI ROUND RULES ===
        // "daca ambii jucatori pierd intr o runda, ambii beau miza, si se adauga si la totalul de guri."
        // "daca trebuia sa dai intr o tura 13.7 guri aproximeaza in sus orice este peste x.5 si in jos orice este sub. la puncte contorizam in continuare cu zecimale."
        if (allPlayersCrashed) {
          const stake = Math.round(round.betValue || 1);
          updatedPlayers = players.map(p => {
            const newTotal = (p.totalGuriAcumulate || 0) + stake;
            return {
              ...p,
              roundGroapaToDrink: 0,
              roundSipsToDrink: stake,
              totalGuriAcumulate: newTotal,
            };
          });
        } else {
          const maxScore = Math.max(...players.map(p => p.score || 0));
          updatedPlayers = players.map(p => {
            const myScore = p.score || 0;
            const diff = Math.max(0, maxScore - myScore);
            // Standard math rounding: >= x.5 up, < x.5 down
            const sipsToDrink = Math.round(diff);
            const newTotal = (p.totalGuriAcumulate || 0) + sipsToDrink;
            return {
              ...p,
              roundGroapaToDrink: 0,
              roundSipsToDrink: sipsToDrink,
              totalGuriAcumulate: newTotal,
            };
          });
        }
      }

      // Check match defeat thresholds
      updatedPlayers.forEach(p => {
        const groapaReached = isGroapaMode && (p.totalGroapaAcumulate || 0) >= groapaThreshold;
        const guriReached = (p.totalGuriAcumulate || 0) >= sipsThreshold;

        if (groapaReached || guriReached) {
          hasReachedThreshold = true;
        }

        const effectiveGuri = (p.totalGuriAcumulate || 0) + (p.totalGroapaAcumulate || 0) * 25;
        if (effectiveGuri > maxGuri) {
          maxGuri = effectiveGuri;
          worstPlayerId = p.id;
        }
        if (effectiveGuri < minGuri) {
          minGuri = effectiveGuri;
          bestPlayerId = p.id;
        }
      });

      let newStatus: 'in_game' | 'finished' = 'in_game';
      let winnerId: string | null = null;
      let loserId: string | null = null;

      if (hasReachedThreshold) {
        newStatus = 'finished';
        loserId = worstPlayerId;
        winnerId = bestPlayerId;
      }

      const updatedRound: CrashRound = {
        ...room.currentRound,
        phase: 'resolved',
        bothCrashed: allPlayersCrashed,
      };

      const existingHistory = room.history || [];
      const currentRoundNumber = room.currentRound.roundNumber || 1;
      const historyItem = {
        roundNumber: currentRoundNumber,
        multiplier: room.currentRound.crashPoint,
        stakeType: room.currentRound.stakeType,
        betValue: room.currentRound.betValue,
      };
      const updatedHistory = existingHistory.some(h => h.roundNumber === currentRoundNumber)
        ? existingHistory
        : [...existingHistory, historyItem];

      transaction.update(roomRef, {
        currentRound: updatedRound,
        status: newStatus,
        winnerId: winnerId || null,
        loserId: loserId || null,
        players: updatedPlayers,
        history: updatedHistory,
        updatedAt: serverTimestamp(),
      });
    });
  } catch (err) {
    console.error('resolveCrashRound transaction error, attempting fallback update:', err);
    try {
      const snap = await getDoc(roomRef);
      if (snap.exists()) {
        const room = snap.data() as CrashRoomState;
        if (room.currentRound.phase !== 'resolved') {
          const players = room.players || [];
          const round = room.currentRound;
          const isGroapaRound = round.stakeType === 'groapa' || round.isGroapaRound;
          const sipsThreshold = room.settings?.sipsThreshold || 30;
          const groapaThreshold = room.settings?.groapaThreshold || 3;
          const isGroapaMode = room.settings?.stakeMode === 'groapa';
          const allPlayersCrashed = players.every(p => p.cashedOutAt == null);

          let updatedPlayers: CrashPlayerState[] = [];

          if (isGroapaRound) {
            const GROAPA_SIP_EQUIVALENT = 25;
            if (allPlayersCrashed) {
              updatedPlayers = players.map(p => ({
                ...p,
                roundGroapaToDrink: 1,
                roundSipsToDrink: GROAPA_SIP_EQUIVALENT,
                totalGroapaAcumulate: (p.totalGroapaAcumulate || 0) + 1,
                totalGuriAcumulate: Number(((p.totalGuriAcumulate || 0) + GROAPA_SIP_EQUIVALENT).toFixed(1)),
              }));
            } else {
              const highestMultiplier = Math.max(...players.map(p => p.cashedOutAt || 0));
              updatedPlayers = players.map(p => {
                const myMult = p.cashedOutAt || 0;
                const isWinner = myMult === highestMultiplier && myMult > 0;
                const groapa = isWinner ? 0 : 1;
                const sips = isWinner ? 0 : GROAPA_SIP_EQUIVALENT;
                return {
                  ...p,
                  roundGroapaToDrink: groapa,
                  roundSipsToDrink: sips,
                  totalGroapaAcumulate: (p.totalGroapaAcumulate || 0) + groapa,
                  totalGuriAcumulate: Number(((p.totalGuriAcumulate || 0) + sips).toFixed(1)),
                };
              });
            }
          } else {
            if (allPlayersCrashed) {
              const stake = Math.round(round.betValue || 1);
              updatedPlayers = players.map(p => ({
                ...p,
                roundGroapaToDrink: 0,
                roundSipsToDrink: stake,
                totalGuriAcumulate: (p.totalGuriAcumulate || 0) + stake,
              }));
            } else {
              const maxScore = Math.max(...players.map(p => p.score || 0));
              updatedPlayers = players.map(p => {
                const myScore = p.score || 0;
                const diff = Math.max(0, maxScore - myScore);
                const sips = Math.round(diff);
                return {
                  ...p,
                  roundGroapaToDrink: 0,
                  roundSipsToDrink: sips,
                  totalGuriAcumulate: (p.totalGuriAcumulate || 0) + sips,
                };
              });
            }
          }

          let hasReachedThreshold = false;
          let worstPlayerId: string | null = null;
          let bestPlayerId: string | null = null;
          let maxGuri = -1;
          let minGuri = Infinity;

          updatedPlayers.forEach(p => {
            const groapaReached = isGroapaMode && (p.totalGroapaAcumulate || 0) >= groapaThreshold;
            const guriReached = (p.totalGuriAcumulate || 0) >= sipsThreshold;
            if (groapaReached || guriReached) hasReachedThreshold = true;
            const effective = (p.totalGuriAcumulate || 0) + (p.totalGroapaAcumulate || 0) * 25;
            if (effective > maxGuri) { maxGuri = effective; worstPlayerId = p.id; }
            if (effective < minGuri) { minGuri = effective; bestPlayerId = p.id; }
          });

          const fallbackHistory = room.history || [];
          const fbRoundNum = room.currentRound.roundNumber || 1;
          const fbHistoryItem = {
            roundNumber: fbRoundNum,
            multiplier: room.currentRound.crashPoint,
            stakeType: room.currentRound.stakeType,
            betValue: room.currentRound.betValue,
          };
          const fbUpdatedHistory = fallbackHistory.some(h => h.roundNumber === fbRoundNum)
            ? fallbackHistory
            : [...fallbackHistory, fbHistoryItem];

          await updateDoc(roomRef, {
            currentRound: {
              ...room.currentRound,
              phase: 'resolved',
              bothCrashed: allPlayersCrashed,
            },
            status: hasReachedThreshold ? 'finished' : 'in_game',
            winnerId: hasReachedThreshold ? bestPlayerId : null,
            loserId: hasReachedThreshold ? worstPlayerId : null,
            players: updatedPlayers,
            history: fbUpdatedHistory,
            updatedAt: serverTimestamp(),
          });
        }
      }
    } catch (fallbackErr) {
      console.error('resolveCrashRound fallback error:', fallbackErr);
    }
  }
}

/**
 * Starts the next Crash round
 */
export async function startNextCrashRound(code: string): Promise<void> {
  const cleanCode = code.trim().toUpperCase();
  const roomRef = doc(db, 'crash_rooms', cleanCode);

  const snap = await getDoc(roomRef);
  if (!snap.exists()) return;
  const room = snap.data() as CrashRoomState;

  if (room.status === 'finished') return;

  const nextRoundNumber = (room.currentRound.roundNumber || 1) + 1;
  const pastGropiCount = (room.history || []).filter(h => h.stakeType === 'groapa').length;
  const currentIsGroapa = (room.currentRound?.stakeType === 'groapa' || room.currentRound?.isGroapaRound) ? 1 : 0;
  const totalGropiSoFar = pastGropiCount + currentIsGroapa;
  const pastPoints = (room.history || []).map((h) => h.multiplier);
  if (typeof room.currentRound?.crashPoint === 'number') {
    pastPoints.push(room.currentRound.crashPoint);
  }
  const nextStake = generateRoundStake(room.settings, nextRoundNumber, totalGropiSoFar);
  const newCrashPoint = generateCrashPoint(room.settings?.stakeMode, pastPoints);

  const resetPlayers = room.players.map(p => {
    return {
      ...p,
      cashedOutAt: null,
      score: 0,
      roundSipsToDrink: 0,
      roundGroapaToDrink: 0,
      chickenStreak: (p.chickenStreak && p.chickenStreak >= 3) ? 0 : (p.chickenStreak || 0),
      isReadyNextRound: p.isBot ? true : false,
      autoCashoutTarget: p.isBot
        ? generateBotTargetMultiplier(p.botStyle, room.settings?.stakeMode)
        : p.autoCashoutTarget || 2.00,
    };
  });

  const nextRound: CrashRound = {
    roundNumber: nextRoundNumber,
    phase: 'prep',
    stakeType: nextStake.stakeType,
    betValue: nextStake.betValue,
    crashPoint: newCrashPoint,
    roundStartTimestamp: getSyncedServerNow(),
    isGroapaRound: nextStake.stakeType === 'groapa',
  };

  await updateDoc(roomRef, {
    currentRound: nextRound,
    players: resetPlayers,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Updates player preferences (auto-cashout target & toggle)
 */
export async function updateCrashPlayerSettings(
  code: string,
  playerId: string,
  autoCashoutEnabled: boolean,
  autoCashoutTarget: number
): Promise<void> {
  const cleanCode = code.trim().toUpperCase();
  const roomRef = doc(db, 'crash_rooms', cleanCode);

  const snap = await getDoc(roomRef);
  if (!snap.exists()) return;
  const room = snap.data() as CrashRoomState;

  const updatedPlayers = room.players.map(p => {
    if (p.id === playerId) {
      return {
        ...p,
        autoCashoutEnabled,
        autoCashoutTarget,
      };
    }
    return p;
  });

  await updateDoc(roomRef, {
    players: updatedPlayers,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Resets chicken streak after easter egg modal is acknowledged
 */
export async function resetChickenStreak(
  code: string,
  playerId: string
): Promise<void> {
  const cleanCode = code.trim().toUpperCase();
  const roomRef = doc(db, 'crash_rooms', cleanCode);

  try {
    const snap = await getDoc(roomRef);
    if (!snap.exists()) return;
    const room = snap.data() as CrashRoomState;

    const updatedPlayers = room.players.map(p => {
      if (p.id === playerId) {
        return {
          ...p,
          chickenStreak: 0,
        };
      }
      return p;
    });

    await updateDoc(roomRef, {
      players: updatedPlayers,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('resetChickenStreak error:', err);
  }
}

/**
 * Leaves a Crash room
 */
export async function leaveCrashRoom(
  code: string,
  playerId: string
): Promise<void> {
  const cleanCode = code.trim().toUpperCase();
  const roomRef = doc(db, 'crash_rooms', cleanCode);

  try {
    const snap = await getDoc(roomRef);
    if (!snap.exists()) return;
    const room = snap.data() as CrashRoomState;

    if (room.players.length <= 1 || room.hostPlayerId === playerId) {
      await deleteDoc(roomRef);
    } else {
      const remainingPlayers = room.players.filter(p => p.id !== playerId);
      await updateDoc(roomRef, {
        players: remainingPlayers,
        status: 'lobby',
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    console.warn('Error leaving crash room:', err);
  }
}

/**
 * Broadcasts an instant Tavern Emote reaction across Crash room.
 */
export async function sendCrashEmote(code: string, emote: TavernEmoteMessage): Promise<void> {
  const cleanCode = code.trim().toUpperCase();
  const roomRef = doc(db, 'crash_rooms', cleanCode);
  try {
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
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('[Crash] Error sending emote:', err);
  }
}
