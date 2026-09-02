import React, { useState, useEffect } from 'react';
import {
  PineappleBoard,
  PineappleBotDifficulty,
  PineappleMatchSettings,
  PineapplePlayerState,
  PineappleRoomState,
  PlayingCard,
} from '../types';
import { useApp } from '../context/AppContext';
import { PineappleBoardView } from './PineappleBoardView';
import { PineappleCard } from './PineappleCard';
import { PineappleOpponentWidget } from './PineappleOpponentWidget';
import { PineappleScoringModal } from './PineappleScoringModal';
import { HeadToHeadTracker } from './HeadToHeadTracker';
import { BOT_PROFILES } from '../lib/pineappleBotAi';
import {
  addPineappleBot,
  removePineappleBot,
  removePineapplePlayer,
  createEmptyBoard,
  endPineappleMatch,
  lockPineapplePlayerHand,
  sortFantasyLandCards,
  startNextPineappleHand,
  startPineappleMatch,
  subscribeToPineappleRoom,
  updatePineapplePlayerBoard,
  sendPineappleEmote,
} from '../lib/pineappleFirestoreService';
import { checkIsFoul } from '../lib/pineapplePokerEvaluator';
import { getHeadToHeadStats, recordHeadToHeadMatch } from '../lib/headToHeadService';
import { getUserCurrentShortId, setUserActiveRoom, startActiveRoomHeartbeat } from '../lib/friendsService';
import { auth } from '../lib/firebase';
import { NetworkConnectionBadge } from './NetworkConnectionBadge';
import { TavernEmotesOverlay } from './TavernEmotesOverlay';
import { saveActiveSession, clearActiveSession } from '../lib/sessionManager';
import { reconnectionService } from '../lib/reconnectionService';

interface PineappleGameProps {
  roomCode: string;
  localPlayer: { id: string; name: string; avatarIcon: string; color: string };
  isHost: boolean;
  onHome: () => void;
}

export const PineappleGame: React.FC<PineappleGameProps> = ({
  roomCode,
  localPlayer,
  isHost,
  onHome,
}) => {
  const { language, t, theme, diceSkin, addXpForPlayer, recordWin, checkAchievement, updateProfileStats, awardMatchXp, trackQuestEvent } = useApp();
  const [roomState, setRoomState] = useState<PineappleRoomState | null>(null);

  // Save active session for auto-reconnection
  useEffect(() => {
    if (roomCode && roomState) {
      saveActiveSession('pineapple', roomCode, localPlayer, isHost);
    }
  }, [roomCode, roomState, localPlayer, isHost]);

  // Active room tracking for friends with heartbeat and auto-cleanup
  useEffect(() => {
    const user = auth.currentUser;
    if (!user || !roomCode) return;

    const shortId = getUserCurrentShortId(user.uid);
    if (roomState?.status === 'finished') {
      setUserActiveRoom(user.uid, shortId, null);
      return;
    }

    const stopHeartbeat = startActiveRoomHeartbeat(user.uid, shortId, () => {
      if (!roomState || roomState.status === 'finished') return null;
      return {
        mode: 'pineapple',
        roomCode,
        status: roomState?.status === 'in_game' ? 'in_game' : 'lobby',
        playerCount: roomState?.players.length || 1,
        maxPlayers: 2,
        hostName: roomState?.players.find((p) => p.isHost)?.name || localPlayer.name,
      };
    });

    return () => {
      stopHeartbeat();
    };
  }, [roomCode, roomState?.status, roomState?.players.length]);
  const [selectedSource, setSelectedSource] = useState<
    | { type: 'hand'; card: PlayingCard }
    | { type: 'board'; card: PlayingCard; fromRow: 'top' | 'middle' | 'bottom' }
    | null
  >(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showFantasyLandIntro, setShowFantasyLandIntro] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  // Match completion reward guard ref
  const rewardedMatchIdRef = React.useRef<string | null>(null);
  const hasShownFantasyIntroForHandRef = React.useRef<number | null>(null);

  // Local placement state during current round
  const [localBoard, setLocalBoard] = useState<PineappleBoard>(createEmptyBoard());
  const [localHandCards, setLocalHandCards] = useState<PlayingCard[]>([]);
  const [localDiscarded, setLocalDiscarded] = useState<PlayingCard[]>([]);

  // Snapshot of round start to allow free undo/moving within the same round
  const [roundSnapshot, setRoundSnapshot] = useState<{
    key: string;
    board: PineappleBoard;
    handCards: PlayingCard[];
    discarded: PlayingCard[];
  } | null>(null);

  // Subscribe to real-time room updates
  useEffect(() => {
    if (!roomCode) return;
    const unsubscribe = subscribeToPineappleRoom(
      roomCode,
      (state) => {
        if (state) {
          setRoomState(state);
          reconnectionService.notifyConnected('pineapple', roomCode);
        } else {
          reconnectionService.notifyDisconnected('pineapple', 'Camera nu mai există.');
        }
      },
      (err) => {
        reconnectionService.notifyDisconnected('pineapple', err?.message || 'Eroare conexiune');
      }
    );
    return () => unsubscribe();
  }, [roomCode]);

  // Register reconnection handler for pineapple
  useEffect(() => {
    const unregister = reconnectionService.registerHandler('pineapple', async (session) => {
      console.log('[Pineapple] Auto-reconnecting to room:', session.roomCode);
      return new Promise<boolean>((resolve) => {
        const unsub = subscribeToPineappleRoom(
          session.roomCode,
          (state) => {
            if (state) {
              setRoomState(state);
              reconnectionService.notifyConnected('pineapple', session.roomCode);
              resolve(true);
            } else {
              resolve(false);
            }
          },
          () => resolve(false)
        );
      });
    });
    return unregister;
  }, []);

  // Sync local player state when new hand/round arrives
  useEffect(() => {
    if (!roomState) return;
    const myPlayerState = roomState.players.find(p => p.id === localPlayer.id);
    if (!myPlayerState) {
      if (roomState.status === 'lobby') {
        onHome();
      }
      return;
    }

    const currentKey = `${roomState.currentHand}_${roomState.currentRoundInHand}_${myPlayerState.handLocked}`;

    // Check if new cards were dealt or new round began
    if (!myPlayerState.handLocked && (!roundSnapshot || roundSnapshot.key !== currentKey)) {
      const startingBoard = myPlayerState.board || createEmptyBoard();
      const rawHand = myPlayerState.currentHandCards || [];
      const startingHand = myPlayerState.inFantasyLand ? sortFantasyLandCards(rawHand) : rawHand;
      const startingDiscard = myPlayerState.discarded || [];

      setLocalBoard(startingBoard);
      setLocalHandCards(startingHand);
      setLocalDiscarded(startingDiscard);
      setSelectedSource(null);

      setRoundSnapshot({
        key: currentKey,
        board: {
          top: [...startingBoard.top],
          middle: [...startingBoard.middle],
          bottom: [...startingBoard.bottom],
        },
        handCards: [...startingHand],
        discarded: [...startingDiscard],
      });

      // Trigger Fantasy Land banner if just entered
      if (myPlayerState.inFantasyLand && roomState.currentRoundInHand === 1) {
        if (hasShownFantasyIntroForHandRef.current !== roomState.currentHand) {
          hasShownFantasyIntroForHandRef.current = roomState.currentHand;
          setShowFantasyLandIntro(true);
        }
      }
    }
  }, [
    roomState?.currentHand,
    roomState?.currentRoundInHand,
    roomState?.status,
    localPlayer.id,
    roundSnapshot?.key,
  ]);

  const myState = roomState?.players.find(p => p.id === localPlayer.id);
  const opponentState = roomState?.players.find(p => p.id !== localPlayer.id);

  // Match completion XP, Win & Achievements award
  useEffect(() => {
    if (!roomState || roomState.status !== 'finished') return;
    const matchKey = `${roomCode}_finished_${roomState.winnerId || 'end'}`;
    if (rewardedMatchIdRef.current === matchKey) return;
    rewardedMatchIdRef.current = matchKey;

    const isWinner = roomState.winnerId === localPlayer.id;
    const myAccumulatedSips = myState?.sipsAccumulated || 0;
    const myPoints = myState?.pointsAccumulated || 0;
    const oppPoints = opponentState?.pointsAccumulated || 0;

    const totalRoundsPlayed = (roomState.currentHand || 1) * 5;
    const isAntiFarming = (roomState.currentHand || 1) < 2 && (roomState.currentRoundInHand || 1) < 2;
    const isBotMatch = Boolean(opponentState?.isBot);
    const isCompletedMatch = roomState.status === 'finished' && !isAntiFarming;

    if (roomState.status === 'finished') {
      trackQuestEvent({ type: 'game_completed', mode: 'pineapple', isWinner });
      trackQuestEvent({ type: 'theme_played', theme });
      trackQuestEvent({ type: 'dice_skin_played', diceSkin });
      if (myAccumulatedSips > 0) {
        trackQuestEvent({ type: 'drink_sips', count: Math.round(myAccumulatedSips) });
      }
    }

    // Leaderboard & persistent stats: ONLY for completed matches against real human players (NOT bots, NOT unfinished)
    if (!isBotMatch && isCompletedMatch) {
      updateProfileStats(
        localPlayer.name || localPlayer.id,
        Math.round(myAccumulatedSips),
        0,
        undefined,
        isWinner ? 'pineapple' : undefined,
        myPoints
      );

      if (opponentState) {
        const winnerName = isWinner
          ? localPlayer.name
          : roomState.winnerId === opponentState.id
          ? opponentState.name
          : null;
        recordHeadToHeadMatch(
          localPlayer.name,
          opponentState.name,
          winnerName,
          'pineapple',
          !winnerName,
          myPoints,
          oppPoints
        );
      }

      awardMatchXp(localPlayer.name || localPlayer.id, 'pineapple', isWinner, totalRoundsPlayed, [], {
        sips: Math.round(myAccumulatedSips),
      });

      checkAchievement(localPlayer.name || localPlayer.id, { type: 'pineapple_played', count: 1 });

      if (isWinner) {
        recordWin(localPlayer.name || localPlayer.id, 'pineapple');
        checkAchievement(localPlayer.name || localPlayer.id, { type: 'pineapple_win', count: 1 });
      }
    }

    // Bot-specific victory achievements (awarded for practice mode against AI)
    if (isWinner && isBotMatch && roomState.status === 'finished') {
      if (opponentState?.botDifficulty === 'easy') {
        checkAchievement(localPlayer.name || localPlayer.id, { isPineappleBotWinEasy: true });
      } else if (opponentState?.botDifficulty === 'medium') {
        checkAchievement(localPlayer.name || localPlayer.id, { isPineappleBotWinMedium: true });
      } else if (opponentState?.botDifficulty === 'hard') {
        checkAchievement(localPlayer.name || localPlayer.id, { isPineappleBotWinHard: true });
      }
    }
  }, [roomState?.status, roomState?.winnerId, localPlayer.id, localPlayer.name, roomCode, myState?.sipsAccumulated, myState?.pointsAccumulated, opponentState?.name, opponentState?.id, opponentState?.pointsAccumulated, opponentState?.isBot, opponentState?.botDifficulty]);

  // Round / Hand specific achievements (Flawless Hand, Royalties, Scoop, Fantasy Land, Dragon & Royal Flush)
  useEffect(() => {
    if (!roomState) return;

    // Fantasy Land trigger
    if (myState?.qualifiesNextFantasyLand || myState?.inFantasyLand) {
      checkAchievement(localPlayer.name || localPlayer.id, { type: 'pineapple_fantasyland', count: 1 });
    }

    // Fantasy Land streak / re-entry
    if (myState?.inFantasyLand && myState?.qualifiesNextFantasyLand) {
      checkAchievement(localPlayer.name || localPlayer.id, { isPineappleFantasyStreak: true });
    }

    // Hand Scoring evaluations
    if (roomState.status === 'hand_scoring' && roomState.lastHandResult) {
      const result = roomState.lastHandResult;
      const playerA = roomState.players[0];
      const playerB = roomState.players[1];
      const isPlayerA = playerA?.id === localPlayer.id;
      const isPlayerB = playerB?.id === localPlayer.id;

      const myFoul = isPlayerA ? result.foulA : isPlayerB ? result.foulB : true;
      const myRoyalties = isPlayerA ? result.totalRoyaltiesA : isPlayerB ? result.totalRoyaltiesB : 0;
      const myDesc = isPlayerA ? result.handDescriptionA : isPlayerB ? result.handDescriptionB : null;

      // 1. Flawless hand without fouls
      if (!myFoul) {
        checkAchievement(localPlayer.name || localPlayer.id, { isPineappleFlawlessHand: true });
      }

      // 2. High Royalties (10+)
      if (myRoyalties >= 10) {
        checkAchievement(localPlayer.name || localPlayer.id, { isPineappleRoyalties: true });
      }

      // 3. Scoop 3/3
      const isPlayerScoop =
        (result.scoopWinner === 'A' && isPlayerA) ||
        (result.scoopWinner === 'B' && isPlayerB);
      if (isPlayerScoop) {
        checkAchievement(localPlayer.name || localPlayer.id, { type: 'pineapple_scoop', count: 1 });
      }

      // 4. Dragon / Royalties on bottom row or High Combos
      if (myDesc && !myFoul) {
        const bottomText = (myDesc.bottom || '').toLowerCase();
        if (
          bottomText.includes('full house') ||
          bottomText.includes('culoare') ||
          bottomText.includes('flush') ||
          bottomText.includes('careu') ||
          bottomText.includes('chintă') ||
          bottomText.includes('straight')
        ) {
          checkAchievement(localPlayer.name || localPlayer.id, { isPineappleDragon: true });
        }
        if (
          bottomText.includes('chintă regală') ||
          bottomText.includes('royal flush') ||
          bottomText.includes('careu de a') ||
          bottomText.includes('four aces')
        ) {
          checkAchievement(localPlayer.name || localPlayer.id, { isPineappleRoyalFlush: true });
        }
      }
    }
  }, [roomState?.status, roomState?.currentHand, myState?.inFantasyLand, myState?.qualifiesNextFantasyLand, localPlayer.id, localPlayer.name, roomState?.lastHandResult]);

  // Derived set of cards that were committed from PREVIOUS rounds
  const committedCardIds = React.useMemo(() => {
    if (!roundSnapshot) return new Set<string>();
    const ids = new Set<string>();
    roundSnapshot.board.top.forEach(c => ids.add(c.id));
    roundSnapshot.board.middle.forEach(c => ids.add(c.id));
    roundSnapshot.board.bottom.forEach(c => ids.add(c.id));
    return ids;
  }, [roundSnapshot]);

  const committedDiscardCount = roundSnapshot?.discarded.length || 0;
  const initialBoardCount = roundSnapshot
    ? roundSnapshot.board.top.length + roundSnapshot.board.middle.length + roundSnapshot.board.bottom.length
    : 0;

  const selectedCard = selectedSource?.card || null;

  // Selection Handlers
  const handleSelectCardFromHand = (card: PlayingCard) => {
    if (selectedSource?.type === 'hand' && selectedSource.card.id === card.id) {
      setSelectedSource(null);
    } else {
      setSelectedSource({ type: 'hand', card });
    }
  };

  const handleCardClickOnBoard = (
    card: PlayingCard,
    row: 'top' | 'middle' | 'bottom',
    isUncommitted: boolean
  ) => {
    if (!isUncommitted) {
      // Locked card from earlier round - cannot be modified
      return;
    }

    // Case 1: A card from Hand is currently selected -> Swap it with this uncommitted card on the board!
    if (selectedSource?.type === 'hand') {
      const handCard = selectedSource.card;
      handleSwapHandAndBoardCard(handCard, card, row);
      return;
    }

    // Case 2: A different card from the Board is currently selected -> Swap positions between the two board cards
    if (selectedSource?.type === 'board' && selectedSource.card.id !== card.id) {
      handleSwapBoardCards(selectedSource.card, selectedSource.fromRow, card, row);
      return;
    }

    // Case 3: Toggle selection of this board card
    if (selectedSource?.type === 'board' && selectedSource.card.id === card.id) {
      setSelectedSource(null);
    } else {
      setSelectedSource({ type: 'board', card, fromRow: row });
    }
  };

  // Swap a card in player's hand with an uncommitted card on the board
  const handleSwapHandAndBoardCard = (
    handCard: PlayingCard,
    boardCard: PlayingCard,
    targetRow: 'top' | 'middle' | 'bottom'
  ) => {
    // Replace boardCard with handCard on targetRow
    const updatedRow = localBoard[targetRow].map(c => (c.id === boardCard.id ? handCard : c));
    const updatedBoard: PineappleBoard = {
      ...localBoard,
      [targetRow]: updatedRow,
    };

    // Replace handCard with boardCard in localHandCards
    const updatedHand = localHandCards.map(c => (c.id === handCard.id ? boardCard : c));

    setLocalBoard(updatedBoard);
    setLocalHandCards(updatedHand);
    setSelectedSource(null);

    if (roomCode && !myState?.inFantasyLand) {
      updatePineapplePlayerBoard(
        roomCode,
        localPlayer.id,
        updatedBoard,
        updatedHand,
        localDiscarded
      );
    }
  };

  // Swap two uncommitted cards on the board
  const handleSwapBoardCards = (
    cardA: PlayingCard,
    rowA: 'top' | 'middle' | 'bottom',
    cardB: PlayingCard,
    rowB: 'top' | 'middle' | 'bottom'
  ) => {
    if (cardA.id === cardB.id) {
      setSelectedSource(null);
      return;
    }

    let updatedBoard: PineappleBoard;
    if (rowA === rowB) {
      const newRow = localBoard[rowA].map(c => {
        if (c.id === cardA.id) return cardB;
        if (c.id === cardB.id) return cardA;
        return c;
      });
      updatedBoard = {
        ...localBoard,
        [rowA]: newRow,
      };
    } else {
      const newRowA = localBoard[rowA].map(c => (c.id === cardA.id ? cardB : c));
      const newRowB = localBoard[rowB].map(c => (c.id === cardB.id ? cardA : c));
      updatedBoard = {
        ...localBoard,
        [rowA]: newRowA,
        [rowB]: newRowB,
      };
    }

    setLocalBoard(updatedBoard);
    setSelectedSource(null);

    if (roomCode && !myState?.inFantasyLand) {
      updatePineapplePlayerBoard(
        roomCode,
        localPlayer.id,
        updatedBoard,
        localHandCards,
        localDiscarded
      );
    }
  };

  // Handle dropping a card directly onto another card on the board
  const handleDropOnCard = (
    targetCard: PlayingCard,
    targetRow: 'top' | 'middle' | 'bottom',
    droppedCardId: string
  ) => {
    if (committedCardIds.has(targetCard.id)) {
      // If target card is committed, just try placing on the row if room allows
      const droppedCard =
        localHandCards.find(c => c.id === droppedCardId) ||
        localBoard.top.find(c => c.id === droppedCardId) ||
        localBoard.middle.find(c => c.id === droppedCardId) ||
        localBoard.bottom.find(c => c.id === droppedCardId);
      if (droppedCard) handlePlaceCardOnRow(targetRow, droppedCard);
      return;
    }

    // Is dropped card in hand?
    const handCard = localHandCards.find(c => c.id === droppedCardId);
    if (handCard) {
      handleSwapHandAndBoardCard(handCard, targetCard, targetRow);
      return;
    }

    // Is dropped card on board?
    const fromRow = localBoard.top.some(c => c.id === droppedCardId)
      ? 'top'
      : localBoard.middle.some(c => c.id === droppedCardId)
      ? 'middle'
      : localBoard.bottom.some(c => c.id === droppedCardId)
      ? 'bottom'
      : null;

    if (fromRow) {
      const sourceCard = localBoard[fromRow].find(c => c.id === droppedCardId);
      if (sourceCard && !committedCardIds.has(sourceCard.id)) {
        handleSwapBoardCards(sourceCard, fromRow, targetCard, targetRow);
        return;
      }
    }

    // Fallback: place on row
    const droppedCard =
      localHandCards.find(c => c.id === droppedCardId) ||
      localBoard.top.find(c => c.id === droppedCardId) ||
      localBoard.middle.find(c => c.id === droppedCardId) ||
      localBoard.bottom.find(c => c.id === droppedCardId);
    if (droppedCard) handlePlaceCardOnRow(targetRow, droppedCard);
  };

  const handleReturnCardToHand = (card: PlayingCard, fromRow: 'top' | 'middle' | 'bottom') => {
    const updatedRow = localBoard[fromRow].filter(c => c.id !== card.id);
    const updatedBoard: PineappleBoard = {
      ...localBoard,
      [fromRow]: updatedRow,
    };
    const rawHand = [...localHandCards, card];
    const updatedHand = myState?.inFantasyLand ? sortFantasyLandCards(rawHand) : rawHand;

    setLocalBoard(updatedBoard);
    setLocalHandCards(updatedHand);
    if (selectedSource?.card.id === card.id) {
      setSelectedSource(null);
    }

    if (roomCode && !myState?.inFantasyLand) {
      updatePineapplePlayerBoard(
        roomCode,
        localPlayer.id,
        updatedBoard,
        updatedHand,
        localDiscarded
      );
    }
  };

  const handlePlaceCardOnRow = (targetRow: 'top' | 'middle' | 'bottom', explicitCard?: PlayingCard) => {
    const currentCards = localBoard[targetRow];
    const maxCapacity = targetRow === 'top' ? 3 : 5;

    if (currentCards.length >= maxCapacity) {
      return;
    }

    // Determine what we're placing
    let source = selectedSource;
    if (explicitCard) {
      if (localHandCards.some(c => c.id === explicitCard.id)) {
        source = { type: 'hand', card: explicitCard };
      } else {
        const r = localBoard.top.some(c => c.id === explicitCard.id)
          ? 'top'
          : localBoard.middle.some(c => c.id === explicitCard.id)
          ? 'middle'
          : 'bottom';
        source = { type: 'board', card: explicitCard, fromRow: r };
      }
    }

    if (!source) return;

    if (source.type === 'hand') {
      const targetCard = source.card;
      // In rounds 2..5 (where 3 cards are dealt), enforce max 2 cards placed on board per round
      if (roomState && roomState.currentRoundInHand > 1 && !myState?.inFantasyLand) {
        const currentPlacedThisRound =
          localBoard.top.length + localBoard.middle.length + localBoard.bottom.length - initialBoardCount;

        if (currentPlacedThisRound >= 2) {
          alert(
            language === 'ro'
              ? 'Ai plasat deja 2 cărți pe rânduri în această rundă! A 3-a carte trebuie aruncată la Discard.'
              : 'You already placed 2 cards this round! The 3rd card must be placed in Discard.'
          );
          return;
        }
      }

      const updatedBoard: PineappleBoard = {
        ...localBoard,
        [targetRow]: [...currentCards, targetCard],
      };
      const updatedHand = localHandCards.filter(c => c.id !== targetCard.id);

      setLocalBoard(updatedBoard);
      setLocalHandCards(updatedHand);
      setSelectedSource(null);

      if (roomCode && !myState?.inFantasyLand) {
        updatePineapplePlayerBoard(
          roomCode,
          localPlayer.id,
          updatedBoard,
          updatedHand,
          localDiscarded
        );
      }
    } else if (source.type === 'board') {
      const { card: targetCard, fromRow } = source;
      if (fromRow === targetRow) {
        setSelectedSource(null);
        return;
      }

      const updatedFromRow = localBoard[fromRow].filter(c => c.id !== targetCard.id);
      const updatedTargetRow = [...localBoard[targetRow], targetCard];

      const updatedBoard: PineappleBoard = {
        ...localBoard,
        [fromRow]: updatedFromRow,
        [targetRow]: updatedTargetRow,
      };

      setLocalBoard(updatedBoard);
      setSelectedSource(null);

      if (roomCode && !myState?.inFantasyLand) {
        updatePineapplePlayerBoard(
          roomCode,
          localPlayer.id,
          updatedBoard,
          localHandCards,
          localDiscarded
        );
      }
    }
  };

  const handleDiscardCard = (explicitCard?: PlayingCard) => {
    let source = selectedSource;
    if (explicitCard) {
      if (localHandCards.some(c => c.id === explicitCard.id)) {
        source = { type: 'hand', card: explicitCard };
      } else {
        const r = localBoard.top.some(c => c.id === explicitCard.id)
          ? 'top'
          : localBoard.middle.some(c => c.id === explicitCard.id)
          ? 'middle'
          : 'bottom';
        source = { type: 'board', card: explicitCard, fromRow: r };
      }
    }

    if (!source) return;

    // Discard is only allowed in rounds 2..5 (when 3 cards are dealt)
    if (roomState?.currentRoundInHand === 1 && !myState?.inFantasyLand) {
      return;
    }

    const currentDiscardedThisRound = localDiscarded.length - committedDiscardCount;
    if (currentDiscardedThisRound >= 1) {
      alert(
        language === 'ro'
          ? 'Ai aruncat deja 1 carte în această rundă! Anulează discard-ul dacă vrei să schimbi cartea.'
          : 'You already discarded 1 card this round! Undo discard to change.'
      );
      return;
    }

    const targetCard = source.card;
    let updatedBoard = localBoard;
    let updatedHand = localHandCards;

    if (source.type === 'hand') {
      updatedHand = localHandCards.filter(c => c.id !== targetCard.id);
    } else if (source.type === 'board') {
      updatedBoard = {
        ...localBoard,
        [source.fromRow]: localBoard[source.fromRow].filter(c => c.id !== targetCard.id),
      };
    }

    const updatedDiscarded = [...localDiscarded, targetCard];

    setLocalBoard(updatedBoard);
    setLocalHandCards(updatedHand);
    setLocalDiscarded(updatedDiscarded);
    setSelectedSource(null);

    if (roomCode && !myState?.inFantasyLand) {
      updatePineapplePlayerBoard(
        roomCode,
        localPlayer.id,
        updatedBoard,
        updatedHand,
        updatedDiscarded
      );
    }
  };

  const handleUndoDiscard = () => {
    if (localDiscarded.length <= committedDiscardCount) return;
    const cardToReturn = localDiscarded[localDiscarded.length - 1];
    const updatedDiscarded = localDiscarded.slice(0, localDiscarded.length - 1);
    const rawHand = [...localHandCards, cardToReturn];
    const updatedHand = myState?.inFantasyLand ? sortFantasyLandCards(rawHand) : rawHand;

    setLocalDiscarded(updatedDiscarded);
    setLocalHandCards(updatedHand);
    setSelectedSource(null);

    if (roomCode && !myState?.inFantasyLand) {
      updatePineapplePlayerBoard(
        roomCode,
        localPlayer.id,
        localBoard,
        updatedHand,
        updatedDiscarded
      );
    }
  };

  const handleResetTurn = () => {
    if (!roundSnapshot) return;
    setLocalBoard({
      top: [...roundSnapshot.board.top],
      middle: [...roundSnapshot.board.middle],
      bottom: [...roundSnapshot.board.bottom],
    });
    setLocalHandCards([...roundSnapshot.handCards]);
    setLocalDiscarded([...roundSnapshot.discarded]);
    setSelectedSource(null);

    if (roomCode && !myState?.inFantasyLand) {
      updatePineapplePlayerBoard(
        roomCode,
        localPlayer.id,
        roundSnapshot.board,
        roundSnapshot.handCards,
        roundSnapshot.discarded
      );
    }
  };

  // Check if placement allows auto-discard (2 cards placed out of 3 dealt in rounds 2..5, OR 13 cards placed in Fantasy Land)
  const isAutoDiscardReady = (): boolean => {
    if (!roomState || !myState) return false;

    if (myState.inFantasyLand) {
      const totalPlaced =
        localBoard.top.length + localBoard.middle.length + localBoard.bottom.length;
      return (
        totalPlaced === 13 &&
        localHandCards.length === 1 &&
        localDiscarded.length === 0
      );
    }

    if (roomState.currentRoundInHand <= 1) return false;
    const totalPlaced =
      localBoard.top.length + localBoard.middle.length + localBoard.bottom.length;
    const placedThisRound = totalPlaced - initialBoardCount;
    return (
      placedThisRound === 2 &&
      localHandCards.length === 1 &&
      localDiscarded.length === committedDiscardCount
    );
  };

  // Check if placement requirements for current round are strictly met
  const isRoundComplete = (): boolean => {
    if (!roomState || !myState) return false;

    if (myState.inFantasyLand) {
      // Fantasy Land: All 13 cards must be placed across 3 rows, with 1 card discarded (or auto-discard ready)
      const totalPlaced =
        localBoard.top.length + localBoard.middle.length + localBoard.bottom.length;
      if (totalPlaced !== 13) return false;
      if (localDiscarded.length === 1 && localHandCards.length === 0) return true;
      if (isAutoDiscardReady()) return true;
      return false;
    }

    if (roomState.currentRoundInHand === 1) {
      // Initial deal (5 cards): exactly 5 must be placed on board, 0 discarded
      const totalPlaced =
        localBoard.top.length + localBoard.middle.length + localBoard.bottom.length;
      return totalPlaced === 5 && localHandCards.length === 0 && localDiscarded.length === 0;
    }

    // Pineapple rounds 2, 3, 4, 5:
    // If user placed 2 cards, the 1 remaining card will be auto-discarded when clicking Continue!
    if (isAutoDiscardReady()) {
      return true;
    }

    const expectedPlaced = 5 + (roomState.currentRoundInHand - 1) * 2;
    const expectedDiscarded = roomState.currentRoundInHand - 1;
    const totalPlaced =
      localBoard.top.length + localBoard.middle.length + localBoard.bottom.length;

    return (
      totalPlaced === expectedPlaced &&
      localDiscarded.length === expectedDiscarded &&
      localHandCards.length === 0
    );
  };

  const handleConfirmLockRound = async () => {
    if (!roomCode || !isRoundComplete()) return;
    try {
      let finalDiscarded = [...localDiscarded];
      // Auto-discard remaining 1 card if user placed all required cards without manual discard
      if (isAutoDiscardReady() && localHandCards.length === 1) {
        finalDiscarded = [...localDiscarded, localHandCards[0]];
      }

      await lockPineapplePlayerHand(
        roomCode,
        localPlayer.id,
        localBoard,
        finalDiscarded
      );
    } catch (e) {
      console.error('Error locking hand round:', e);
    }
  };

  // Keyboard Shortcuts for Desktop: Space/Enter = Confirm round, 1/2/3/T/M/B = Place on Row, D = Discard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === 'Space' || e.code === 'Enter') {
        if (showFantasyLandIntro) {
          e.preventDefault();
          setShowFantasyLandIntro(false);
        } else if (roomState?.status === 'finished' && isHost) {
          e.preventDefault();
          handleStartMatch();
        } else if (roomState?.status === 'in_hand' && !myState?.handLocked && isRoundComplete()) {
          e.preventDefault();
          handleConfirmLockRound();
        }
      } else if (selectedSource && !myState?.handLocked) {
        if (e.key === '1' || e.key.toLowerCase() === 't') {
          e.preventDefault();
          handlePlaceCardOnRow('top');
        } else if (e.key === '2' || e.key.toLowerCase() === 'm') {
          e.preventDefault();
          handlePlaceCardOnRow('middle');
        } else if (e.key === '3' || e.key.toLowerCase() === 'b' || e.key.toLowerCase() === 'j') {
          e.preventDefault();
          handlePlaceCardOnRow('bottom');
        } else if (e.key.toLowerCase() === 'd' || e.key === '4') {
          e.preventDefault();
          handleDiscardCard();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    showFantasyLandIntro,
    roomState?.status,
    isHost,
    myState?.handLocked,
    isRoundComplete(),
    selectedSource,
    localBoard,
    localHandCards,
    localDiscarded,
  ]);

  const handleStartMatch = async () => {
    if (!roomCode) return;
    try {
      await startPineappleMatch(roomCode);
    } catch (e: any) {
      alert(e.message || 'Eroare la pornirea meciului!');
    }
  };

  const handleEndGame = async () => {
    if (!roomCode) return;
    try {
      await endPineappleMatch(roomCode);
      setShowEndConfirm(false);
    } catch (e) {
      console.error('Error ending pineapple match:', e);
    }
  };

  const handleAddBot = async (diff: PineappleBotDifficulty = 'medium') => {
    if (!roomCode) return;
    await addPineappleBot(roomCode, diff);
  };

  const handleRemovePlayer = async (playerId: string) => {
    if (!roomCode) return;
    await removePineapplePlayer(roomCode, playerId);
  };

  const handleRemoveBot = async () => {
    if (!roomCode) return;
    await removePineappleBot(roomCode);
  };

  const handleNextHand = async () => {
    if (!roomCode) return;
    await startNextPineappleHand(roomCode);
  };

  const handleCopyInvite = () => {
    const url = `${window.location.origin}?pineapple_room=${roomCode}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  if (!roomState) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 p-4 text-center">
        <div className="text-4xl animate-spin">🍍</div>
        <p className="font-cinzel text-amber-300 text-base">
          {language === 'ro' ? 'Se deschide camera de Pineapple...' : 'Connecting to Pineapple Room...'}
        </p>
      </div>
    );
  }

  // 1. LOBBY VIEW
  if (roomState.status === 'lobby') {
    return (
      <div className="max-w-xl mx-auto p-3 sm:p-4 space-y-4 animate-fade-in select-none">
        <div className="bg-[#18110a]/95 border-2 border-[#ffd700] rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 gold-glow">
          {/* Header */}
          <div className="text-center space-y-1 border-b border-[#2d1e12] pb-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-cinzel font-bold">
              <span>🍍</span>
              <span>1v1 Online Open Face Chinese Poker</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-cinzel font-black text-[#ffd700] gold-text-glow">
              Pineapple Poker
            </h1>
            <p className="text-xs font-barlow text-gray-300">
              {language === 'ro'
                ? 'Plasează 13 cărți pe 3 rânduri (Top ≤ Mijloc ≤ Jos) și convertește punctele în guri de băutură!'
                : 'Place 13 cards across 3 rows (Top ≤ Middle ≤ Bottom) and convert points to drinking sips!'}
            </p>
          </div>

          {/* Room Code Card */}
          <div className="bg-[#0f0a06] p-3 sm:p-4 rounded-2xl border border-[#2d1e12] text-center space-y-2">
            <span className="text-[11px] font-cinzel uppercase text-gray-400">
              {language === 'ro' ? 'Codul Chiliei / Camerei' : 'Room Code'}
            </span>
            <div className="text-3xl sm:text-4xl font-cinzel font-black tracking-widest text-[#ffd700] gold-text-glow">
              {roomCode}
            </div>

            <button
              type="button"
              onClick={handleCopyInvite}
              className="px-3 py-1.5 rounded-xl bg-amber-950/60 hover:bg-amber-900 border border-amber-500/50 text-amber-300 text-xs font-cinzel font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>🔗</span>
              <span>{language === 'ro' ? (copiedLink ? 'Link Copiat!' : 'Copiază Link Invitație') : (copiedLink ? 'Link Copied!' : 'Copy Invite Link')}</span>
            </button>
          </div>

          {/* Settings Summary */}
          <div className="grid grid-cols-2 gap-2 text-center text-xs font-cinzel">
            <div className="bg-[#120c07] p-2.5 rounded-xl border border-stone-800">
              <span className="text-gray-400 block text-[10px] uppercase">{language === 'ro' ? 'Guri per Punct' : 'Sips per Point'}</span>
              <strong className="text-[#ffd700] text-sm sm:text-base">
                {roomState.settings.sipsPerPoint} {language === 'ro' ? 'guri' : 'sips'}
              </strong>
            </div>
            <div className="bg-[#120c07] p-2.5 rounded-xl border border-stone-800">
              <span className="text-gray-400 block text-[10px] uppercase">{language === 'ro' ? 'Prag Final Joc' : 'Endgame Threshold'}</span>
              <strong className="text-red-400 text-sm sm:text-base">
                {roomState.settings.sipsToEndGame} {language === 'ro' ? 'guri' : 'sips'}
              </strong>
            </div>
          </div>

          {/* Connected Players */}
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-[#2d2116] pb-1.5">
              <label className="text-xs font-cinzel font-bold text-[#ffd700] uppercase tracking-wider block flex items-center gap-1.5">
                <span>👥</span>
                <span>{language === 'ro' ? `Călugări în Chilie (${roomState.players.length}/2)` : `Monks in Room (${roomState.players.length}/2)`}</span>
              </label>

              {isHost && roomState.players.length < 2 && (
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-gray-400 font-cinzel hidden xs:inline">+ Bot:</span>
                  {(['easy', 'medium', 'hard'] as PineappleBotDifficulty[]).map((diff) => {
                    const label = diff === 'easy'
                      ? (language === 'ro' ? '🟢 Ușor' : '🟢 Easy')
                      : diff === 'medium'
                      ? (language === 'ro' ? '🟡 Mediu' : '🟡 Medium')
                      : (language === 'ro' ? '🔴 Greu' : '🔴 Hard');
                    return (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => handleAddBot(diff)}
                        className="px-2 py-1 text-[10px] bg-[#2b1f14] hover:bg-[#3d2c1c] text-[#ffd700] border border-[#61452a] hover:border-[#ffd700]/70 rounded-lg font-cinzel font-bold transition-all active:scale-95 flex items-center gap-0.5 cursor-pointer shadow"
                        title={language === 'ro' ? `Adaugă bot ${BOT_PROFILES[diff]?.name}` : `Add bot ${BOT_PROFILES[diff]?.name}`}
                      >
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {roomState.players.map((p) => {
                const isMe = p.id === localPlayer.id;
                const botProfile = p.isBot ? BOT_PROFILES[p.botDifficulty || 'medium'] : null;
                return (
                  <div
                    key={p.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 transition-all ${
                      isMe
                        ? 'bg-[#25190e] border-[#ffd700]/70 shadow-md ring-1 ring-[#ffd700]/30'
                        : 'bg-[#120c07] border-[#2d1e12]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className="text-2xl">{p.avatarIcon || '🧙‍♂️'}</span>
                      <div className="min-w-0 flex-1">
                        <div className="font-cinzel font-bold text-xs sm:text-sm text-gray-200 truncate flex items-center gap-1.5">
                          <span style={{ color: p.color || '#e8c84a' }}>{p.name}</span>
                          {isMe && <span className="text-amber-400 text-[10px]">{language === 'ro' ? '(Tu)' : '(You)'}</span>}
                        </div>
                        <div className="text-[10px] text-amber-400/80 flex items-center gap-1">
                          {p.isHost ? (
                            language === 'ro' ? '👑 Gazdă' : '👑 Host'
                          ) : p.isBot ? (
                            <span className="flex items-center gap-1 text-amber-300">
                              <span>🤖 AI Bot</span>
                              {botProfile && (
                                <span className="px-1 py-0.2 rounded text-[9px] bg-stone-900 border border-stone-700">
                                  {language === 'ro' ? botProfile.titleRo : botProfile.titleEn}
                                </span>
                              )}
                            </span>
                          ) : (
                            language === 'ro' ? '⚔️ Oaspete' : '⚔️ Guest'
                          )}
                        </div>
                      </div>
                    </div>

                    {isHost && !isMe && (
                      <button
                        type="button"
                        onClick={() => handleRemovePlayer(p.id)}
                        className="px-2 py-1 rounded-lg bg-red-950/70 hover:bg-red-900 border border-red-500/40 text-red-300 text-xs font-bold transition-all cursor-pointer flex-shrink-0"
                        title={p.isBot ? (language === 'ro' ? 'Scoate botul' : 'Remove bot') : (language === 'ro' ? 'Dă afară jucătorul' : 'Kick player')}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                );
              })}

              {roomState.players.length < 2 && (
                <div className="border-2 border-dashed border-[#2d1e12] p-3 rounded-xl flex flex-col items-center justify-center text-center text-gray-500 text-xs">
                  <span>{language === 'ro' ? 'Așteptăm al doilea jucător sau adaugă un bot...' : 'Waiting for second player or add a bot...'}</span>
                </div>
              )}
            </div>

            {/* 1v1 Head-to-Head Tracker in Lobby */}
            {roomState.players.length === 2 && (
              <div className="pt-2">
                <HeadToHeadTracker
                  player1={{
                    name: roomState.players[0].name,
                    avatarIcon: roomState.players[0].avatarIcon,
                    color: roomState.players[0].color,
                  }}
                  player2={{
                    name: roomState.players[1].name,
                    avatarIcon: roomState.players[1].avatarIcon,
                    color: roomState.players[1].color,
                  }}
                  variant="banner"
                  currentMode="pineapple"
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-2">
            {isHost ? (
              <button
                type="button"
                onClick={handleStartMatch}
                disabled={roomState.players.length < 2}
                className={`w-full py-3 px-4 rounded-2xl font-cinzel font-black text-base transition-all shadow-lg cursor-pointer ${
                  roomState.players.length >= 2
                    ? 'bg-gradient-to-r from-[#d4a017] via-[#ffd700] to-[#b8860b] hover:from-[#e5b128] hover:via-[#ffe033] hover:to-[#c9971c] text-black shadow-[0_0_20px_rgba(255,215,0,0.5)] active:scale-95'
                    : 'bg-stone-800 text-gray-500 cursor-not-allowed'
                }`}
              >
                {roomState.players.length >= 2
                  ? (language === 'ro' ? 'Începe Meciul de Pineapple ➔' : 'Start Pineapple Match ➔')
                  : (language === 'ro' ? 'Așteptăm al 2-lea călugăr...' : 'Waiting for 2nd monk...')}
              </button>
            ) : (
              <div className="text-center py-2 text-xs font-cinzel text-amber-300 animate-pulse">
                {language === 'ro' ? 'Așteptăm ca gazda să înceapă meciul...' : 'Waiting for host to start match...'}
              </div>
            )}

            <button
              type="button"
              onClick={onHome}
              className="w-full py-2 text-xs font-cinzel text-gray-400 hover:text-white transition-colors text-center cursor-pointer"
            >
              {language === 'ro' ? '← Înapoi la Meniul Principal' : '← Back to Main Menu'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. FINISHED / PODIUM VIEW
  if (roomState.status === 'finished') {
    const winner = roomState.players.find(p => p.id === roomState.winnerId);
    const loser = roomState.players.find(p => p.id === roomState.loserId);
    const isWinner = roomState.winnerId === localPlayer.id;
    const p0 = roomState.players[0];
    const p1 = roomState.players[1];
    const h2hStats = p0 && p1 ? getHeadToHeadStats(p0.name, p1.name) : null;

    return (
      <div className="max-w-xl mx-auto p-3 sm:p-4 space-y-4 animate-fade-in select-none">
        <div className="bg-[#18110a]/95 border-2 border-[#ffd700] rounded-3xl p-5 sm:p-7 text-center space-y-4 gold-glow shadow-2xl">
          <div className="text-5xl sm:text-6xl animate-bounce">
            {isWinner ? '👑' : '🍺'}
          </div>

          <div className="space-y-1">
            <span className="text-xs font-cinzel uppercase tracking-widest text-amber-400 font-bold">
              {language === 'ro' ? 'MECIUL S-A ÎNCHEIAT!' : 'MATCH FINISHED!'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-cinzel font-black text-[#ffd700] gold-text-glow">
              {isWinner
                ? language === 'ro'
                  ? 'VICTORIE ÎN PINEAPPLE!'
                  : 'PINEAPPLE VICTORY!'
                : language === 'ro'
                ? 'AI FOST ÎNVINS!'
                : 'YOU WERE DEFEATED!'}
            </h1>
            <p className="text-xs font-barlow text-gray-300">
              {loser?.name} a acumulat{' '}
              <strong className="text-red-400">{loser?.sipsAccumulated.toFixed(1)} guri</strong>{' '}
              (atingând pragul de {roomState.settings.sipsToEndGame} guri).
            </p>
          </div>

          {/* Current Match Stats Breakdown */}
          <div className="grid grid-cols-2 gap-3 text-xs font-cinzel pt-2">
            <div className="bg-emerald-950/40 p-3 rounded-2xl border border-emerald-500/50">
              <span className="text-emerald-400 font-bold block">CÂȘTIGĂTOR</span>
              <div className="text-base font-black text-white mt-1">{winner?.name}</div>
              <div className="text-[11px] text-gray-400 mt-0.5">
                {winner?.sipsAccumulated.toFixed(1)} guri • <strong className="text-[#ffd700]">{winner?.pointsAccumulated || 0} pct</strong>
              </div>
            </div>

            <div className="bg-red-950/40 p-3 rounded-2xl border border-red-500/50">
              <span className="text-red-400 font-bold block">PIERZĂTOR</span>
              <div className="text-base font-black text-white mt-1">{loser?.name}</div>
              <div className="text-[11px] text-gray-400 mt-0.5">
                {loser?.sipsAccumulated.toFixed(1)} guri • <strong className="text-red-300">{loser?.pointsAccumulated || 0} pct</strong>
              </div>
            </div>
          </div>

          {/* 1v1 ALL-TIME POINTS COUNTER */}
          {h2hStats && p0 && p1 && (
            <div className="bg-[#0c0804] border-2 border-[#ffd700]/60 rounded-2xl p-3 sm:p-4 text-center space-y-2 shadow-inner">
              <div className="text-[11px] font-cinzel text-amber-300 font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
                <span className="text-base">🏆</span>
                <span>{language === 'ro' ? 'Puncte All-Time 1v1 Directe' : '1v1 All-Time Total Points'}</span>
              </div>
              <div className="flex items-center justify-center gap-4 text-2xl sm:text-3xl font-bebas font-black">
                <span className="text-[#ffd700] gold-text-glow">{p0.name}: {h2hStats.player1Points || 0} pct</span>
                <span className="text-gray-500 text-sm font-cinzel">⚔️</span>
                <span className="text-[#e05c3a]">{p1.name}: {h2hStats.player2Points || 0} pct</span>
              </div>
              <div className="text-[11px] font-cinzel text-gray-400">
                Palmares Meciuri: <strong className="text-[#ffd700]">{h2hStats.player1Wins} Victorii</strong> vs <strong className="text-[#ffd700]">{h2hStats.player2Wins} Victorii</strong> ({h2hStats.totalMatches} meciuri în total)
              </div>
            </div>
          )}

          <div className="pt-3 space-y-2">
            {isHost && (
              <button
                type="button"
                onClick={handleStartMatch}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#d4a017] via-[#ffd700] to-[#b8860b] text-black font-cinzel font-black text-sm shadow-[0_0_20px_rgba(255,215,0,0.5)] active:scale-95 transition-all cursor-pointer"
              >
                {language === 'ro' ? 'Joacă din Nou ➔' : 'Play Again ➔'}
              </button>
            )}

            <button
              type="button"
              onClick={onHome}
              className="w-full py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-gray-200 text-xs font-cinzel font-bold transition-all cursor-pointer"
            >
              {language === 'ro' ? 'Înapoi la Meniu' : 'Back to Home'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. IN_HAND / PLAYING VIEW
  return (
    <div className="max-w-4xl mx-auto p-1 sm:p-1.5 space-y-1 sm:space-y-1.5 animate-fade-in select-none">
      {/* Fantasy Land Dramatic Screen Overlay (Click anywhere to skip) */}
      {showFantasyLandIntro && (
        <div
          style={{ zIndex: 99999 }}
          onClick={() => setShowFantasyLandIntro(false)}
          className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center animate-fade-in select-none cursor-pointer group"
          role="button"
          tabIndex={0}
          aria-label="Fantasy Land Intro"
        >
          <div className="relative max-w-md w-full p-6 rounded-3xl bg-[#1a1209]/90 border-2 border-[#ffd700] shadow-[0_0_50px_rgba(255,215,0,0.4)] flex flex-col items-center space-y-3 transform transition-all group-hover:scale-102">
            <div className="text-6xl sm:text-7xl animate-bounce">✨👑✨</div>
            <h1 className="text-2xl sm:text-4xl font-cinzel font-black text-[#ffd700] gold-text-glow animate-pulse">
              FANTASY LAND!
            </h1>
            <p className="text-xs sm:text-sm font-cinzel text-amber-200">
              {language === 'ro'
                ? 'Ai primit 14 cărți deodată în ordine (2 ➔ As)! Plasează 13 pe rânduri și aruncă 1 la Discard!'
                : 'You received 14 cards sorted (2 ➔ Ace)! Place 13 on rows and discard 1!'}
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFantasyLandIntro(false);
                }}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#d4a017] via-[#ffd700] to-[#b8860b] text-black font-cinzel font-black text-xs sm:text-sm shadow-lg hover:shadow-[0_0_20px_rgba(255,215,0,0.6)] active:scale-95 transition-all cursor-pointer"
              >
                {language === 'ro' ? 'Începe Plasarea Cărților ➔ (Skip)' : 'Start Placing Cards ➔ (Skip)'}
              </button>
            </div>
            <div className="text-[11px] text-gray-400 font-cinzel">
              {language === 'ro' ? 'Apasă oriunde pe ecran pentru a închide' : 'Click / tap anywhere to dismiss'}
            </div>
          </div>
        </div>
      )}

      {/* Top Match Bar with Integrated Opponent Mini Widget & End Game button */}
      <div className="bg-[#140e08]/90 border border-[#2d1e12] rounded-xl p-1 sm:p-1.5 flex items-center justify-between gap-1.5 sm:gap-2 shadow-md">
        {/* Left: Home, Round Info & End Match */}
        <div className="flex items-center gap-1.5 min-w-0">
          <button
            type="button"
            onClick={onHome}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-gray-300 hover:text-white text-xs font-cinzel font-bold flex items-center justify-center cursor-pointer flex-shrink-0 transition-colors"
            title={language === 'ro' ? 'Meniul principal' : 'Main menu'}
          >
            ✕
          </button>
          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-cinzel font-black text-[#ffd700] truncate">
              {language === 'ro' ? `Pineapple 1v1 • Mâna #${roomState.currentHand}` : `Pineapple 1v1 • Hand #${roomState.currentHand}`}
            </div>
            <div className="text-[9px] sm:text-[10px] font-cinzel text-gray-400 truncate">
              {myState?.inFantasyLand
                ? (language === 'ro' ? '✨ Faza Fantasy Land (13 cărți)' : '✨ Fantasy Land Phase (13 cards)')
                : language === 'ro'
                ? `Runda #${roomState.currentRoundInHand}/5 (${
                    roomState.currentRoundInHand === 1 ? '5 cărți' : '3 cărți (2 pui, 1 arunci)'
                  })`
                : `Round #${roomState.currentRoundInHand}/5 (${
                    roomState.currentRoundInHand === 1 ? '5 cards' : '3 cards (2 set, 1 discard)'
                  })`}
            </div>
          </div>
        </div>

        {/* Center: Live Sips Tracker & Turn Status */}
        <div className="flex items-center gap-2">
          {myState?.handLocked ? (
            <div className="px-2 py-0.5 rounded-lg border border-emerald-500/60 bg-emerald-950/80 text-emerald-300 text-[10px] sm:text-[11px] font-cinzel font-bold flex items-center gap-1">
              <span>✓</span>
              <span>{language === 'ro' ? 'Rundă Blocată' : 'Round Locked'}</span>
            </div>
          ) : (
            <div className="px-2 py-0.5 rounded-lg border border-amber-500/60 bg-amber-950/80 text-amber-300 text-[10px] sm:text-[11px] font-cinzel font-bold flex items-center gap-1 animate-pulse">
              <span>🃏</span>
              <span>{language === 'ro' ? 'Plasează cărțile' : 'Place cards'}</span>
            </div>
          )}

          <div className="hidden md:flex items-center bg-[#0a0704] px-2.5 py-1 rounded-lg border border-stone-800 text-[11px] font-cinzel">
            <div className="text-center">
              <div className="text-[8px] text-gray-400 uppercase tracking-wider">{language === 'ro' ? 'Guri Acumulate' : 'Accumulated Sips'}</div>
              <div className="font-black">
                <span className="text-emerald-400 font-bold">{myState?.sipsAccumulated.toFixed(1)} ({language === 'ro' ? 'Tu' : 'You'})</span>
                <span className="text-gray-600"> vs </span>
                <span className="text-red-400 font-bold">{opponentState?.sipsAccumulated.toFixed(1)} ({opponentState?.name})</span>
                <span className="text-gray-500 text-[9px]"> / {roomState.settings.sipsToEndGame}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: End Match button & Interactive Opponent Mini Board */}
        <div className="flex items-center gap-1.5">
          <NetworkConnectionBadge />
          <button
            type="button"
            onClick={() => setShowEndConfirm(true)}
            className="px-2 py-1 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-200 text-[10px] sm:text-xs font-cinzel font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow flex-shrink-0"
            title={language === 'ro' ? 'Încheie meciul curent' : 'End match now'}
          >
            <span>🏁</span>
            <span className="hidden sm:inline">{language === 'ro' ? 'Încheie' : 'End'}</span>
          </button>

          {opponentState && (
            <PineappleOpponentWidget
              opponent={opponentState}
              language={language}
              sipsThreshold={roomState.settings.sipsToEndGame}
            />
          )}
        </div>
      </div>

      {/* Main Center Area: Player's Interactive Board */}
      <div className="w-full max-w-xl mx-auto">
        {myState && (
          <PineappleBoardView
            board={localBoard}
            committedCardIds={committedCardIds}
            isInteractive={!myState.handLocked}
            selectedCard={selectedCard}
            onSlotClick={(row) => handlePlaceCardOnRow(row)}
            onCardClick={handleCardClickOnBoard}
            onCardDrop={handleDropOnCard}
            onReturnToHand={handleReturnCardToHand}
            onDropCard={(row, cardId) => {
              const card =
                localHandCards.find((c) => c.id === cardId) ||
                localBoard.top.find((c) => c.id === cardId) ||
                localBoard.middle.find((c) => c.id === cardId) ||
                localBoard.bottom.find((c) => c.id === cardId);
              if (card) handlePlaceCardOnRow(row, card);
            }}
            language={language}
            playerName={myState.name}
            avatarIcon={myState.avatarIcon}
            inFantasyLand={myState.inFantasyLand}
            isLocked={myState.handLocked}
          />
        )}
      </div>

      {/* Hand Cards & Action Deck Controls (Only when not locked) */}
      {!myState?.handLocked ? (
        <div className="bg-gradient-to-r from-[#1c130a] via-[#24170c] to-[#1c130a] border border-[#ffd700]/70 rounded-xl p-1.5 sm:p-2 space-y-1 sm:space-y-1.5 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-[#2d1e12] pb-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] sm:text-xs font-cinzel font-bold text-amber-300">
                {myState?.inFantasyLand
                  ? (language === 'ro' ? '🃏 Fantezie: Plasează 13 cărți și aruncă 1 (Discard):' : '🃏 Fantasy Land: Place 13 cards and discard 1:')
                  : roomState.currentRoundInHand === 1
                  ? '🃏 Runda 1: Plasează cele 5 cărți pe rânduri (0 discard):'
                  : `🃏 Runda ${roomState.currentRoundInHand}: Plasează 2 cărți pe rânduri și aruncă 1 (Discard):`}
              </span>

              {/* Progress Chips for Fantasy Land */}
              {myState?.inFantasyLand && (
                <div className="flex items-center gap-1 text-[10px] font-cinzel">
                  <span
                    className={`px-1.5 py-0.2 rounded border font-bold ${
                      (localBoard.top.length + localBoard.middle.length + localBoard.bottom.length) === 13
                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                        : 'bg-amber-950/60 border-amber-500/50 text-amber-300'
                    }`}
                  >
                    Plasate:{' '}
                    {localBoard.top.length + localBoard.middle.length + localBoard.bottom.length}/13
                  </span>
                  <span
                    className={`px-1.5 py-0.2 rounded border font-bold ${
                      localDiscarded.length === 1
                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                        : 'bg-red-950/60 border-red-500/50 text-red-300'
                    }`}
                  >
                    Discard: {localDiscarded.length}/1
                  </span>
                </div>
              )}

              {/* Progress Chips for Rounds 2..5 */}
              {roomState.currentRoundInHand > 1 && !myState?.inFantasyLand && (
                <div className="flex items-center gap-1 text-[10px] font-cinzel">
                  <span
                    className={`px-1.5 py-0.2 rounded border font-bold ${
                      (localBoard.top.length + localBoard.middle.length + localBoard.bottom.length) - initialBoardCount === 2
                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                        : 'bg-amber-950/60 border-amber-500/50 text-amber-300'
                    }`}
                  >
                    Plasate:{' '}
                    {(localBoard.top.length + localBoard.middle.length + localBoard.bottom.length) - initialBoardCount}
                    /2
                  </span>
                  <span
                    className={`px-1.5 py-0.2 rounded border font-bold ${
                      localDiscarded.length - committedDiscardCount === 1
                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                        : 'bg-red-950/60 border-red-500/50 text-red-300'
                    }`}
                  >
                    Discard: {localDiscarded.length - committedDiscardCount}/1
                  </span>
                </div>
              )}
            </div>

            {/* Quick Actions: Sort 2-A & Reset Turn */}
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              {myState?.inFantasyLand && localHandCards.length > 0 && (
                <button
                  type="button"
                  onClick={() => setLocalHandCards(sortFantasyLandCards(localHandCards))}
                  className="px-2 py-0.5 text-[10px] sm:text-[11px] rounded-lg bg-amber-950/70 hover:bg-amber-900 border border-amber-500/50 text-amber-200 hover:text-white font-cinzel font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow"
                  title={language === 'ro' ? 'Ordonează cărțile din mână crescător de la 2 la As' : 'Sort hand cards ascending from 2 to Ace'}
                >
                  <span>📶</span>
                  <span>{language === 'ro' ? 'Ordonează (2➔A)' : 'Sort (2➔A)'}</span>
                </button>
              )}

              {/* Reset turn button */}
              <button
                type="button"
                onClick={handleResetTurn}
                className="px-2 py-0.5 text-[10px] sm:text-[11px] rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-700 text-gray-300 hover:text-white font-cinzel font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                title="Resetează plasările din această rundă"
              >
                <span>↺</span>
                <span>{language === 'ro' ? 'Resetează' : 'Reset'}</span>
              </button>
            </div>
          </div>

          {/* Context feedback message */}
          {selectedSource ? (
            <div className="text-[10px] sm:text-[11px] font-cinzel text-[#ffd700] font-bold bg-amber-950/40 border border-amber-500/40 px-2 py-0.5 rounded-lg flex items-center justify-between animate-pulse">
              <span className="truncate">
                {selectedSource.type === 'hand'
                  ? `Selectat din Mână: ${selectedSource.card.rank}${selectedSource.card.suit} ➔ Schimb (Swap) sau Slot Liber`
                  : `Selectat de pe Tablă (${selectedSource.fromRow.toUpperCase()}): ${selectedSource.card.rank}${selectedSource.card.suit} ➔ Schimb sau Discard`}
              </span>
              <button
                type="button"
                onClick={() => setSelectedSource(null)}
                className="text-amber-200 hover:text-white ml-2 text-[10px] font-bold cursor-pointer flex-shrink-0"
              >
                ✕ Deselectează
              </button>
            </div>
          ) : (
            <div className="text-[9px] sm:text-[10px] font-cinzel text-gray-400 truncate">
              💡 <em>Sfat: Schimbă cărți (Swap) prin tap consecutiv sau Drag & Drop direct peste altă carte!</em>
            </div>
          )}

          {/* Cards Tray */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
            }}
            onDrop={(e) => {
              e.preventDefault();
              const droppedId = e.dataTransfer.getData('text/plain');
              // If dropped from board uncommitted to hand, return it to hand
              const fromTop = localBoard.top.find(c => c.id === droppedId);
              if (fromTop && !committedCardIds.has(fromTop.id)) {
                handleReturnCardToHand(fromTop, 'top');
                return;
              }
              const fromMid = localBoard.middle.find(c => c.id === droppedId);
              if (fromMid && !committedCardIds.has(fromMid.id)) {
                handleReturnCardToHand(fromMid, 'middle');
                return;
              }
              const fromBot = localBoard.bottom.find(c => c.id === droppedId);
              if (fromBot && !committedCardIds.has(fromBot.id)) {
                handleReturnCardToHand(fromBot, 'bottom');
                return;
              }
            }}
            className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap min-h-[68px] sm:min-h-[76px] py-1 bg-[#0d0905]/60 rounded-lg sm:rounded-xl border border-[#2d1e12]/60 p-1.5"
          >
            {localHandCards.map((card) => (
              <PineappleCard
                key={card.id}
                card={card}
                isSelected={selectedSource?.type === 'hand' && selectedSource.card.id === card.id}
                onClick={() => {
                  if (selectedSource?.type === 'board') {
                    // Selected card on board -> click hand card -> swap!
                    handleSwapHandAndBoardCard(card, selectedSource.card, selectedSource.fromRow);
                  } else {
                    handleSelectCardFromHand(card);
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.dataTransfer.dropEffect = 'move';
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const droppedId = e.dataTransfer.getData('text/plain');
                  if (droppedId && droppedId !== card.id) {
                    const fromTop = localBoard.top.find(c => c.id === droppedId);
                    if (fromTop && !committedCardIds.has(fromTop.id)) {
                      handleSwapHandAndBoardCard(card, fromTop, 'top');
                      return;
                    }
                    const fromMid = localBoard.middle.find(c => c.id === droppedId);
                    if (fromMid && !committedCardIds.has(fromMid.id)) {
                      handleSwapHandAndBoardCard(card, fromMid, 'middle');
                      return;
                    }
                    const fromBot = localBoard.bottom.find(c => c.id === droppedId);
                    if (fromBot && !committedCardIds.has(fromBot.id)) {
                      handleSwapHandAndBoardCard(card, fromBot, 'bottom');
                      return;
                    }
                  }
                }}
                size="md"
              />
            ))}

            {localHandCards.length === 0 && (
              <div className="text-xs font-cinzel text-emerald-400 font-bold flex items-center gap-1">
                <span>✓</span>
                <span>Toate cărțile din mână au fost distribuite!</span>
              </div>
            )}
          </div>

          {/* Discard Zone & Lock Button Strip */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-1.5 sm:gap-2 pt-1 border-t border-[#2d1e12]">
            {/* Discard Target Box (for rounds 2..5 or Fantasy Land) */}
            {(roomState.currentRoundInHand > 1 || myState?.inFantasyLand) && (
              <div className="flex items-center gap-1.5">
                <div
                  onClick={() => selectedSource && handleDiscardCard()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const cardId = e.dataTransfer.getData('text/plain');
                    const card =
                      localHandCards.find((c) => c.id === cardId) ||
                      localBoard.top.find((c) => c.id === cardId) ||
                      localBoard.middle.find((c) => c.id === cardId) ||
                      localBoard.bottom.find((c) => c.id === cardId);
                    if (card) handleDiscardCard(card);
                  }}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border-2 border-dashed transition-all cursor-pointer flex-1 sm:flex-initial ${
                    selectedSource
                      ? 'border-red-500 bg-red-950/50 text-red-200 hover:bg-red-950/70 shadow-[0_0_12px_rgba(239,68,68,0.4)] animate-pulse'
                      : 'border-stone-800 bg-[#0d0905] text-gray-500'
                  }`}
                >
                  <span className="text-base">🔥</span>
                  <div className="text-left">
                    <div className="text-[10px] sm:text-[11px] font-cinzel font-bold">
                      {language === 'ro' ? 'Zona Discard (Aruncă 1)' : 'Discard Zone (Burn 1)'}
                    </div>
                    <div className="text-[9px] text-gray-400">
                      {localDiscarded.length - committedDiscardCount > 0
                        ? (language === 'ro' ? '1 carte aruncată' : '1 card discarded')
                        : isAutoDiscardReady()
                        ? (language === 'ro' ? '✨ Continuă (auto-discard)' : '✨ Continue (auto-discard)')
                        : selectedSource
                        ? (language === 'ro' ? 'Apasă pt. a arunca' : 'Click to discard')
                        : (language === 'ro' ? 'Selectează o carte' : 'Select a card')}
                    </div>
                  </div>
                </div>

                {/* Undo Discard button if discarded in this round */}
                {localDiscarded.length > committedDiscardCount && (
                  <button
                    type="button"
                    onClick={handleUndoDiscard}
                    className="px-2 py-1 rounded-lg bg-amber-950/80 hover:bg-amber-900 border border-amber-500/60 text-amber-200 text-[10px] font-cinzel font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow"
                    title="Anulează discard-ul din această rundă"
                  >
                    <span>⮌</span>
                    <span>{language === 'ro' ? 'Anulează' : 'Undo'}</span>
                  </button>
                )}
              </div>
            )}

            {/* Confirm & Lock Round Button */}
            <button
              type="button"
              onClick={handleConfirmLockRound}
              disabled={!isRoundComplete()}
              className={`px-4 py-1.5 sm:py-2 rounded-xl font-cinzel font-black text-xs sm:text-sm transition-all shadow-md cursor-pointer ${
                isRoundComplete()
                  ? 'bg-gradient-to-r from-[#d4a017] via-[#ffd700] to-[#b8860b] hover:from-[#e5b128] hover:via-[#ffe033] hover:to-[#c9971c] text-black shadow-[0_0_15px_rgba(255,215,0,0.5)] active:scale-95 animate-pulse'
                  : 'bg-stone-800 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isAutoDiscardReady()
                ? language === 'ro'
                  ? 'Continuă ➔ (Aruncă 1 automat)'
                  : 'Continue ➔ (Auto-discard 1)'
                : isRoundComplete()
                ? language === 'ro'
                  ? 'Confirmă Plasarea Rundei ➔'
                  : 'Confirm Round ➔'
                : myState?.inFantasyLand
                ? (language === 'ro' ? 'Plasează 13 cărți (1 discard)' : 'Place 13 cards (1 discard)')
                : roomState.currentRoundInHand === 1
                ? (language === 'ro' ? 'Plasează toate cele 5 cărți' : 'Place all 5 cards')
                : (language === 'ro' ? 'Plasează 2 cărți pe rânduri' : 'Place 2 cards on rows')}
            </button>
          </div>
        </div>
      ) : (
        /* Waiting Barrier Screen: Displayed when player has confirmed round and is waiting for opponent */
        <div className="bg-gradient-to-r from-[#18110a] via-[#24170d] to-[#18110a] border-2 border-[#ffd700]/70 rounded-2xl p-4 sm:p-5 text-center space-y-3 shadow-2xl animate-fade-in">
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl animate-pulse">⏳</span>
            <h3 className="text-sm sm:text-base font-cinzel font-black text-[#ffd700] gold-text-glow">
              {opponentState?.handLocked
                ? language === 'ro'
                  ? '✓ Ambii Jucători sunt Gata!'
                  : '✓ Both Players Ready!'
                : language === 'ro'
                ? `Așteptăm ca ${opponentState?.name || 'adversarul'} să își termine runda...`
                : `Waiting for ${opponentState?.name || 'opponent'} to place cards...`}
            </h3>
          </div>

          <p className="text-xs font-barlow text-gray-300 max-w-md mx-auto">
            {opponentState?.handLocked
              ? language === 'ro'
                ? 'Se sincronizează datele și se inițiază următoarea etapă a mâinii.'
                : 'Synchronizing data and initiating the next stage of the hand.'
              : language === 'ro'
              ? `Plasările tale pentru runda #${roomState.currentRoundInHand} sunt securizate pe tablă. Runda următoare va începe automat doar după ce ${opponentState?.name || 'adversarul'} confirmă.`
              : `Your card placements for round #${roomState.currentRoundInHand} are locked on the board. The next round will start only after ${opponentState?.name || 'opponent'} confirms.`}
          </p>

          <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto text-xs font-cinzel pt-1">
            <div className="bg-emerald-950/70 border border-emerald-500/60 p-2 rounded-xl flex items-center justify-center gap-1.5 text-emerald-300 font-bold">
              <span>✓</span>
              <span>{myState?.name} (Tu): Gata</span>
            </div>
            <div className={`p-2 rounded-xl flex items-center justify-center gap-1.5 font-bold transition-all ${
              opponentState?.handLocked
                ? 'bg-emerald-950/70 border border-emerald-500/60 text-emerald-300'
                : 'bg-amber-950/60 border border-amber-500/50 text-amber-300 animate-pulse'
            }`}>
              <span>{opponentState?.handLocked ? '✓' : '⏳'}</span>
              <span>{opponentState?.name}: {opponentState?.handLocked ? 'Gata' : 'Plasează...'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Hand Scoring Inspection Modal */}
      {roomState.status === 'hand_scoring' && roomState.lastHandResult && (
        <PineappleScoringModal
          isOpen={true}
          result={roomState.lastHandResult}
          playerA={roomState.players[0]}
          playerB={roomState.players[1]}
          settings={roomState.settings}
          isHost={isHost}
          language={language}
          onNextHand={handleNextHand}
          onEndGame={() => setShowEndConfirm(true)}
        />
      )}

      {/* End Match Confirmation Modal */}
      {showEndConfirm && (
        <div style={{ zIndex: 99998 }} className="fixed inset-0 z-[99998] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1c1208] border-2 border-[#ffd700] rounded-2xl p-5 max-w-sm w-full text-center space-y-3 shadow-2xl animate-fade-in">
            <div className="text-4xl animate-bounce">🏁</div>
            <h3 className="text-lg font-cinzel font-bold text-[#ffd700]">
              {language === 'ro' ? 'Închei meciul de Pineapple?' : 'End Pineapple Match?'}
            </h3>
            <p className="text-xs text-gray-300 font-barlow">
              {language === 'ro'
                ? 'Meciul se va opri acum și se vor salva scorul all-time, punctele și clasamentul final!'
                : 'The match will stop now and all-time scores, points, and final standings will be recorded!'}
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowEndConfirm(false)}
                className="py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-gray-300 text-xs font-cinzel font-bold cursor-pointer transition-colors"
              >
                {language === 'ro' ? 'Anulează' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleEndGame}
                className="py-2 px-3 rounded-xl bg-gradient-to-r from-red-700 to-red-800 hover:from-red-600 hover:to-red-700 text-white text-xs font-cinzel font-bold shadow-lg active:scale-95 cursor-pointer transition-all"
              >
                {language === 'ro' ? 'Încheie Meciul' : 'End Match'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tavern Quick Emotes & Sound FX Overlay */}
      <TavernEmotesOverlay
        lastEmote={roomState?.lastEmote}
        onSendEmote={(emote) => sendPineappleEmote(roomCode, emote)}
        localPlayer={localPlayer}
      />
    </div>
  );
};
