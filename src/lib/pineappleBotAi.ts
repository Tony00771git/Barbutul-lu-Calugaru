import {
  PineappleBoard,
  PineappleBotDifficulty,
  PineapplePlayerState,
  PlayingCard,
  PlayingCardRank,
} from '../types';
import {
  CARD_RANKS,
  CARD_SUITS,
  RANK_VALUES,
  checkIsFoul,
  compareEvaluatedHands,
  compareTopVsMiddle,
  createDeck,
  evaluate3CardHand,
  evaluate5CardHand,
  EvaluatedHand,
  shuffleCards,
} from './pineapplePokerEvaluator';

export interface BotProfile {
  name: string;
  nameEn: string;
  avatarIcon: string;
  color: string;
  difficulty: PineappleBotDifficulty;
  titleRo: string;
  titleEn: string;
  descriptionRo: string;
  descriptionEn: string;
}

export const BOT_PROFILES: Record<PineappleBotDifficulty, BotProfile> = {
  easy: {
    name: 'Fratele Începător',
    nameEn: 'Novice Brother',
    avatarIcon: '🧘',
    color: '#10b981',
    difficulty: 'easy',
    titleRo: 'Ușor',
    titleEn: 'Easy',
    descriptionRo: 'Plasează simplist și predictibil. Verifică doar reguli evidente și poate greși la discard sau rata royalties.',
    descriptionEn: 'Plays simply and predictably. Only checks basic rules, may discard useful cards or miss royalties.',
  },
  medium: {
    name: 'Călugărul Arsenie',
    nameEn: 'Monk Arsenie',
    avatarIcon: '🧙‍♂️',
    color: '#f59e0b',
    difficulty: 'medium',
    titleRo: 'Mediu',
    titleEn: 'Medium',
    descriptionRo: 'Calculează scoruri statice complete: royalties, echilibru de forță pe rânduri și potențial de Fantezie.',
    descriptionEn: 'Calculates static heuristic scores: royalties, row balance safety, and Fantasy Land potential.',
  },
  hard: {
    name: 'Starețul Teofil',
    nameEn: 'Abbot Teofil',
    avatarIcon: '👑',
    color: '#ef4444',
    difficulty: 'hard',
    titleRo: 'Greu (Master)',
    titleEn: 'Hard (Master)',
    descriptionRo: 'Simulări Monte Carlo rapide, optimizează plasarea și discard-ul combinat și ține cont de cărțile vizibile ale adversarului.',
    descriptionEn: 'Monte Carlo simulations, joint placement & discard optimization, actively tracks opponent open-face cards.',
  },
};

/**
 * Returns realistic artificial thinking delay in ms based on difficulty level
 */
export function getBotThinkingDelay(difficulty: PineappleBotDifficulty = 'medium'): number {
  switch (difficulty) {
    case 'easy':
      return 600 + Math.floor(Math.random() * 350); // ~0.6s - 0.95s
    case 'medium':
      return 1000 + Math.floor(Math.random() * 450); // ~1.0s - 1.45s
    case 'hard':
      return 1700 + Math.floor(Math.random() * 700); // ~1.7s - 2.4s
    default:
      return 1000;
  }
}

/**
 * Clone board helper
 */
export function cloneBoard(board: PineappleBoard): PineappleBoard {
  return {
    top: [...board.top],
    middle: [...board.middle],
    bottom: [...board.bottom],
  };
}

/**
 * Total cards placed on board
 */
export function getBoardCount(board: PineappleBoard): number {
  return board.top.length + board.middle.length + board.bottom.length;
}

/**
 * Check if a row has space
 */
export function canAddToRow(board: PineappleBoard, row: 'top' | 'middle' | 'bottom'): boolean {
  if (row === 'top') return board.top.length < 3;
  return board[row].length < 5;
}

// ---------------------------------------------------------------------------
// 1. EVALUATION & HEURISTIC SCORING (Section 2 of Prompt)
// ---------------------------------------------------------------------------

/**
 * Evaluates the static heuristic value of a board state.
 * Takes into account:
 * - Royalty points earned
 * - Risk of foul (Top <= Middle <= Bottom)
 * - Potential for Fantasy Land (QQ+ on Top)
 * - Structural balance (Bottom strong > Middle medium > Top controlled)
 */
export function evaluateBoardHeuristic(
  board: PineappleBoard,
  opponentBoard?: PineappleBoard
): number {
  const topCount = board.top.length;
  const midCount = board.middle.length;
  const botCount = board.bottom.length;
  const isComplete = topCount === 3 && midCount === 5 && botCount === 5;

  const topEval = evaluate3CardHand(board.top);
  const midEval = evaluate5CardHand(board.middle, 'middle');
  const botEval = evaluate5CardHand(board.bottom, 'bottom');

  // Complete board evaluation
  if (isComplete) {
    const foulCheck = checkIsFoul(board.top, board.middle, board.bottom);
    if (foulCheck.isFoul) {
      return -500; // Severe foul penalty
    }

    let score = 0;
    // Royalties
    score += (topEval.royaltyPoints || 0) * 1.5;
    score += (midEval.royaltyPoints || 0) * 1.5;
    score += (botEval.royaltyPoints || 0) * 1.5;

    // Fantasy Land qualification bonus
    if (topEval.royaltyPoints >= 7) {
      score += 25; // Massive reward for achieving Fantasy Land legally!
    }

    // Comparison against opponent if available
    if (opponentBoard && getBoardCount(opponentBoard) === 13) {
      const oppTop = evaluate3CardHand(opponentBoard.top);
      const oppMid = evaluate5CardHand(opponentBoard.middle, 'middle');
      const oppBot = evaluate5CardHand(opponentBoard.bottom, 'bottom');

      const topDiff = compareEvaluatedHands(topEval, oppTop);
      const midDiff = compareEvaluatedHands(midEval, oppMid);
      const botDiff = compareEvaluatedHands(botEval, oppBot);

      let wins = 0;
      let losses = 0;
      if (topDiff > 0) wins++; else if (topDiff < 0) losses++;
      if (midDiff > 0) wins++; else if (midDiff < 0) losses++;
      if (botDiff > 0) wins++; else if (botDiff < 0) losses++;

      score += (wins - losses) * 2;
      if (wins === 3) score += 6; // Scoop bonus!
    }

    return score;
  }

  // Partial Board Heuristic
  let score = 0;

  // 1. Existing royalties
  score += (topEval.royaltyPoints || 0) * 1.2;
  score += (midEval.royaltyPoints || 0) * 1.2;
  score += (botEval.royaltyPoints || 0) * 1.2;

  // 2. Row strength hierarchy value
  const topStrength = topEval.categoryRank * 100 + (topEval.primaryRanks[0] || 0);
  const midStrength = midEval.categoryRank * 100 + (midEval.primaryRanks[0] || 0);
  const botStrength = botEval.categoryRank * 100 + (botEval.primaryRanks[0] || 0);

  // Bonus for natural pyramid strength: Bottom > Middle > Top
  if (botStrength >= midStrength && botCount >= 2) score += 8;
  if (midStrength >= topStrength && midCount >= 2) score += 6;

  // 3. Foul Risk Penalty (Incomplete Board)
  // Check if Top already beats Middle or Middle already beats Bottom when slots are filling up
  if (midCount >= 3 && topCount >= 1) {
    const topVsMid = compareTopVsMiddle(topEval, midEval);
    if (topVsMid > 0) {
      // Top is currently stronger than Middle
      const remainingMidSlots = 5 - midCount;
      if (remainingMidSlots === 0) {
        score -= 250; // Guaranteed foul
      } else {
        score -= 40 * (4 - remainingMidSlots);
      }
    }
  }

  if (botCount >= 3 && midCount >= 2) {
    const midVsBot = compareEvaluatedHands(midEval, botEval);
    if (midVsBot > 0) {
      // Middle is currently stronger than Bottom
      const remainingBotSlots = 5 - botCount;
      if (remainingBotSlots === 0) {
        score -= 250; // Guaranteed foul
      } else {
        score -= 35 * (4 - remainingBotSlots);
      }
    }
  }

  // 4. Fantasy Land Potential (QQ+ on Top)
  if (topCount >= 2 && topEval.categoryRank >= 1) {
    const highPairRank = topEval.primaryRanks[0] || 0;
    if (highPairRank >= 12) {
      // QQ, KK, AA on Top!
      // Only reward if Middle has high potential or strong pair
      const midSlots = 5 - midCount;
      const botSlots = 5 - botCount;
      if (botStrength >= 200 || botSlots >= 2) {
        score += (highPairRank - 11) * 6;
      } else {
        score -= 15; // Dangerous to put high pair on top when bottom is weak
      }
    }
  }

  // 5. Draw potential bonuses
  // Flush draw on bottom (4 of same suit)
  if (botCount >= 3 && botCount < 5) {
    const suits = board.bottom.map(c => c.suit);
    const suitCounts: Record<string, number> = {};
    suits.forEach(s => suitCounts[s] = (suitCounts[s] || 0) + 1);
    const maxSuit = Math.max(...Object.values(suitCounts));
    if (maxSuit === 4) score += 12;
    else if (maxSuit === 3 && botCount === 3) score += 5;
  }

  // Flush draw on middle
  if (midCount >= 3 && midCount < 5) {
    const suits = board.middle.map(c => c.suit);
    const suitCounts: Record<string, number> = {};
    suits.forEach(s => suitCounts[s] = (suitCounts[s] || 0) + 1);
    const maxSuit = Math.max(...Object.values(suitCounts));
    if (maxSuit === 4) score += 10;
  }

  return score;
}

// ---------------------------------------------------------------------------
// 2. EASY LEVEL BOT (Section 3: Easy)
// ---------------------------------------------------------------------------

/**
 * Decides moves for Easy Bot.
 * - Simple predictable priority: fills Bottom first, then Middle, then Top.
 * - Naive discard (lowest rank card that doesn't pair).
 * - Only checks obvious immediate fouls.
 */
export function decideEasyBotTurn(
  botState: PineapplePlayerState,
  currentRound: number
): { board: PineappleBoard; discarded: PlayingCard[] } {
  const board = cloneBoard(botState.board);
  const hand = [...(botState.currentHandCards || [])];
  const discarded = [...(botState.discarded || [])];

  const sortDesc = (cards: PlayingCard[]) =>
    [...cards].sort((a, b) => (RANK_VALUES[b.rank] || 0) - (RANK_VALUES[a.rank] || 0));

  // Fantasy Land for Easy Bot
  if (botState.inFantasyLand && hand.length >= 13) {
    const sorted = sortDesc(hand);
    // Find rank counts
    const counts: Record<string, PlayingCard[]> = {};
    for (const c of sorted) {
      if (!counts[c.rank]) counts[c.rank] = [];
      counts[c.rank].push(c);
    }
    const grouped = Object.values(counts).sort((a, b) => {
      if (b.length !== a.length) return b.length - a.length;
      return (RANK_VALUES[b[0].rank] || 0) - (RANK_VALUES[a[0].rank] || 0);
    });

    const flat = grouped.flat();
    board.bottom = flat.slice(0, 5);
    board.middle = flat.slice(5, 10);
    board.top = flat.slice(10, 13);
    if (flat.length > 13) {
      discarded.push(...flat.slice(13));
    }
    return { board, discarded };
  }

  // Round 1: 5 cards dealt
  if (currentRound === 1 && hand.length >= 5) {
    const sorted = sortDesc(hand);
    const counts: Record<string, PlayingCard[]> = {};
    for (const c of sorted) {
      if (!counts[c.rank]) counts[c.rank] = [];
      counts[c.rank].push(c);
    }
    const pairs = Object.values(counts).filter(arr => arr.length >= 2);

    if (pairs.length >= 1) {
      const bestPair = pairs[0];
      const remaining = sorted.filter(c => !bestPair.some(p => p.id === c.id));
      board.bottom = [...bestPair, remaining[0]];
      board.middle = remaining.slice(1, 3);
    } else {
      board.bottom = sorted.slice(0, 3);
      board.middle = sorted.slice(3, 5);
    }
    return { board, discarded };
  }

  // Rounds 2..5: 3 cards dealt -> pick 2 to place, 1 to discard
  if (hand.length >= 3) {
    const sorted = sortDesc(hand);

    // Naive Discard: find lowest card that doesn't match an existing pair on board
    let discardIndex = sorted.length - 1; // default lowest card
    for (let i = sorted.length - 1; i >= 0; i--) {
      const c = sorted[i];
      const matchesBot = board.bottom.some(b => b.rank === c.rank);
      const matchesMid = board.middle.some(b => b.rank === c.rank);
      const matchesTop = board.top.some(b => b.rank === c.rank);
      if (!matchesBot && !matchesMid && !matchesTop) {
        discardIndex = i;
        break;
      }
    }

    const toDiscard = sorted[discardIndex];
    const toPlace = sorted.filter((_, idx) => idx !== discardIndex);
    discarded.push(toDiscard);

    // Naive placement: fill Bottom, then Middle, then Top
    for (const card of toPlace) {
      if (canAddToRow(board, 'bottom')) {
        board.bottom.push(card);
      } else if (canAddToRow(board, 'middle')) {
        board.middle.push(card);
      } else if (canAddToRow(board, 'top')) {
        board.top.push(card);
      }
    }
  }

  return { board, discarded };
}

// ---------------------------------------------------------------------------
// 3. MEDIUM LEVEL BOT (Section 3: Medium)
// ---------------------------------------------------------------------------

/**
 * Decides moves for Medium Bot.
 * - Comprehensive static evaluation of all candidate placements and discards.
 * - Chooses highest static score combining royalties + foul risk + fantasy land.
 */
export function decideMediumBotTurn(
  botState: PineapplePlayerState,
  currentRound: number
): { board: PineappleBoard; discarded: PlayingCard[] } {
  const board = cloneBoard(botState.board);
  const hand = [...(botState.currentHandCards || [])];
  const discarded = [...(botState.discarded || [])];

  // Fantasy Land solver for Medium Bot
  if (botState.inFantasyLand && hand.length >= 13) {
    return solveBestFantasyLandPartition(hand);
  }

  // Round 1: 5 cards
  if (currentRound === 1 && hand.length >= 5) {
    let bestScore = -Infinity;
    let bestBoard = cloneBoard(board);

    // Evaluate valid distributions summing to 5
    // Top max 3, Middle max 5, Bottom max 5
    const distributions: Array<[number, number, number]> = [
      [0, 2, 3],
      [0, 3, 2],
      [1, 2, 2],
      [0, 1, 4],
      [0, 0, 5],
      [1, 1, 3],
      [2, 0, 3],
      [2, 1, 2],
      [1, 0, 4],
    ];

    // Permute sorted cards
    const sorted = [...hand].sort((a, b) => (RANK_VALUES[b.rank] || 0) - (RANK_VALUES[a.rank] || 0));

    // Try pair-aware combinations
    for (const [tCount, mCount, bCount] of distributions) {
      if (tCount + mCount + bCount !== 5) continue;
      const testBoard: PineappleBoard = {
        top: sorted.slice(0, tCount),
        middle: sorted.slice(tCount, tCount + mCount),
        bottom: sorted.slice(tCount + mCount),
      };

      const score = evaluateBoardHeuristic(testBoard);
      if (score > bestScore) {
        bestScore = score;
        bestBoard = testBoard;
      }
    }

    return { board: bestBoard, discarded };
  }

  // Rounds 2..5: 3 cards -> 3 discard choices, placing remaining 2 cards
  if (hand.length >= 3) {
    let bestScore = -Infinity;
    let bestBoard = cloneBoard(board);
    let bestDiscard: PlayingCard = hand[hand.length - 1];

    const rows: Array<'top' | 'middle' | 'bottom'> = ['top', 'middle', 'bottom'];

    // Test each candidate discard (3 choices)
    for (let dIdx = 0; dIdx < hand.length; dIdx++) {
      const candidateDiscard = hand[dIdx];
      const placeCards = hand.filter((_, idx) => idx !== dIdx);
      const [c1, c2] = placeCards;

      // Test all legal row assignments for c1 and c2
      for (const r1 of rows) {
        if (!canAddToRow(board, r1)) continue;

        const tempBoard1 = cloneBoard(board);
        tempBoard1[r1].push(c1);

        for (const r2 of rows) {
          if (!canAddToRow(tempBoard1, r2)) continue;

          const tempBoard2 = cloneBoard(tempBoard1);
          tempBoard2[r2].push(c2);

          const score = evaluateBoardHeuristic(tempBoard2);
          if (score > bestScore) {
            bestScore = score;
            bestBoard = tempBoard2;
            bestDiscard = candidateDiscard;
          }
        }
      }
    }

    discarded.push(bestDiscard);
    return { board: bestBoard, discarded };
  }

  return { board, discarded };
}

// ---------------------------------------------------------------------------
// 4. HARD LEVEL BOT (Section 3: Hard - Monte Carlo Engine & Joint Discard)
// ---------------------------------------------------------------------------

/**
 * Fast Monte Carlo rollout simulator for Hard Bot.
 * Runs 30-40 fast random completions of the remaining deck taking into
 * account open-face cards of both bot and opponent.
 */
export function simulateHardBotEV(
  candidateBoard: PineappleBoard,
  knownCards: Set<string>,
  opponentBoard?: PineappleBoard,
  numSimulations: number = 35
): number {
  const allCards = createDeck();
  // Filter out all known visible cards (bot board, opponent board, bot hand, discards)
  const unknownCards = allCards.filter(c => !knownCards.has(c.id));

  const slotsNeeded =
    (3 - candidateBoard.top.length) +
    (5 - candidateBoard.middle.length) +
    (5 - candidateBoard.bottom.length);

  if (slotsNeeded === 0) {
    return evaluateBoardHeuristic(candidateBoard, opponentBoard);
  }

  let totalEV = 0;

  for (let s = 0; s < numSimulations; s++) {
    // Fast partial shuffle of unknown cards
    const shuffled = shuffleCards(unknownCards);
    const simulatedBoard = cloneBoard(candidateBoard);
    let cardIdx = 0;

    // Fill remaining slots greedily
    while (simulatedBoard.bottom.length < 5 && cardIdx < shuffled.length) {
      simulatedBoard.bottom.push(shuffled[cardIdx++]);
    }
    while (simulatedBoard.middle.length < 5 && cardIdx < shuffled.length) {
      simulatedBoard.middle.push(shuffled[cardIdx++]);
    }
    while (simulatedBoard.top.length < 3 && cardIdx < shuffled.length) {
      simulatedBoard.top.push(shuffled[cardIdx++]);
    }

    // Evaluate simulated completion
    const foulData = checkIsFoul(
      simulatedBoard.top,
      simulatedBoard.middle,
      simulatedBoard.bottom
    );

    if (foulData.isFoul) {
      totalEV -= 30; // Heavy penalty for foul outcome in Monte Carlo
    } else {
      let simScore = 0;
      // Royalties
      simScore += (foulData.topEval.royaltyPoints || 0);
      simScore += (foulData.middleEval.royaltyPoints || 0);
      simScore += (foulData.bottomEval.royaltyPoints || 0);

      // Fantasy Land bonus
      if (foulData.topEval.royaltyPoints >= 7) {
        simScore += 18;
      }

      // Open face comparison vs Opponent projected board
      if (opponentBoard) {
        const oppTop = evaluate3CardHand(opponentBoard.top);
        const oppMid = evaluate5CardHand(opponentBoard.middle, 'middle');
        const oppBot = evaluate5CardHand(opponentBoard.bottom, 'bottom');

        let rowWins = 0;
        let rowLosses = 0;

        if (compareEvaluatedHands(foulData.topEval, oppTop) > 0) rowWins++;
        else if (compareEvaluatedHands(foulData.topEval, oppTop) < 0) rowLosses++;

        if (compareEvaluatedHands(foulData.middleEval, oppMid) > 0) rowWins++;
        else if (compareEvaluatedHands(foulData.middleEval, oppMid) < 0) rowLosses++;

        if (compareEvaluatedHands(foulData.bottomEval, oppBot) > 0) rowWins++;
        else if (compareEvaluatedHands(foulData.bottomEval, oppBot) < 0) rowLosses++;

        simScore += (rowWins - rowLosses) * 2;
        if (rowWins === 3) simScore += 6; // Scoop bonus!
      }

      totalEV += simScore;
    }
  }

  return totalEV / numSimulations;
}

/**
 * Decides moves for Hard Bot using Monte Carlo simulations and joint discard optimization.
 */
export function decideHardBotTurn(
  botState: PineapplePlayerState,
  currentRound: number,
  opponentState?: PineapplePlayerState
): { board: PineappleBoard; discarded: PlayingCard[] } {
  const board = cloneBoard(botState.board);
  const hand = [...(botState.currentHandCards || [])];
  const discarded = [...(botState.discarded || [])];

  // Set of all cards known to the bot (Bot's cards + Opponent's open-face board cards)
  const knownCards = new Set<string>();
  board.top.forEach(c => knownCards.add(c.id));
  board.middle.forEach(c => knownCards.add(c.id));
  board.bottom.forEach(c => knownCards.add(c.id));
  hand.forEach(c => knownCards.add(c.id));
  discarded.forEach(c => knownCards.add(c.id));

  if (opponentState?.board) {
    opponentState.board.top.forEach(c => knownCards.add(c.id));
    opponentState.board.middle.forEach(c => knownCards.add(c.id));
    opponentState.board.bottom.forEach(c => knownCards.add(c.id));
  }

  // Fantasy Land Solver
  if (botState.inFantasyLand && hand.length >= 13) {
    return solveBestFantasyLandPartition(hand);
  }

  // Round 1 (5 cards dealt)
  if (currentRound === 1 && hand.length >= 5) {
    let bestEV = -Infinity;
    let bestBoard = cloneBoard(board);

    const sorted = [...hand].sort((a, b) => (RANK_VALUES[b.rank] || 0) - (RANK_VALUES[a.rank] || 0));

    const distributions: Array<[number, number, number]> = [
      [0, 2, 3],
      [0, 3, 2],
      [1, 2, 2],
      [0, 1, 4],
      [0, 0, 5],
      [1, 1, 3],
      [2, 0, 3],
      [2, 1, 2],
      [1, 0, 4],
    ];

    for (const [tCount, mCount, bCount] of distributions) {
      if (tCount + mCount + bCount !== 5) continue;
      const testBoard: PineappleBoard = {
        top: sorted.slice(0, tCount),
        middle: sorted.slice(tCount, tCount + mCount),
        bottom: sorted.slice(tCount + mCount),
      };

      const ev = simulateHardBotEV(testBoard, knownCards, opponentState?.board, 30);
      if (ev > bestEV) {
        bestEV = ev;
        bestBoard = testBoard;
      }
    }

    return { board: bestBoard, discarded };
  }

  // Rounds 2..5 (3 cards dealt: joint combined discard + placement optimization)
  if (hand.length >= 3) {
    let bestEV = -Infinity;
    let bestBoard = cloneBoard(board);
    let bestDiscard: PlayingCard = hand[hand.length - 1];

    const rows: Array<'top' | 'middle' | 'bottom'> = ['top', 'middle', 'bottom'];

    // Evaluate all (3 choose 2) = 3 discard combinations
    for (let dIdx = 0; dIdx < hand.length; dIdx++) {
      const candidateDiscard = hand[dIdx];
      const placeCards = hand.filter((_, idx) => idx !== dIdx);
      const [c1, c2] = placeCards;

      // Test all legal row combinations
      for (const r1 of rows) {
        if (!canAddToRow(board, r1)) continue;

        const tempBoard1 = cloneBoard(board);
        tempBoard1[r1].push(c1);

        for (const r2 of rows) {
          if (!canAddToRow(tempBoard1, r2)) continue;

          const tempBoard2 = cloneBoard(tempBoard1);
          tempBoard2[r2].push(c2);

          // Fast Monte Carlo EV calculation
          const ev = simulateHardBotEV(tempBoard2, knownCards, opponentState?.board, 30);

          if (ev > bestEV) {
            bestEV = ev;
            bestBoard = tempBoard2;
            bestDiscard = candidateDiscard;
          }
        }
      }
    }

    discarded.push(bestDiscard);
    return { board: bestBoard, discarded };
  }

  return { board, discarded };
}

// ---------------------------------------------------------------------------
// 5. FANTASY LAND OPTIMAL SOLVER (14 cards -> 1 discard + 13 placed)
// ---------------------------------------------------------------------------

/**
 * Finds the highest scoring legal arrangement for 14 Fantasy Land cards.
 * Discards 1 card and arranges 13 cards into (5 Bottom, 5 Middle, 3 Top)
 * satisfying Top <= Middle <= Bottom and maximizing royalties.
 */
export function solveBestFantasyLandPartition(cards: PlayingCard[]): {
  board: PineappleBoard;
  discarded: PlayingCard[];
} {
  const sorted = [...cards].sort((a, b) => (RANK_VALUES[b.rank] || 0) - (RANK_VALUES[a.rank] || 0));

  // Rank frequency grouping
  const counts: Record<string, PlayingCard[]> = {};
  for (const c of sorted) {
    if (!counts[c.rank]) counts[c.rank] = [];
    counts[c.rank].push(c);
  }

  // Check for 5-card flush possibilities
  const suitGroups: Record<string, PlayingCard[]> = {};
  for (const c of sorted) {
    if (!suitGroups[c.suit]) suitGroups[c.suit] = [];
    suitGroups[c.suit].push(c);
  }

  const flushes = Object.values(suitGroups).filter(arr => arr.length >= 5);

  let bestScore = -Infinity;
  let bestBoard: PineappleBoard = {
    top: [],
    middle: [],
    bottom: [],
  };
  let bestDiscard: PlayingCard[] = [];

  // Candidate discard cards: evaluate discarding each card
  const candidateDiscards = sorted.length > 13 ? sorted : [sorted[sorted.length - 1]];

  for (let d = 0; d < candidateDiscards.length; d++) {
    const discardCard = candidateDiscards[d];
    const available = sorted.filter(c => c.id !== discardCard.id);
    if (available.length < 13) continue;

    // Pattern 1: High Quads or Full House on Bottom, Trips / Pair on Middle, Pair on Top
    const pairsOrSets = Object.values(counts)
      .map(group => group.filter(c => c.id !== discardCard.id))
      .filter(group => group.length >= 2)
      .sort((a, b) => {
        if (b.length !== a.length) return b.length - a.length;
        return (RANK_VALUES[b[0].rank] || 0) - (RANK_VALUES[a[0].rank] || 0);
      });

    // Try Flush on bottom if possible
    if (flushes.length > 0) {
      const flushCards = flushes[0].filter(c => c.id !== discardCard.id).slice(0, 5);
      if (flushCards.length === 5) {
        const remaining = available.filter(c => !flushCards.some(f => f.id === c.id));
        if (remaining.length === 8) {
          const testBoard: PineappleBoard = {
            bottom: flushCards,
            middle: remaining.slice(0, 5),
            top: remaining.slice(5, 8),
          };

          const foul = checkIsFoul(testBoard.top, testBoard.middle, testBoard.bottom);
          if (!foul.isFoul) {
            const score =
              (foul.topEval.royaltyPoints || 0) +
              (foul.middleEval.royaltyPoints || 0) +
              (foul.bottomEval.royaltyPoints || 0) +
              (foul.topEval.royaltyPoints >= 7 ? 20 : 0);

            if (score > bestScore) {
              bestScore = score;
              bestBoard = testBoard;
              bestDiscard = [discardCard];
            }
          }
        }
      }
    }

    // Try Standard Frequency Partition
    const remainingCards = [...available];
    const b: PlayingCard[] = [];
    const m: PlayingCard[] = [];
    const t: PlayingCard[] = [];

    // Distribute sets
    for (const group of pairsOrSets) {
      if (b.length + group.length <= 5) {
        b.push(...group);
      } else if (m.length + group.length <= 5) {
        m.push(...group);
      } else if (t.length + group.length <= 3) {
        t.push(...group);
      }
    }

    // Fill remaining spots with highest available kickers
    const unused = remainingCards.filter(
      c => !b.some(x => x.id === c.id) && !m.some(x => x.id === c.id) && !t.some(x => x.id === c.id)
    );

    while (b.length < 5 && unused.length > 0) b.push(unused.shift()!);
    while (m.length < 5 && unused.length > 0) m.push(unused.shift()!);
    while (t.length < 3 && unused.length > 0) t.push(unused.shift()!);

    if (b.length === 5 && m.length === 5 && t.length === 3) {
      const candidate: PineappleBoard = { top: t, middle: m, bottom: b };
      const foul = checkIsFoul(candidate.top, candidate.middle, candidate.bottom);

      if (!foul.isFoul) {
        const score =
          (foul.topEval.royaltyPoints || 0) +
          (foul.middleEval.royaltyPoints || 0) +
          (foul.bottomEval.royaltyPoints || 0) +
          (foul.topEval.royaltyPoints >= 7 ? 20 : 0);

        if (score > bestScore) {
          bestScore = score;
          bestBoard = candidate;
          bestDiscard = [discardCard];
        }
      }
    }
  }

  // Fallback if no valid non-foul found yet: standard descending distribution
  if (bestBoard.bottom.length !== 5 || bestBoard.middle.length !== 5 || bestBoard.top.length !== 3) {
    const discardCard = sorted[sorted.length - 1];
    const available = sorted.slice(0, 13);
    bestBoard = {
      bottom: available.slice(0, 5),
      middle: available.slice(5, 10),
      top: available.slice(10, 13),
    };
    bestDiscard = [discardCard];
  }

  return { board: bestBoard, discarded: bestDiscard };
}

/**
 * Primary entry point: Executes bot turn based on bot difficulty level
 */
export function executeBotTurnByDifficulty(
  botState: PineapplePlayerState,
  currentRound: number,
  opponentState?: PineapplePlayerState
): { board: PineappleBoard; discarded: PlayingCard[] } {
  const difficulty = botState.botDifficulty || 'medium';

  switch (difficulty) {
    case 'easy':
      return decideEasyBotTurn(botState, currentRound);
    case 'hard':
      return decideHardBotTurn(botState, currentRound, opponentState);
    case 'medium':
    default:
      return decideMediumBotTurn(botState, currentRound);
  }
}
