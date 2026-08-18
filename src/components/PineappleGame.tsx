import React, { useState, useEffect } from 'react';
import {
  PineappleBoard,
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
import {
  addPineappleBot,
  removePineappleBot,
  removePineapplePlayer,
  createEmptyBoard,
  lockPineapplePlayerHand,
  startNextPineappleHand,
  startPineappleMatch,
  subscribeToPineappleRoom,
  updatePineapplePlayerBoard,
} from '../lib/pineappleFirestoreService';
import { checkIsFoul } from '../lib/pineapplePokerEvaluator';

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
  const { language, t, addXpForPlayer } = useApp();
  const [roomState, setRoomState] = useState<PineappleRoomState | null>(null);
  const [selectedSource, setSelectedSource] = useState<
    | { type: 'hand'; card: PlayingCard }
    | { type: 'board'; card: PlayingCard; fromRow: 'top' | 'middle' | 'bottom' }
    | null
  >(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showFantasyLandIntro, setShowFantasyLandIntro] = useState(false);

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
    const unsubscribe = subscribeToPineappleRoom(roomCode, state => {
      setRoomState(state);
    });
    return () => unsubscribe();
  }, [roomCode]);

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
      const startingHand = myPlayerState.currentHandCards || [];
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
        setShowFantasyLandIntro(true);
        const timer = setTimeout(() => setShowFantasyLandIntro(false), 3500);
        return () => clearTimeout(timer);
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
      // Locked card from earlier round
      return;
    }

    if (selectedSource?.type === 'board' && selectedSource.card.id === card.id) {
      setSelectedSource(null);
    } else {
      setSelectedSource({ type: 'board', card, fromRow: row });
    }
  };

  const handleReturnCardToHand = (card: PlayingCard, fromRow: 'top' | 'middle' | 'bottom') => {
    const updatedRow = localBoard[fromRow].filter(c => c.id !== card.id);
    const updatedBoard: PineappleBoard = {
      ...localBoard,
      [fromRow]: updatedRow,
    };
    const updatedHand = [...localHandCards, card];

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
    const updatedHand = [...localHandCards, cardToReturn];

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

  // Check if placement requirements for current round are strictly met
  const isRoundComplete = (): boolean => {
    if (!roomState || !myState) return false;

    if (myState.inFantasyLand) {
      // Fantasy Land: All 13 cards must be placed across 3 rows
      const totalPlaced =
        localBoard.top.length + localBoard.middle.length + localBoard.bottom.length;
      return totalPlaced === 13 && localHandCards.length === 0;
    }

    if (roomState.currentRoundInHand === 1) {
      // Initial deal (5 cards): exactly 5 must be placed on board, 0 discarded
      const totalPlaced =
        localBoard.top.length + localBoard.middle.length + localBoard.bottom.length;
      return totalPlaced === 5 && localHandCards.length === 0 && localDiscarded.length === 0;
    }

    // Pineapple rounds 2, 3, 4, 5:
    // Round 2: 7 total placed (5 + 2), 1 discarded
    // Round 3: 9 total placed (7 + 2), 2 discarded
    // Round 4: 11 total placed (9 + 2), 3 discarded
    // Round 5: 13 total placed (11 + 2), 4 discarded
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
      await lockPineapplePlayerHand(
        roomCode,
        localPlayer.id,
        localBoard,
        localDiscarded
      );
    } catch (e) {
      console.error('Error locking hand round:', e);
    }
  };

  const handleStartMatch = async () => {
    if (!roomCode) return;
    try {
      await startPineappleMatch(roomCode);
    } catch (e: any) {
      alert(e.message || 'Eroare la pornirea meciului!');
    }
  };

  const handleAddBot = async () => {
    if (!roomCode) return;
    await addPineappleBot(roomCode);
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
          {language === 'ro' ? 'Se deschide chilia de Pineapple...' : 'Connecting to Pineapple Room...'}
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
              <span>{copiedLink ? 'Link Copiat!' : 'Copiază Link Invitație'}</span>
            </button>
          </div>

          {/* Settings Summary */}
          <div className="grid grid-cols-2 gap-2 text-center text-xs font-cinzel">
            <div className="bg-[#120c07] p-2.5 rounded-xl border border-stone-800">
              <span className="text-gray-400 block text-[10px] uppercase">Guri per Punct</span>
              <strong className="text-[#ffd700] text-sm sm:text-base">
                {roomState.settings.sipsPerPoint} guri
              </strong>
            </div>
            <div className="bg-[#120c07] p-2.5 rounded-xl border border-stone-800">
              <span className="text-gray-400 block text-[10px] uppercase">Prag Final Joc</span>
              <strong className="text-red-400 text-sm sm:text-base">
                {roomState.settings.sipsToEndGame} guri
              </strong>
            </div>
          </div>

          {/* Connected Players */}
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-[#2d2116] pb-1.5">
              <label className="text-xs font-cinzel font-bold text-[#ffd700] uppercase tracking-wider block flex items-center gap-1.5">
                <span>👥</span>
                <span>Călugări în Chilie ({roomState.players.length}/2)</span>
              </label>

              {isHost && roomState.players.length < 2 && (
                <button
                  type="button"
                  onClick={handleAddBot}
                  className="px-2.5 py-1 text-xs bg-[#2b1f14] hover:bg-[#3d2c1c] text-[#ffd700] border border-[#61452a] hover:border-[#ffd700]/70 rounded-lg font-cinzel font-bold transition-all active:scale-95 flex items-center gap-1 cursor-pointer shadow"
                >
                  <span>🤖</span>
                  <span>+ Adaugă Bot AI</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {roomState.players.map((p) => {
                const isMe = p.id === localPlayer.id;
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
                          {isMe && <span className="text-amber-400 text-[10px]">(Tu)</span>}
                        </div>
                        <div className="text-[10px] text-amber-400/80">
                          {p.isHost ? '👑 Gazdă' : p.isBot ? '🤖 AI Monk (Bot)' : '⚔️ Oaspete'}
                        </div>
                      </div>
                    </div>

                    {isHost && !isMe && (
                      <button
                        type="button"
                        onClick={() => handleRemovePlayer(p.id)}
                        className="px-2 py-1 rounded-lg bg-red-950/70 hover:bg-red-900 border border-red-500/40 text-red-300 text-xs font-bold transition-all cursor-pointer flex-shrink-0"
                        title={p.isBot ? 'Scoate botul' : 'Dă afară jucătorul'}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                );
              })}

              {roomState.players.length < 2 && (
                <div className="border-2 border-dashed border-[#2d1e12] p-3 rounded-xl flex flex-col items-center justify-center text-center text-gray-500 text-xs">
                  <span>Așteptăm al doilea jucător sau adaugă un bot...</span>
                </div>
              )}
            </div>
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
                  ? 'Începe Meciul de Pineapple ➔'
                  : 'Așteptăm al 2-lea călugăr...'}
              </button>
            ) : (
              <div className="text-center py-2 text-xs font-cinzel text-amber-300 animate-pulse">
                Așteptăm ca gazda să înceapă meciul...
              </div>
            )}

            <button
              type="button"
              onClick={onHome}
              className="w-full py-2 text-xs font-cinzel text-gray-400 hover:text-white transition-colors text-center cursor-pointer"
            >
              ← Înapoi la Meniul Principal
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

          {/* Stats Breakdown */}
          <div className="grid grid-cols-2 gap-3 text-xs font-cinzel pt-2">
            <div className="bg-emerald-950/40 p-3 rounded-2xl border border-emerald-500/50">
              <span className="text-emerald-400 font-bold block">CÂȘTIGĂTOR</span>
              <div className="text-base font-black text-white mt-1">{winner?.name}</div>
              <div className="text-[11px] text-gray-400 mt-0.5">
                {winner?.sipsAccumulated.toFixed(1)} guri totale
              </div>
            </div>

            <div className="bg-red-950/40 p-3 rounded-2xl border border-red-500/50">
              <span className="text-red-400 font-bold block">PIERZĂTOR</span>
              <div className="text-base font-black text-white mt-1">{loser?.name}</div>
              <div className="text-[11px] text-gray-400 mt-0.5">
                {loser?.sipsAccumulated.toFixed(1)} guri totale
              </div>
            </div>
          </div>

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
    <div className="max-w-5xl mx-auto p-2 sm:p-3 space-y-3 animate-fade-in select-none">
      {/* Fantasy Land Dramatic Screen Overlay */}
      {showFantasyLandIntro && (
        <div
          style={{ zIndex: 99999 }}
          className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-lg flex flex-col items-center justify-center p-4 text-center animate-fade-in pointer-events-none select-none"
        >
          <div className="text-6xl sm:text-7xl animate-bounce">✨👑✨</div>
          <h1 className="text-3xl sm:text-5xl font-cinzel font-black text-[#ffd700] gold-text-glow mt-3 animate-pulse">
            FANTASY LAND!
          </h1>
          <p className="text-sm sm:text-base font-cinzel text-amber-200 mt-2 max-w-md">
            {language === 'ro'
              ? 'Ai primit toate cele 13 cărți deodată! Aranjează-le liber într-o fază privată!'
              : 'You received all 13 cards at once! Arrange them freely in private!'}
          </p>
        </div>
      )}

      {/* Top Match Bar with Integrated Opponent Mini Widget */}
      <div className="bg-[#140e08]/90 border border-[#2d1e12] rounded-2xl p-2 sm:p-2.5 flex items-center justify-between gap-2 shadow-lg">
        {/* Left: Home & Round Info */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onHome}
            className="w-8 h-8 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-gray-300 hover:text-white text-xs font-cinzel font-bold flex items-center justify-center cursor-pointer flex-shrink-0 transition-colors"
            title={language === 'ro' ? 'Meniul principal' : 'Main menu'}
          >
            ✕
          </button>
          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-cinzel font-black text-[#ffd700] truncate">
              Pineapple 1v1 • Mâna #{roomState.currentHand}
            </div>
            <div className="text-[10px] sm:text-[11px] font-cinzel text-gray-400 truncate">
              {myState?.inFantasyLand
                ? '✨ Faza Fantasy Land (13 cărți)'
                : `Runda #${roomState.currentRoundInHand}/5 (${
                    roomState.currentRoundInHand === 1 ? '5 cărți' : '3 cărți (2 pui, 1 arunci)'
                  })`}
            </div>
          </div>
        </div>

        {/* Center: Live Sips Tracker */}
        <div className="hidden md:flex items-center bg-[#0a0704] px-3 py-1.5 rounded-xl border border-stone-800 text-xs font-cinzel">
          <div className="text-center">
            <div className="text-[9px] text-gray-400 uppercase tracking-wider">Guri Acumulate</div>
            <div className="font-black">
              <span className="text-emerald-400 font-bold">{myState?.sipsAccumulated.toFixed(1)} (Tu)</span>
              <span className="text-gray-600"> vs </span>
              <span className="text-red-400 font-bold">{opponentState?.sipsAccumulated.toFixed(1)} ({opponentState?.name})</span>
              <span className="text-gray-500 text-[10px]"> / {roomState.settings.sipsToEndGame}</span>
            </div>
          </div>
        </div>

        {/* Right: Interactive Opponent Mini Board & Smooth Expander Widget */}
        {opponentState && (
          <PineappleOpponentWidget
            opponent={opponentState}
            language={language}
            sipsThreshold={roomState.settings.sipsToEndGame}
          />
        )}
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
        <div className="bg-gradient-to-r from-[#1c130a] via-[#24170c] to-[#1c130a] border-2 border-[#ffd700] rounded-2xl p-3 space-y-2.5 shadow-xl gold-glow">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-[#2d1e12] pb-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-cinzel font-bold text-amber-300">
                {myState?.inFantasyLand
                  ? '🃏 Fantezie: Plasează toate cele 13 cărți:'
                  : roomState.currentRoundInHand === 1
                  ? '🃏 Runda 1: Plasează cele 5 cărți pe rânduri (0 discard):'
                  : `🃏 Runda ${roomState.currentRoundInHand}: Plasează 2 cărți pe rânduri și aruncă 1 (Discard):`}
              </span>

              {/* Progress Chips for Rounds 2..5 */}
              {roomState.currentRoundInHand > 1 && !myState?.inFantasyLand && (
                <div className="flex items-center gap-1.5 text-[11px] font-cinzel">
                  <span
                    className={`px-2 py-0.5 rounded-md border font-bold ${
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
                    className={`px-2 py-0.5 rounded-md border font-bold ${
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

            {/* Reset turn button */}
            <button
              type="button"
              onClick={handleResetTurn}
              className="self-end sm:self-auto px-2.5 py-1 text-[11px] rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-700 text-gray-300 hover:text-white font-cinzel font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
              title="Resetează plasările din această rundă"
            >
              <span>↺</span>
              <span>{language === 'ro' ? 'Resetează Runda' : 'Reset Round'}</span>
            </button>
          </div>

          {/* Context feedback message */}
          {selectedSource ? (
            <div className="text-[11px] font-cinzel text-[#ffd700] font-bold bg-amber-950/40 border border-amber-500/40 px-2.5 py-1 rounded-lg flex items-center justify-between animate-pulse">
              <span>
                {selectedSource.type === 'hand'
                  ? `Selectat din Mână: ${selectedSource.card.rank}${selectedSource.card.suit} ➔ Alege un rând sau apasă pe Discard`
                  : `Selectat de pe Tablă (${selectedSource.fromRow.toUpperCase()}): ${selectedSource.card.rank}${selectedSource.card.suit} ➔ Apasă pe alt rând pt. mutare, sau pe Discard`}
              </span>
              <button
                type="button"
                onClick={() => setSelectedSource(null)}
                className="text-amber-200 hover:text-white ml-2 text-xs font-bold"
              >
                ✕ Deselectează
              </button>
            </div>
          ) : (
            <div className="text-[10px] font-cinzel text-gray-400">
              💡 <em>Sfat: Poți muta orice carte plasată în această rundă făcând clic pe ea sau pe pictograma ⮌ de pe carte.</em>
            </div>
          )}

          {/* Cards Tray */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap min-h-[85px] py-1 bg-[#0d0905]/60 rounded-xl border border-[#2d1e12]/60 p-2">
            {localHandCards.map((card) => (
              <PineappleCard
                key={card.id}
                card={card}
                isSelected={selectedSource?.type === 'hand' && selectedSource.card.id === card.id}
                onClick={() => handleSelectCardFromHand(card)}
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
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1.5 border-t border-[#2d1e12]">
            {/* Discard Target Box (for rounds 2..5) */}
            {roomState.currentRoundInHand > 1 && !myState?.inFantasyLand && (
              <div className="flex items-center gap-2">
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
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-dashed transition-all cursor-pointer flex-1 sm:flex-initial ${
                    selectedSource
                      ? 'border-red-500 bg-red-950/50 text-red-200 hover:bg-red-950/70 shadow-[0_0_12px_rgba(239,68,68,0.4)] animate-pulse'
                      : 'border-stone-800 bg-[#0d0905] text-gray-500'
                  }`}
                >
                  <span className="text-lg">🔥</span>
                  <div className="text-left">
                    <div className="text-xs font-cinzel font-bold">
                      {language === 'ro' ? 'Zona Discard (Aruncă 1)' : 'Discard Zone (Burn 1)'}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {localDiscarded.length - committedDiscardCount > 0
                        ? `1 carte aruncată în această rundă`
                        : selectedSource
                        ? 'Apasă pt. a arunca cartea selectată'
                        : 'Selectează o carte și apasă aici'}
                    </div>
                  </div>
                </div>

                {/* Undo Discard button if discarded in this round */}
                {localDiscarded.length > committedDiscardCount && (
                  <button
                    type="button"
                    onClick={handleUndoDiscard}
                    className="px-2.5 py-2 rounded-xl bg-amber-950/80 hover:bg-amber-900 border border-amber-500/60 text-amber-200 text-xs font-cinzel font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow"
                    title="Anulează discard-ul din această rundă"
                  >
                    <span>⮌</span>
                    <span>Anulează</span>
                  </button>
                )}
              </div>
            )}

            {/* Confirm & Lock Round Button */}
            <button
              type="button"
              onClick={handleConfirmLockRound}
              disabled={!isRoundComplete()}
              className={`px-5 py-2.5 rounded-xl font-cinzel font-black text-xs sm:text-sm transition-all shadow-md cursor-pointer ${
                isRoundComplete()
                  ? 'bg-gradient-to-r from-[#d4a017] via-[#ffd700] to-[#b8860b] hover:from-[#e5b128] hover:via-[#ffe033] hover:to-[#c9971c] text-black shadow-[0_0_15px_rgba(255,215,0,0.5)] active:scale-95 animate-pulse'
                  : 'bg-stone-800 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isRoundComplete()
                ? 'Confirmă Plasarea Rundei ➔'
                : roomState.currentRoundInHand === 1
                ? 'Plasează toate cele 5 cărți pe rânduri'
                : `Plasează 2 cărți și aruncă 1`}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-[#120d07] border border-[#2d1e12] rounded-2xl p-4 text-center space-y-1">
          <div className="text-xs font-cinzel text-emerald-400 font-bold flex items-center justify-center gap-1.5">
            <span>✓</span>
            <span>{language === 'ro' ? 'Ai confirmat runda!' : 'Round locked!'}</span>
          </div>
          <p className="text-[11px] font-cinzel text-gray-400">
            {opponentState?.handLocked
              ? 'Ambii jucători sunt gata! Se calculează rezultatul...'
              : `Așteptăm ca ${opponentState?.name || 'adversarul'} să își termine runda...`}
          </p>
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
        />
      )}
    </div>
  );
};
