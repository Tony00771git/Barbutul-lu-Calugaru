/**
 * Head-to-Head (1v1) Score Tracker Service
 * Tracks persistent rivalry records, win/loss stats, and mode breakdowns
 * between any 2 player profiles when they meet in a 1v1 match (Duel, Casino, Boardgame, Normal).
 */

export interface ModeHeadToHead {
  p1Wins: number;
  p2Wins: number;
}

export interface StoredH2HRecord {
  player1Name: string; // Lexicographical first name
  player2Name: string; // Lexicographical second name
  player1Wins: number;
  player2Wins: number;
  ties: number;
  totalMatches: number;
  duel: ModeHeadToHead;
  casino: ModeHeadToHead;
  boardgame: ModeHeadToHead;
  normal: ModeHeadToHead;
  lastMatchAt: number;
  lastWinnerName?: string;
}

export interface PlayerHeadToHeadStats {
  player1Name: string; // Perspective player 1 (e.g. Host / Local)
  player2Name: string; // Perspective player 2 (e.g. Opponent)
  player1Wins: number;
  player2Wins: number;
  ties: number;
  totalMatches: number;
  modeBreakdown: {
    duel: { p1: number; p2: number };
    casino: { p1: number; p2: number };
    boardgame: { p1: number; p2: number };
    normal: { p1: number; p2: number };
  };
  lastMatchAt?: number;
  lastWinnerName?: string;
}

const STORAGE_KEY = 'barbut_monk_head_to_head_records';

/**
 * Normalizes two player names and returns a consistent lookup key + ordering flag
 */
export function getH2HKey(nameA: string, nameB: string): { key: string; isSwapped: boolean } {
  const normA = (nameA || '').trim();
  const normB = (nameB || '').trim();
  const lowerA = normA.toLowerCase();
  const lowerB = normB.toLowerCase();

  if (lowerA <= lowerB) {
    return { key: `${lowerA}__vs__${lowerB}`, isSwapped: false };
  } else {
    return { key: `${lowerB}__vs__${lowerA}`, isSwapped: true };
  }
}

function loadAllRecords(): Record<string, StoredH2HRecord> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load H2H records', e);
  }
  return {};
}

function saveAllRecords(records: Record<string, StoredH2HRecord>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save H2H records', e);
  }
}

/**
 * Retrieves head-to-head stats formatted for the requested player perspective (nameA as P1, nameB as P2)
 */
export function getHeadToHeadStats(nameA: string, nameB: string): PlayerHeadToHeadStats {
  const normA = (nameA || '').trim();
  const normB = (nameB || '').trim();

  if (!normA || !normB || normA.toLowerCase() === normB.toLowerCase()) {
    return {
      player1Name: normA || 'Jucător 1',
      player2Name: normB || 'Jucător 2',
      player1Wins: 0,
      player2Wins: 0,
      ties: 0,
      totalMatches: 0,
      modeBreakdown: {
        duel: { p1: 0, p2: 0 },
        casino: { p1: 0, p2: 0 },
        boardgame: { p1: 0, p2: 0 },
        normal: { p1: 0, p2: 0 },
      },
    };
  }

  const { key, isSwapped } = getH2HKey(normA, normB);
  const records = loadAllRecords();
  const stored = records[key];

  if (!stored) {
    return {
      player1Name: normA,
      player2Name: normB,
      player1Wins: 0,
      player2Wins: 0,
      ties: 0,
      totalMatches: 0,
      modeBreakdown: {
        duel: { p1: 0, p2: 0 },
        casino: { p1: 0, p2: 0 },
        boardgame: { p1: 0, p2: 0 },
        normal: { p1: 0, p2: 0 },
      },
    };
  }

  // If the internal storage is ordered opposite to nameA vs nameB, swap values for caller perspective
  const p1Wins = isSwapped ? stored.player2Wins : stored.player1Wins;
  const p2Wins = isSwapped ? stored.player1Wins : stored.player2Wins;

  return {
    player1Name: normA,
    player2Name: normB,
    player1Wins: p1Wins || 0,
    player2Wins: p2Wins || 0,
    ties: stored.ties || 0,
    totalMatches: stored.totalMatches || 0,
    modeBreakdown: {
      duel: {
        p1: isSwapped ? stored.duel?.p2Wins || 0 : stored.duel?.p1Wins || 0,
        p2: isSwapped ? stored.duel?.p1Wins || 0 : stored.duel?.p2Wins || 0,
      },
      casino: {
        p1: isSwapped ? stored.casino?.p2Wins || 0 : stored.casino?.p1Wins || 0,
        p2: isSwapped ? stored.casino?.p1Wins || 0 : stored.casino?.p2Wins || 0,
      },
      boardgame: {
        p1: isSwapped ? stored.boardgame?.p2Wins || 0 : stored.boardgame?.p1Wins || 0,
        p2: isSwapped ? stored.boardgame?.p1Wins || 0 : stored.boardgame?.p2Wins || 0,
      },
      normal: {
        p1: isSwapped ? stored.normal?.p2Wins || 0 : stored.normal?.p1Wins || 0,
        p2: isSwapped ? stored.normal?.p1Wins || 0 : stored.normal?.p2Wins || 0,
      },
    },
    lastMatchAt: stored.lastMatchAt,
    lastWinnerName: stored.lastWinnerName,
  };
}

/**
 * Records a 1v1 match outcome between two players
 */
export function recordHeadToHeadMatch(
  playerAName: string,
  playerBName: string,
  winnerName: string | null,
  mode: 'duel' | 'casino' | 'boardgame' | 'normal' = 'duel',
  isTie = false
): PlayerHeadToHeadStats {
  const normA = (playerAName || '').trim();
  const normB = (playerBName || '').trim();

  if (!normA || !normB || normA.toLowerCase() === normB.toLowerCase()) {
    return getHeadToHeadStats(normA, normB);
  }

  const { key, isSwapped } = getH2HKey(normA, normB);
  const records = loadAllRecords();

  const existing: StoredH2HRecord = records[key] || {
    player1Name: isSwapped ? normB : normA,
    player2Name: isSwapped ? normA : normB,
    player1Wins: 0,
    player2Wins: 0,
    ties: 0,
    totalMatches: 0,
    duel: { p1Wins: 0, p2Wins: 0 },
    casino: { p1Wins: 0, p2Wins: 0 },
    boardgame: { p1Wins: 0, p2Wins: 0 },
    normal: { p1Wins: 0, p2Wins: 0 },
    lastMatchAt: Date.now(),
  };

  existing.totalMatches = (existing.totalMatches || 0) + 1;
  existing.lastMatchAt = Date.now();

  if (!existing[mode]) {
    existing[mode] = { p1Wins: 0, p2Wins: 0 };
  }

  if (isTie || !winnerName) {
    existing.ties = (existing.ties || 0) + 1;
    existing.lastWinnerName = undefined;
  } else {
    const winnerLower = winnerName.trim().toLowerCase();
    const isP1Winner = winnerLower === existing.player1Name.trim().toLowerCase();
    const isP2Winner = winnerLower === existing.player2Name.trim().toLowerCase();

    if (isP1Winner) {
      existing.player1Wins = (existing.player1Wins || 0) + 1;
      existing[mode].p1Wins = (existing[mode].p1Wins || 0) + 1;
      existing.lastWinnerName = existing.player1Name;
    } else if (isP2Winner) {
      existing.player2Wins = (existing.player2Wins || 0) + 1;
      existing[mode].p2Wins = (existing[mode].p2Wins || 0) + 1;
      existing.lastWinnerName = existing.player2Name;
    }
  }

  records[key] = existing;
  saveAllRecords(records);

  return getHeadToHeadStats(normA, normB);
}

/**
 * Resets all stored head-to-head statistics
 */
export function resetAllHeadToHead(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to reset H2H records', e);
  }
}
