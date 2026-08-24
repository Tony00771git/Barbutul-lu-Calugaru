import {
  PineappleBoard,
  PineappleHandResult,
  PineappleMatchSettings,
  PineapplePlayerState,
} from '../types';
import {
  checkIsFoul,
  compareEvaluatedHands,
  evaluate3CardHand,
  evaluate5CardHand,
} from './pineapplePokerEvaluator';

export function calculatePineappleHandScore(
  handNumber: number,
  playerA: PineapplePlayerState,
  playerB: PineapplePlayerState,
  settings: PineappleMatchSettings
): PineappleHandResult {
  const boardA = playerA.board;
  const boardB = playerB.board;

  const foulAData = checkIsFoul(boardA.top, boardA.middle, boardA.bottom);
  const foulBData = checkIsFoul(boardB.top, boardB.middle, boardB.bottom);

  const foulA = foulAData.isFoul;
  const foulB = foulBData.isFoul;

  const topEvalA = foulAData.topEval;
  const middleEvalA = foulAData.middleEval;
  const bottomEvalA = foulAData.bottomEval;

  const topEvalB = foulBData.topEval;
  const middleEvalB = foulBData.middleEval;
  const bottomEvalB = foulBData.bottomEval;

  let topWinner: 'A' | 'B' | 'tie' = 'tie';
  let middleWinner: 'A' | 'B' | 'tie' = 'tie';
  let bottomWinner: 'A' | 'B' | 'tie' = 'tie';

  let topScoreA = 0;
  let middleScoreA = 0;
  let bottomScoreA = 0;
  let scoopScoreA = 0;
  let scoopWinner: 'A' | 'B' | null = null;

  let royaltiesTopA = foulA ? 0 : topEvalA.royaltyPoints;
  let royaltiesMiddleA = foulA ? 0 : middleEvalA.royaltyPoints;
  let royaltiesBottomA = foulA ? 0 : bottomEvalA.royaltyPoints;

  let royaltiesTopB = foulB ? 0 : topEvalB.royaltyPoints;
  let royaltiesMiddleB = foulB ? 0 : middleEvalB.royaltyPoints;
  let royaltiesBottomB = foulB ? 0 : bottomEvalB.royaltyPoints;

  // CASE 1: BOTH FOUL -> 0 points all around
  if (foulA && foulB) {
    // Both foul: 0 net score, 0 sips
    return {
      handNumber,
      playerAId: playerA.id,
      playerBId: playerB.id,
      foulA: true,
      foulB: true,
      topWinner: 'tie',
      middleWinner: 'tie',
      bottomWinner: 'tie',
      scoopWinner: null,
      topScoreA: 0,
      middleScoreA: 0,
      bottomScoreA: 0,
      scoopScoreA: 0,
      rowPointsA: 0,
      rowPointsB: 0,
      royaltiesTopA: 0,
      royaltiesMiddleA: 0,
      royaltiesBottomA: 0,
      royaltiesTopB: 0,
      royaltiesMiddleB: 0,
      royaltiesBottomB: 0,
      totalRoyaltiesA: 0,
      totalRoyaltiesB: 0,
      grossPointsA: 0,
      grossPointsB: 0,
      netScoreA: 0,
      netScoreB: 0,
      sipsAddedA: 0,
      sipsAddedB: 0,
      handDescriptionA: {
        top: `FOUL: ${topEvalA.nameRo}`,
        middle: `FOUL: ${middleEvalA.nameRo}`,
        bottom: `FOUL: ${bottomEvalA.nameRo}`,
      },
      handDescriptionB: {
        top: `FOUL: ${topEvalB.nameRo}`,
        middle: `FOUL: ${middleEvalB.nameRo}`,
        bottom: `FOUL: ${bottomEvalB.nameRo}`,
      },
    };
  }

  // CASE 2: ONLY PLAYER A FOULS -> Player B automatically gets +6 row points (3 wins + 3 scoop) + B royalties
  if (foulA && !foulB) {
    topWinner = 'B';
    middleWinner = 'B';
    bottomWinner = 'B';
    scoopWinner = 'B';

    topScoreA = -1;
    middleScoreA = -1;
    bottomScoreA = -1;
    scoopScoreA = -3;

    const rowPointsA = -6;
    const rowPointsB = 6;

    royaltiesTopA = 0;
    royaltiesMiddleA = 0;
    royaltiesBottomA = 0;

    const totalRoyaltiesA = 0;
    const totalRoyaltiesB = royaltiesTopB + royaltiesMiddleB + royaltiesBottomB;

    const netScoreA = rowPointsA - totalRoyaltiesB; // e.g. -6 - royaltiesB
    const netScoreB = -netScoreA;

    const sipsAddedA = Math.abs(netScoreA) * settings.sipsPerPoint;
    const sipsAddedB = 0;

    return {
      handNumber,
      playerAId: playerA.id,
      playerBId: playerB.id,
      foulA: true,
      foulB: false,
      topWinner,
      middleWinner,
      bottomWinner,
      scoopWinner,
      topScoreA,
      middleScoreA,
      bottomScoreA,
      scoopScoreA,
      rowPointsA,
      rowPointsB,
      royaltiesTopA: 0,
      royaltiesMiddleA: 0,
      royaltiesBottomA: 0,
      royaltiesTopB,
      royaltiesMiddleB,
      royaltiesBottomB,
      totalRoyaltiesA: 0,
      totalRoyaltiesB,
      grossPointsA: 0,
      grossPointsB: 6 + totalRoyaltiesB,
      netScoreA,
      netScoreB,
      sipsAddedA,
      sipsAddedB,
      handDescriptionA: {
        top: `FOUL: ${topEvalA.nameRo}`,
        middle: `FOUL: ${middleEvalA.nameRo}`,
        bottom: `FOUL: ${bottomEvalA.nameRo}`,
      },
      handDescriptionB: {
        top: topEvalB.nameRo,
        middle: middleEvalB.nameRo,
        bottom: bottomEvalB.nameRo,
      },
    };
  }

  // CASE 3: ONLY PLAYER B FOULS -> Player A automatically gets +6 row points (3 wins + 3 scoop) + A royalties
  if (!foulA && foulB) {
    topWinner = 'A';
    middleWinner = 'A';
    bottomWinner = 'A';
    scoopWinner = 'A';

    topScoreA = 1;
    middleScoreA = 1;
    bottomScoreA = 1;
    scoopScoreA = 3;

    const rowPointsA = 6;
    const rowPointsB = -6;

    royaltiesTopB = 0;
    royaltiesMiddleB = 0;
    royaltiesBottomB = 0;

    const totalRoyaltiesA = royaltiesTopA + royaltiesMiddleA + royaltiesBottomA;
    const totalRoyaltiesB = 0;

    const netScoreA = rowPointsA + totalRoyaltiesA;
    const netScoreB = -netScoreA;

    const sipsAddedA = 0;
    const sipsAddedB = Math.abs(netScoreB) * settings.sipsPerPoint;

    return {
      handNumber,
      playerAId: playerA.id,
      playerBId: playerB.id,
      foulA: false,
      foulB: true,
      topWinner,
      middleWinner,
      bottomWinner,
      scoopWinner,
      topScoreA,
      middleScoreA,
      bottomScoreA,
      scoopScoreA,
      rowPointsA,
      rowPointsB,
      royaltiesTopA,
      royaltiesMiddleA,
      royaltiesBottomA,
      royaltiesTopB: 0,
      royaltiesMiddleB: 0,
      royaltiesBottomB: 0,
      totalRoyaltiesA,
      totalRoyaltiesB: 0,
      grossPointsA: 6 + totalRoyaltiesA,
      grossPointsB: 0,
      netScoreA,
      netScoreB,
      sipsAddedA,
      sipsAddedB,
      handDescriptionA: {
        top: topEvalA.nameRo,
        middle: middleEvalA.nameRo,
        bottom: bottomEvalA.nameRo,
      },
      handDescriptionB: {
        top: `FOUL: ${topEvalB.nameRo}`,
        middle: `FOUL: ${middleEvalB.nameRo}`,
        bottom: `FOUL: ${bottomEvalB.nameRo}`,
      },
    };
  }

  // CASE 4: NEITHER FOULS -> Standard 1-6 + Scoop + Royalties comparison
  const topDiff = compareEvaluatedHands(topEvalA, topEvalB);
  if (topDiff > 0) {
    topWinner = 'A';
    topScoreA = 1;
  } else if (topDiff < 0) {
    topWinner = 'B';
    topScoreA = -1;
  } else {
    topWinner = 'tie';
    topScoreA = 0;
  }

  const midDiff = compareEvaluatedHands(middleEvalA, middleEvalB);
  if (midDiff > 0) {
    middleWinner = 'A';
    middleScoreA = 1;
  } else if (midDiff < 0) {
    middleWinner = 'B';
    middleScoreA = -1;
  } else {
    middleWinner = 'tie';
    middleScoreA = 0;
  }

  const botDiff = compareEvaluatedHands(bottomEvalA, bottomEvalB);
  if (botDiff > 0) {
    bottomWinner = 'A';
    bottomScoreA = 1;
  } else if (botDiff < 0) {
    bottomWinner = 'B';
    bottomScoreA = -1;
  } else {
    bottomWinner = 'tie';
    bottomScoreA = 0;
  }

  // Check Scoop (3-0 sweep)
  if (topWinner === 'A' && middleWinner === 'A' && bottomWinner === 'A') {
    scoopWinner = 'A';
    scoopScoreA = 3;
  } else if (topWinner === 'B' && middleWinner === 'B' && bottomWinner === 'B') {
    scoopWinner = 'B';
    scoopScoreA = -3;
  } else {
    scoopWinner = null;
    scoopScoreA = 0;
  }

  const rowPointsA = topScoreA + middleScoreA + bottomScoreA + scoopScoreA;
  const rowPointsB = -rowPointsA;

  const totalRoyaltiesA = royaltiesTopA + royaltiesMiddleA + royaltiesBottomA;
  const totalRoyaltiesB = royaltiesTopB + royaltiesMiddleB + royaltiesBottomB;

  const grossPointsA =
    (topWinner === 'A' ? 1 : 0) +
    (middleWinner === 'A' ? 1 : 0) +
    (bottomWinner === 'A' ? 1 : 0) +
    (scoopWinner === 'A' ? 3 : 0) +
    totalRoyaltiesA;

  const grossPointsB =
    (topWinner === 'B' ? 1 : 0) +
    (middleWinner === 'B' ? 1 : 0) +
    (bottomWinner === 'B' ? 1 : 0) +
    (scoopWinner === 'B' ? 3 : 0) +
    totalRoyaltiesB;

  const netScoreA = rowPointsA + totalRoyaltiesA - totalRoyaltiesB;
  const netScoreB = -netScoreA;

  const sipsAddedA = netScoreA < 0 ? Math.abs(netScoreA) * settings.sipsPerPoint : 0;
  const sipsAddedB = netScoreB < 0 ? Math.abs(netScoreB) * settings.sipsPerPoint : 0;

  return {
    handNumber,
    playerAId: playerA.id,
    playerBId: playerB.id,
    foulA: false,
    foulB: false,
    topWinner,
    middleWinner,
    bottomWinner,
    scoopWinner,
    topScoreA,
    middleScoreA,
    bottomScoreA,
    scoopScoreA,
    rowPointsA,
    rowPointsB,
    royaltiesTopA,
    royaltiesMiddleA,
    royaltiesBottomA,
    royaltiesTopB,
    royaltiesMiddleB,
    royaltiesBottomB,
    totalRoyaltiesA,
    totalRoyaltiesB,
    grossPointsA,
    grossPointsB,
    netScoreA,
    netScoreB,
    sipsAddedA,
    sipsAddedB,
    handDescriptionA: {
      top: topEvalA.nameRo,
      middle: middleEvalA.nameRo,
      bottom: bottomEvalA.nameRo,
    },
    handDescriptionB: {
      top: topEvalB.nameRo,
      middle: middleEvalB.nameRo,
      bottom: bottomEvalB.nameRo,
    },
  };
}
