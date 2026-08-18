import { PlayingCard, PlayingCardRank, PlayingCardSuit } from '../types';

export const CARD_RANKS: PlayingCardRank[] = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
export const CARD_SUITS: PlayingCardSuit[] = ['s', 'h', 'd', 'c']; // Spades ♠, Hearts ♥, Diamonds ♦, Clubs ♣

export const RANK_VALUES: Record<PlayingCardRank, number> = {
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  'T': 10,
  'J': 11,
  'Q': 12,
  'K': 13,
  'A': 14,
};

export const RANK_NAMES_RO: Record<PlayingCardRank, string> = {
  '2': 'Doiari',
  '3': 'Treiari',
  '4': 'Pătrari',
  '5': 'Cincari',
  '6': 'Șesari',
  '7': 'Șeptari',
  '8': 'Optari',
  '9': 'Nouari',
  'T': 'Decari',
  'J': 'Valet',
  'Q': 'Damă',
  'K': 'Popă',
  'A': 'As',
};

export const RANK_NAMES_EN: Record<PlayingCardRank, string> = {
  '2': 'Twos',
  '3': 'Threes',
  '4': 'Fours',
  '5': 'Fives',
  '6': 'Sixes',
  '7': 'Sevens',
  '8': 'Eights',
  '9': 'Nines',
  'T': 'Tens',
  'J': 'Jacks',
  'Q': 'Queens',
  'K': 'Kings',
  'A': 'Aces',
};

export const SUIT_SYMBOLS: Record<PlayingCardSuit, string> = {
  s: '♠',
  h: '♥',
  d: '♦',
  c: '♣',
};

export const SUIT_COLORS: Record<PlayingCardSuit, string> = {
  s: 'text-stone-300',
  h: 'text-red-500',
  d: 'text-red-500',
  c: 'text-emerald-400',
};

export type HandCategory =
  | 'high_card'
  | 'pair'
  | 'two_pair'
  | 'three_of_a_kind'
  | 'straight'
  | 'flush'
  | 'full_house'
  | 'four_of_a_kind'
  | 'straight_flush'
  | 'royal_flush';

export interface EvaluatedHand {
  category: HandCategory;
  categoryRank: number; // 0 to 9
  primaryRanks: number[]; // Ranks for tie-breaking in order of priority
  nameRo: string;
  nameEn: string;
  royaltyPoints: number;
}

/**
 * Creates a standard fresh 52-card deck.
 */
export function createDeck(): PlayingCard[] {
  const deck: PlayingCard[] = [];
  for (const suit of CARD_SUITS) {
    for (const rank of CARD_RANKS) {
      deck.push({
        id: `${rank}${suit}`,
        rank,
        suit,
      });
    }
  }
  return deck;
}

/**
 * Fisher-Yates shuffle for a card deck.
 */
export function shuffleCards(cards: PlayingCard[]): PlayingCard[] {
  const array = [...cards];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Evaluates a 3-card Top hand.
 * In OFC 3-card Top row, only High Card, Pair, and Three of a Kind exist.
 */
export function evaluate3CardHand(cards: PlayingCard[]): EvaluatedHand {
  if (!cards || cards.length === 0) {
    return {
      category: 'high_card',
      categoryRank: 0,
      primaryRanks: [0, 0, 0],
      nameRo: 'Gol',
      nameEn: 'Empty',
      royaltyPoints: 0,
    };
  }

  const values = cards.map(c => RANK_VALUES[c.rank]).sort((a, b) => b - a);

  // Group by rank count
  const counts: Record<number, number> = {};
  for (const v of values) {
    counts[v] = (counts[v] || 0) + 1;
  }

  const entries = Object.entries(counts)
    .map(([valStr, count]) => ({ val: Number(valStr), count }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return b.val - a.val;
    });

  // 1. Three of a Kind (Trips)
  if (entries[0].count === 3) {
    const tripVal = entries[0].val;
    const rankKey = CARD_RANKS.find(r => RANK_VALUES[r] === tripVal)!;
    // Royalties: 222 = +10, 333 = +11, ..., AAA = +22
    const royaltyPoints = 10 + (tripVal - 2);

    return {
      category: 'three_of_a_kind',
      categoryRank: 3,
      primaryRanks: [tripVal],
      nameRo: `Trips de ${RANK_NAMES_RO[rankKey]}`,
      nameEn: `Three of a Kind (${RANK_NAMES_EN[rankKey]})`,
      royaltyPoints,
    };
  }

  // 2. One Pair
  if (entries[0].count === 2) {
    const pairVal = entries[0].val;
    const kickerVal = entries[1] ? entries[1].val : 0;
    const rankKey = CARD_RANKS.find(r => RANK_VALUES[r] === pairVal)!;

    // Royalties: 66 = 1, 77 = 2, 88 = 3, 99 = 4, TT = 5, JJ = 6, QQ = 7, KK = 8, AA = 9
    let royaltyPoints = 0;
    if (pairVal >= 6) {
      royaltyPoints = pairVal - 5;
    }

    return {
      category: 'pair',
      categoryRank: 1,
      primaryRanks: [pairVal, kickerVal],
      nameRo: `Pereche de ${RANK_NAMES_RO[rankKey]}`,
      nameEn: `Pair of ${RANK_NAMES_EN[rankKey]}`,
      royaltyPoints,
    };
  }

  // 3. High Card
  const highRankKey = CARD_RANKS.find(r => RANK_VALUES[r] === values[0])!;
  return {
    category: 'high_card',
    categoryRank: 0,
    primaryRanks: values,
    nameRo: `Carte mare (${RANK_NAMES_RO[highRankKey]})`,
    nameEn: `High Card (${RANK_NAMES_EN[highRankKey]})`,
    royaltyPoints: 0,
  };
}

/**
 * Evaluates a 5-card Middle or Bottom hand.
 */
export function evaluate5CardHand(cards: PlayingCard[], rowType: 'middle' | 'bottom'): EvaluatedHand {
  if (!cards || cards.length === 0) {
    return {
      category: 'high_card',
      categoryRank: 0,
      primaryRanks: [0, 0, 0, 0, 0],
      nameRo: 'Gol',
      nameEn: 'Empty',
      royaltyPoints: 0,
    };
  }

  const values = cards.map(c => RANK_VALUES[c.rank]).sort((a, b) => b - a);
  const suits = cards.map(c => c.suit);

  const isFlush = cards.length === 5 && suits.every(s => s === suits[0]);

  // Check straight
  let isStraight = false;
  let straightHigh = 0;

  if (cards.length === 5) {
    const uniqueValues = Array.from(new Set(values));
    if (uniqueValues.length === 5) {
      // Normal straight check
      if (values[0] - values[4] === 4) {
        isStraight = true;
        straightHigh = values[0];
      } else if (
        values[0] === 14 &&
        values[1] === 5 &&
        values[2] === 4 &&
        values[3] === 3 &&
        values[4] === 2
      ) {
        // Wheel straight: A-2-3-4-5 (5-high)
        isStraight = true;
        straightHigh = 5;
      }
    }
  }

  // Frequency count of ranks
  const counts: Record<number, number> = {};
  for (const v of values) {
    counts[v] = (counts[v] || 0) + 1;
  }

  const entries = Object.entries(counts)
    .map(([valStr, count]) => ({ val: Number(valStr), count }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return b.val - a.val;
    });

  // 1. Royal Flush & Straight Flush
  if (isFlush && isStraight) {
    if (straightHigh === 14 && values[4] === 10) {
      const royaltyPoints = rowType === 'middle' ? 50 : 25;
      return {
        category: 'royal_flush',
        categoryRank: 9,
        primaryRanks: [14],
        nameRo: 'Chintă Regală (Royal Flush)',
        nameEn: 'Royal Flush',
        royaltyPoints,
      };
    } else {
      const royaltyPoints = rowType === 'middle' ? 30 : 15;
      const rankKey = CARD_RANKS.find(r => RANK_VALUES[r] === straightHigh)!;
      return {
        category: 'straight_flush',
        categoryRank: 8,
        primaryRanks: [straightHigh],
        nameRo: `Chintă de Culoare (${RANK_NAMES_RO[rankKey]}-High)`,
        nameEn: `Straight Flush (${RANK_NAMES_EN[rankKey]}-High)`,
        royaltyPoints,
      };
    }
  }

  // 2. Four of a Kind (Careu / Quads)
  if (entries[0].count === 4) {
    const quadVal = entries[0].val;
    const kickerVal = entries[1] ? entries[1].val : 0;
    const rankKey = CARD_RANKS.find(r => RANK_VALUES[r] === quadVal)!;
    const royaltyPoints = rowType === 'middle' ? 20 : 10;

    return {
      category: 'four_of_a_kind',
      categoryRank: 7,
      primaryRanks: [quadVal, kickerVal],
      nameRo: `Careu de ${RANK_NAMES_RO[rankKey]}`,
      nameEn: `Four of a Kind (${RANK_NAMES_EN[rankKey]})`,
      royaltyPoints,
    };
  }

  // 3. Full House
  if (entries[0].count === 3 && entries[1] && entries[1].count >= 2) {
    const tripVal = entries[0].val;
    const pairVal = entries[1].val;
    const rankTripKey = CARD_RANKS.find(r => RANK_VALUES[r] === tripVal)!;
    const rankPairKey = CARD_RANKS.find(r => RANK_VALUES[r] === pairVal)!;
    const royaltyPoints = rowType === 'middle' ? 12 : 6;

    return {
      category: 'full_house',
      categoryRank: 6,
      primaryRanks: [tripVal, pairVal],
      nameRo: `Full House (${RANK_NAMES_RO[rankTripKey]} cu ${RANK_NAMES_RO[rankPairKey]})`,
      nameEn: `Full House (${RANK_NAMES_EN[rankTripKey]} full of ${RANK_NAMES_EN[rankPairKey]})`,
      royaltyPoints,
    };
  }

  // 4. Flush
  if (isFlush) {
    const royaltyPoints = rowType === 'middle' ? 8 : 4;
    const highKey = CARD_RANKS.find(r => RANK_VALUES[r] === values[0])!;
    return {
      category: 'flush',
      categoryRank: 5,
      primaryRanks: values,
      nameRo: `Culoare (${RANK_NAMES_RO[highKey]}-High)`,
      nameEn: `Flush (${RANK_NAMES_EN[highKey]}-High)`,
      royaltyPoints,
    };
  }

  // 5. Straight
  if (isStraight) {
    const royaltyPoints = rowType === 'middle' ? 4 : 2;
    const highKey = CARD_RANKS.find(r => RANK_VALUES[r] === straightHigh)!;
    return {
      category: 'straight',
      categoryRank: 4,
      primaryRanks: [straightHigh],
      nameRo: `Chintă (${RANK_NAMES_RO[highKey]}-High)`,
      nameEn: `Straight (${RANK_NAMES_EN[highKey]}-High)`,
      royaltyPoints,
    };
  }

  // 6. Three of a Kind (Trips)
  if (entries[0].count === 3) {
    const tripVal = entries[0].val;
    const kickers = entries.slice(1).map(e => e.val);
    const rankKey = CARD_RANKS.find(r => RANK_VALUES[r] === tripVal)!;
    const royaltyPoints = rowType === 'middle' ? 2 : 0; // Middle gets +2 for Trips, Bottom gets 0

    return {
      category: 'three_of_a_kind',
      categoryRank: 3,
      primaryRanks: [tripVal, ...kickers],
      nameRo: `Trips de ${RANK_NAMES_RO[rankKey]}`,
      nameEn: `Three of a Kind (${RANK_NAMES_EN[rankKey]})`,
      royaltyPoints,
    };
  }

  // 7. Two Pair
  if (entries[0].count === 2 && entries[1] && entries[1].count === 2) {
    const highPair = Math.max(entries[0].val, entries[1].val);
    const lowPair = Math.min(entries[0].val, entries[1].val);
    const kicker = entries[2] ? entries[2].val : 0;
    const highKey = CARD_RANKS.find(r => RANK_VALUES[r] === highPair)!;
    const lowKey = CARD_RANKS.find(r => RANK_VALUES[r] === lowPair)!;

    return {
      category: 'two_pair',
      categoryRank: 2,
      primaryRanks: [highPair, lowPair, kicker],
      nameRo: `Două Perechi (${RANK_NAMES_RO[highKey]} & ${RANK_NAMES_RO[lowKey]})`,
      nameEn: `Two Pair (${RANK_NAMES_EN[highKey]} & ${RANK_NAMES_EN[lowKey]})`,
      royaltyPoints: 0,
    };
  }

  // 8. One Pair
  if (entries[0].count === 2) {
    const pairVal = entries[0].val;
    const kickers = entries.slice(1).map(e => e.val);
    const rankKey = CARD_RANKS.find(r => RANK_VALUES[r] === pairVal)!;

    return {
      category: 'pair',
      categoryRank: 1,
      primaryRanks: [pairVal, ...kickers],
      nameRo: `Pereche de ${RANK_NAMES_RO[rankKey]}`,
      nameEn: `Pair of ${RANK_NAMES_EN[rankKey]}`,
      royaltyPoints: 0,
    };
  }

  // 9. High Card
  const highKey = CARD_RANKS.find(r => RANK_VALUES[r] === values[0])!;
  return {
    category: 'high_card',
    categoryRank: 0,
    primaryRanks: values,
    nameRo: `Carte mare (${RANK_NAMES_RO[highKey]})`,
    nameEn: `High Card (${RANK_NAMES_EN[highKey]})`,
    royaltyPoints: 0,
  };
}

/**
 * Compares two evaluated hands of the same row (e.g. Top vs Top, Middle vs Middle, Bottom vs Bottom).
 * Returns: > 0 if Hand 1 wins, < 0 if Hand 2 wins, 0 if Tie.
 */
export function compareEvaluatedHands(h1: EvaluatedHand, h2: EvaluatedHand): number {
  if (h1.categoryRank !== h2.categoryRank) {
    return h1.categoryRank - h2.categoryRank;
  }

  // Compare primary ranks in sequence for tie-breaking
  const len = Math.max(h1.primaryRanks.length, h2.primaryRanks.length);
  for (let i = 0; i < len; i++) {
    const r1 = h1.primaryRanks[i] || 0;
    const r2 = h2.primaryRanks[i] || 0;
    if (r1 !== r2) {
      return r1 - r2;
    }
  }

  return 0;
}

/**
 * Compares 3-card Top hand vs 5-card Middle hand to check OFC Foul rule (Top must be <= Middle).
 * Returns: > 0 if Top > Middle (FOUL!), <= 0 if Valid.
 */
export function compareTopVsMiddle(topHand: EvaluatedHand, midHand: EvaluatedHand): number {
  // If Middle category rank is strictly higher than Top category rank -> Legal
  if (midHand.categoryRank > topHand.categoryRank) {
    return -1; // Legal (Middle is stronger)
  }

  // If Middle category rank is lower than Top category rank:
  // e.g. Top is Trips (category 3) and Middle is Two Pair (category 2), Pair (1), or High Card (0) -> FOUL!
  // e.g. Top is Pair (category 1) and Middle is High Card (category 0) -> FOUL!
  if (midHand.categoryRank < topHand.categoryRank) {
    return 1; // Foul (Top is stronger)
  }

  // Category ranks are identical (e.g. both High Card, both One Pair, or both Trips)
  // Compare the primary rank values:
  const len = Math.min(topHand.primaryRanks.length, midHand.primaryRanks.length);
  for (let i = 0; i < len; i++) {
    const topR = topHand.primaryRanks[i] || 0;
    const midR = midHand.primaryRanks[i] || 0;
    if (topR !== midR) {
      return topR - midR; // If topR > midR, positive -> Foul!
    }
  }

  return 0; // Exactly equal strength is legal (Top <= Middle)
}

/**
 * Validates whether an entire 13-card board is a Foul (Dead Hand).
 * Must satisfy: Top <= Middle AND Middle <= Bottom.
 */
export function checkIsFoul(topCards: PlayingCard[], middleCards: PlayingCard[], bottomCards: PlayingCard[]): {
  isFoul: boolean;
  topVsMiddleFoul: boolean;
  middleVsBottomFoul: boolean;
  topEval: EvaluatedHand;
  middleEval: EvaluatedHand;
  bottomEval: EvaluatedHand;
} {
  const topEval = evaluate3CardHand(topCards);
  const middleEval = evaluate5CardHand(middleCards, 'middle');
  const bottomEval = evaluate5CardHand(bottomCards, 'bottom');

  const topVsMiddleDiff = compareTopVsMiddle(topEval, middleEval);
  const topVsMiddleFoul = topVsMiddleDiff > 0;

  const middleVsBottomDiff = compareEvaluatedHands(middleEval, bottomEval);
  const middleVsBottomFoul = middleVsBottomDiff > 0;

  const isFoul = topVsMiddleFoul || middleVsBottomFoul;

  return {
    isFoul,
    topVsMiddleFoul,
    middleVsBottomFoul,
    topEval,
    middleEval,
    bottomEval,
  };
}

/**
 * Checks if a valid hand qualifies for entering/staying in Fantasy Land.
 */
export function checkFantasyLandTriggers(
  isFoul: boolean,
  currentlyInFantasyLand: boolean,
  topEval: EvaluatedHand,
  middleEval: EvaluatedHand,
  bottomEval: EvaluatedHand
): {
  qualifies: boolean;
  reasonRo: string;
  reasonEn: string;
} {
  if (isFoul) {
    return {
      qualifies: false,
      reasonRo: 'Mână Foul (Mână Moartă) - nu te califici în Fantasy Land',
      reasonEn: 'Foul Hand - does not qualify for Fantasy Land',
    };
  }

  if (!currentlyInFantasyLand) {
    // Normal Entry: QQ or better on Top (Pair of QQ, KK, AA or any Trips 222-AAA)
    const isPairQQorBetter = topEval.categoryRank === 1 && (topEval.primaryRanks[0] || 0) >= 12; // 12 is Q
    const isTrips = topEval.categoryRank === 3;

    if (isPairQQorBetter || isTrips) {
      return {
        qualifies: true,
        reasonRo: '🎉 Calificare Fantasy Land (QQ+ pe Top)!',
        reasonEn: '🎉 Qualified for Fantasy Land (QQ+ on Top)!',
      };
    }
  } else {
    // Stay in Fantasy Land (Re-trigger):
    // Trips on Top, OR Quads or better on Middle, OR Straight Flush or better on Bottom
    const isTripsTop = topEval.categoryRank === 3;
    const isQuadsOrBetterMiddle = middleEval.categoryRank >= 7; // 7 = four_of_a_kind, 8 = straight_flush, 9 = royal_flush
    const isStraightFlushOrBetterBottom = bottomEval.categoryRank >= 8; // 8 = straight_flush, 9 = royal_flush

    if (isTripsTop || isQuadsOrBetterMiddle || isStraightFlushOrBetterBottom) {
      return {
        qualifies: true,
        reasonRo: '✨ Rămâi în Fantasy Land!',
        reasonEn: '✨ Stay in Fantasy Land!',
      };
    }
  }

  return {
    qualifies: false,
    reasonRo: 'Nu s-a atins pragul pentru Fantasy Land',
    reasonEn: 'Fantasy Land threshold not met',
  };
}
