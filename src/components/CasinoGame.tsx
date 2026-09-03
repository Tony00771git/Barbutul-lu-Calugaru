import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CasinoBet, CasinoBetType, CasinoPlayer, CasinoRoomState } from '../types';
import { UseCasinoSocketReturn } from '../hooks/useCasinoSocket';
import { useApp } from '../context/AppContext';
import { AvatarDisplay } from './AvatarDisplay';
import { getAvatarById } from '../data/avatars';
import { getSyncedServerNow } from '../lib/duelFirestoreService';
import { triggerBettingTimeout, analyzePlayerCasinoBets } from '../lib/casinoFirestoreService';
import { CasinoDiceArena } from './CasinoDiceArena';
import { HeadToHeadTracker } from './HeadToHeadTracker';
import { recordHeadToHeadMatch } from '../lib/headToHeadService';
import { getUserCurrentShortId, setUserActiveRoom, startActiveRoomHeartbeat } from '../lib/friendsService';
import { auth } from '../lib/firebase';
import { NetworkConnectionBadge } from './NetworkConnectionBadge';
import { TavernEmotesOverlay } from './TavernEmotesOverlay';
import { saveActiveSession } from '../lib/sessionManager';

interface CasinoGameProps {
  casinoSocket: UseCasinoSocketReturn;
  localPlayer: { id: string; name: string; avatarIcon: string; color: string };
  onLeave: () => void;
}

const CHIP_VALUES = [10, 25, 50, 100];

export const CasinoGame: React.FC<CasinoGameProps> = ({
  casinoSocket,
  localPlayer,
  onLeave,
}) => {
  const { t, language, theme, diceSkin, checkAchievement, batchUpdateProfiles, awardMatchXp, trackQuestEvent } = useApp();
  const {
    room,
    playerId,
    isConnected,
    isConnecting,
    errorMessage,
    addBot,
    removePlayer,
    startGame,
    placeBets,
    lockBets,
    nextRound,
    clearError,
  } = casinoSocket;

  // Active room tracking for friends with heartbeat and auto-cleanup
  useEffect(() => {
    const user = auth.currentUser;
    if (!user || !room?.code) return;

    const shortId = getUserCurrentShortId(user.uid);
    if (room.status === 'finished') {
      setUserActiveRoom(user.uid, shortId, null);
      return;
    }

    const stopHeartbeat = startActiveRoomHeartbeat(user.uid, shortId, () => {
      if (!room || room.status === 'finished') return null;
      return {
        mode: 'casino',
        roomCode: room.code,
        status: room.status === 'in_game' ? 'in_game' : 'lobby',
        playerCount: room.players?.length || 1,
        maxPlayers: 6,
        hostName: room.players?.find((p) => p.isHost)?.name || localPlayer.name,
      };
    });

    return () => {
      stopHeartbeat();
    };
  }, [room?.code, room?.status, room?.players?.length]);

  // Save active session for auto-reconnection
  useEffect(() => {
    if (room?.code && localPlayer) {
      saveActiveSession('casino', room.code, localPlayer, room.hostPlayerId === localPlayer.id);
    }
  }, [room?.code, room?.hostPlayerId, localPlayer]);

  // Local betting draft state during betting phase
  const [draftBets, setDraftBets] = useState<CasinoBet[]>([]);
  const [selectedChip, setSelectedChip] = useState<number>(25);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number>(25);
  const [hasSavedFinalStats, setHasSavedFinalStats] = useState<boolean>(false);

  // Exclusive penalty modal dismissal per round for the victim
  const [dismissedPenaltyCard, setDismissedPenaltyCard] = useState<boolean>(false);

  const prevRoundRef = useRef<number>(1);
  const timeoutTriggeredRef = useRef<boolean>(false);

  const currentPlayer = useMemo(() => {
    if (!room || !playerId) return null;
    return room.players.find((p) => p.id === playerId) || null;
  }, [room, playerId]);

  const isHost = useMemo(() => {
    if (!room || !playerId) return false;
    return room.hostPlayerId === playerId;
  }, [room, playerId]);

  const isLocked = useMemo(() => {
    if (!room || !playerId) return false;
    return room.round.lockedPlayerIds?.includes(playerId) || false;
  }, [room, playerId]);

  // Total draft bets placed by local player
  const totalDraftBetAmount = useMemo(() => {
    return draftBets.reduce((acc, b) => acc + b.amount, 0);
  }, [draftBets]);

  // Real-time analysis of current draft bets for fraud / arbitrage
  const draftFraud = useMemo(() => {
    return analyzePlayerCasinoBets(draftBets);
  }, [draftBets]);

  // Current balance plus any already committed round bets
  const committedBetsForPlayer = useMemo(() => {
    if (!room || !playerId) return [];
    return room.round.bets?.filter((b) => b.playerId === playerId) || [];
  }, [room, playerId]);

  const availableBalance = useMemo(() => {
    if (!currentPlayer) return 0;
    const committedTotal = committedBetsForPlayer.reduce((acc, b) => acc + b.amount, 0);
    return Math.max(0, currentPlayer.balance + committedTotal - totalDraftBetAmount);
  }, [currentPlayer, committedBetsForPlayer, totalDraftBetAmount]);

  // Reset draft bets & penalty card state when a new round starts
  useEffect(() => {
    if (room && room.currentRound !== prevRoundRef.current) {
      prevRoundRef.current = room.currentRound;
      setDraftBets([]);
      setDismissedPenaltyCard(false);
      timeoutTriggeredRef.current = false;
    }
  }, [room?.currentRound]);

  // Synchronize draftBets with Firestore room bets if player already has bets recorded
  useEffect(() => {
    if (room?.round.phase === 'betting' && committedBetsForPlayer.length > 0 && draftBets.length === 0) {
      setDraftBets(committedBetsForPlayer);
    }
  }, [room?.round.phase, committedBetsForPlayer]);

  // Betting timer countdown calculation calibrated with server timestamp
  useEffect(() => {
    if (!room || room.status !== 'in_game' || room.round.phase !== 'betting') {
      return;
    }

    const interval = setInterval(() => {
      if (!room.round.bettingEndsAt) {
        setTimerSecondsLeft(25);
        return;
      }
      const now = getSyncedServerNow();
      const remainingMs = room.round.bettingEndsAt - now;
      const sec = Math.max(0, Math.ceil(remainingMs / 1000));
      setTimerSecondsLeft(sec);

      // Auto-trigger timeout from Host when timer expires
      if (sec === 0 && isHost && !timeoutTriggeredRef.current) {
        timeoutTriggeredRef.current = true;
        triggerBettingTimeout(room.code).catch(console.error);
      }
    }, 250);

    return () => clearInterval(interval);
  }, [room, isHost]);

  // Track achievements on round resolution
  const prevCasinoResolutionRoundRef = useRef<number>(0);
  useEffect(() => {
    if (!room || room.round.phase !== 'resolution' || !room.round.dice) return;
    if (prevCasinoResolutionRoundRef.current === room.currentRound) return;
    prevCasinoResolutionRoundRef.current = room.currentRound;

    const d1 = room.round.dice[0];
    const d2 = room.round.dice[1];
    const isSnakeEyes = d1 === 1 && d2 === 1;
    const isMidnight = d1 === 6 && d2 === 6;
    const isDoubles = d1 === d2;

    const myBets = room.round.bets?.filter(b => b.playerId === localPlayer.id) || [];
    const hasPassLineBet = myBets.some(b => b.type === 'pass_line');
    const myPayout = room.round.payouts?.find(p => p.playerId === localPlayer.id);
    const passLineWon = hasPassLineBet && Boolean(myPayout && myPayout.totalWon > 0);

    checkAchievement(localPlayer.name, {
      isCasinoPlayed: true,
      isCrapsSnakeEyes: isSnakeEyes,
      isCrapsMidnight: isMidnight,
      isDoubles: isDoubles,
      isCrapsPassLineWin: passLineWon,
      casinoChips: currentPlayer?.balance || 0,
    });
  }, [room?.round.phase, room?.round.dice, room?.currentRound, localPlayer.name, localPlayer.id, currentPlayer?.balance, checkAchievement]);

  // Save final stats to matching player profiles on game over
  useEffect(() => {
    if (room && room.status === 'finished' && !hasSavedFinalStats) {
      setHasSavedFinalStats(true);
      const realPlayers = room.players.filter((p) => !p.isBot);
      const roundsPlayed = room.currentRound || 1;
      const isAntiFarming = roundsPlayed < 2;
      const isCompletedMultiplayerMatch = realPlayers.length >= 2 && room.status === 'finished' && !isAntiFarming;

      // Leaderboard & profile stats: ONLY for completed matches with at least 2 real human players (NOT bot practice, NOT unfinished, >= 2 rounds)
      if (isCompletedMultiplayerMatch) {
        const updates = realPlayers.map((p) => ({
          name: p.name,
          sips: p.guriTotal || 0,
          chugs: p.groapaTotal || 0,
          avatarIcon: p.avatarIcon,
          winMode: (p.id === room.winnerId ? 'casino' : undefined) as 'casino' | undefined,
        }));

        if (updates.length > 0) {
          batchUpdateProfiles(updates);
        }

        // Award match XP for each real player
        realPlayers.forEach(p => {
          const isWinner = p.id === room.winnerId;
          awardMatchXp(p.name, 'casino', isWinner, roundsPlayed, [], {
            sips: p.guriTotal || 0,
            chugs: p.groapaTotal || 0,
            chips: p.balance,
          });

          if (p.id === playerId) {
            trackQuestEvent({ type: 'game_completed', mode: 'casino', isWinner });
            trackQuestEvent({ type: 'theme_played', theme });
            trackQuestEvent({ type: 'dice_skin_played', diceSkin });
            if (p.guriTotal && p.guriTotal > 0) {
              trackQuestEvent({ type: 'drink_sips', count: p.guriTotal });
            }
            if (p.groapaTotal && p.groapaTotal > 0) {
              trackQuestEvent({ type: 'drink_chug', count: p.groapaTotal });
            }
          }
        });

        // Record 1v1 head-to-head match only if 2 real players played
        if (room.players.length === 2 && !room.players[0].isBot && !room.players[1].isBot) {
          const p1 = room.players[0];
          const p2 = room.players[1];
          const winner = room.players.find((p) => p.id === room.winnerId);
          recordHeadToHeadMatch(
            p1.name,
            p2.name,
            winner ? winner.name : null,
            'casino',
            !winner
          );
        }
      }

      // Check achievement for winner
      if (room.winnerId && !isAntiFarming) {
        const winner = room.players.find((p) => p.id === room.winnerId);
        if (winner && !winner.isBot) {
          checkAchievement(winner.name, {
            isPodiumWinner: true,
            isCasinoWin: true,
            casinoChips: winner.balance,
          });
        }
      }
    }
  }, [room, hasSavedFinalStats, batchUpdateProfiles, checkAchievement, awardMatchXp]);

  // Add a bet to the draft
  const handleAddBet = (type: CasinoBetType, numberValue?: number) => {
    if (!currentPlayer || currentPlayer.eliminated || isLocked || room?.round.phase !== 'betting') {
      return;
    }

    const amountToAdd = Math.min(selectedChip, availableBalance);
    if (amountToAdd <= 0) return;

    setDraftBets((prev) => {
      const existingIdx = prev.findIndex(
        (b) => b.type === type && (type !== 'number' || b.numberValue === numberValue)
      );

      if (existingIdx !== -1) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          amount: updated[existingIdx].amount + amountToAdd,
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            playerId: localPlayer.id,
            type,
            numberValue,
            amount: amountToAdd,
          },
        ];
      }
    });
  };

  // Remove a bet from the draft
  const handleRemoveBet = (type: CasinoBetType, numberValue?: number) => {
    if (!currentPlayer || currentPlayer.eliminated || isLocked || room?.round.phase !== 'betting') {
      return;
    }

    setDraftBets((prev) => {
      return prev.filter(
        (b) => !(b.type === type && (type !== 'number' || b.numberValue === numberValue))
      );
    });
  };

  // Clear all draft bets
  const handleClearAllBets = () => {
    if (isLocked || room?.round.phase !== 'betting') return;
    setDraftBets([]);
  };

  // All-in on a specific bet
  const handleAllIn = (type: CasinoBetType, numberValue?: number) => {
    if (!currentPlayer || currentPlayer.eliminated || isLocked || room?.round.phase !== 'betting') {
      return;
    }
    const committedTotal = committedBetsForPlayer.reduce((acc, b) => acc + b.amount, 0);
    const maxFunds = currentPlayer.balance + committedTotal;
    if (maxFunds <= 0) return;

    setDraftBets([
      {
        playerId: localPlayer.id,
        type,
        numberValue,
        amount: maxFunds,
      },
    ]);
  };

  // Lock bets and commit to Firestore
  const handleLockBets = () => {
    if (!currentPlayer || currentPlayer.eliminated || isLocked || room?.round.phase !== 'betting') {
      return;
    }
    placeBets(draftBets, true);
  };

  // Copy room code
  const handleCopyCode = () => {
    if (!room) return;
    navigator.clipboard.writeText(room.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Copy share link
  const handleCopyLink = () => {
    if (!room) return;
    const url = `${window.location.origin}${window.location.pathname}?casino_room=${room.code}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Get current bet amount on a box in draft
  const getDraftAmountOnBox = (type: CasinoBetType, numberValue?: number): number => {
    const bet = draftBets.find(
      (b) => b.type === type && (type !== 'number' || b.numberValue === numberValue)
    );
    return bet?.amount || 0;
  };

  if (!room) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
        <div className="text-5xl mb-4 animate-bounce">🎰</div>
        <h2 className="text-xl font-cinzel font-bold text-[#e8c84a] mb-2">
          {isConnecting ? t('duelConnecting') : t('duelRoomNotFound')}
        </h2>
        {errorMessage && (
          <p className="text-red-400 text-sm max-w-md mb-4 bg-red-950/40 p-3 rounded-lg border border-red-800/50">
            {errorMessage}
          </p>
        )}
        <button
          onClick={onLeave}
          className="px-6 py-2.5 bg-[#2a2a2a] hover:bg-[#333] border border-[#444] rounded-lg text-sm font-semibold transition-all"
        >
          {t('cancel')}
        </button>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 1. LOBBY VIEW (2-6 Players)
  // -------------------------------------------------------------
  if (room.status === 'lobby') {
    return (
      <div className="w-full max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6 flex flex-col gap-4">
        {/* Header Lobby Card */}
        <div className="bg-[#18120c]/90 border border-[#4a341e] rounded-2xl p-4 sm:p-5 text-center shadow-2xl relative overflow-hidden backdrop-blur-md">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#e8c84a] to-transparent" />
          <span className="text-4xl mb-1 inline-block">🎰</span>
          <h1 className="text-2xl sm:text-3xl font-cinzel font-black text-[#e8c84a] gold-text-glow">
            {t('casinoMode')}
          </h1>
          <p className="text-xs text-[#c4b5a0] mt-1">{t('casinoSubtitle')}</p>

          {/* Room Code Badge */}
          <div className="mt-3 inline-flex flex-col sm:flex-row items-center gap-2 bg-[#0d0a07] border border-[#e8c84a]/40 px-4 py-2 rounded-xl shadow-inner">
            <span className="text-xs text-[#8c7860] uppercase tracking-wider font-cinzel">
              {t('duelRoomCode')}:
            </span>
            <span className="font-mono text-2xl font-black text-[#e8c84a] tracking-widest px-2">
              {room.code}
            </span>
            <div className="flex gap-1.5 mt-1 sm:mt-0">
              <button
                onClick={handleCopyCode}
                className="px-2.5 py-1 text-xs bg-[#241a12] hover:bg-[#382618] text-[#e8c84a] border border-[#523b24] rounded active:scale-95 transition-transform font-bold"
              >
                {language === 'ro' ? (copiedCode ? '✓ Copiat' : 'Copiază') : (copiedCode ? '✓ Copied' : 'Copy')}
              </button>
              <button
                onClick={handleCopyLink}
                className="px-2.5 py-1 text-xs bg-[#241a12] hover:bg-[#382618] text-[#e8c84a] border border-[#523b24] rounded active:scale-95 transition-transform font-bold"
              >
                {language === 'ro' ? (copiedLink ? '✓ Link Copiat' : 'Link') : (copiedLink ? '✓ Link Copied' : 'Link')}
              </button>
            </div>
          </div>

          <div className="mt-2 text-xs text-[#a39480]">
            {t('casinoStartingChips')}: <strong className="text-[#e8c84a]">{room.startingChips} {language === 'ro' ? 'fise' : 'chips'}</strong>
          </div>
        </div>

        {/* Players List Card */}
        <div className="bg-[#161310]/85 border border-[#332518] rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3 border-b border-[#2d2116] pb-2">
            <h2 className="text-sm sm:text-base font-cinzel font-bold text-[#e8c84a] flex items-center gap-2">
              <span>👥</span> {t('casinoPlayersInTavern')} ({room.players.length}/6)
            </h2>
            {isHost && room.players.length < 6 && (
              <button
                onClick={addBot}
                className="px-2.5 py-1 text-xs bg-[#2b1f14] hover:bg-[#3d2c1c] text-[#e8c84a] border border-[#61452a] rounded-md font-semibold transition-all active:scale-95 flex items-center gap-1"
              >
                <span>🤖</span> {t('casinoAddBotBtn')}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {room.players.map((p) => {
              const avatar = getAvatarById(p.avatarIcon);
              const isMe = p.id === localPlayer.id;
              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                    isMe
                      ? 'bg-[#2b1d10]/70 border-[#e8c84a]/60 shadow-md ring-1 ring-[#e8c84a]/30'
                      : 'bg-[#100d0a]/60 border-[#2b1e14]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative">
                      <AvatarDisplay avatarId={p.avatarIcon} className="w-10 h-10" />
                      {p.isHost && (
                        <span className="absolute -top-1.5 -right-1.5 text-xs bg-[#e8c84a] text-black rounded-full px-1 font-bold shadow">
                          👑
                        </span>
                      )}
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-1.5 truncate">
                        <span
                          className="font-bold text-sm truncate"
                          style={{ color: p.color || '#e8c84a' }}
                        >
                          {p.name}
                        </span>
                        {isMe && (
                          <span className="text-[10px] bg-[#e8c84a]/20 text-[#e8c84a] px-1 rounded font-bold">
                            TU
                          </span>
                        )}
                        {p.isBot && (
                          <span className="text-[10px] bg-purple-900/50 text-purple-300 px-1 rounded border border-purple-700/50">
                            BOT
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#a39480]">
                        {language === 'ro' ? 'Sold:' : 'Balance:'} <span className="text-[#e8c84a] font-semibold">{p.balance} 🪙</span>
                      </div>
                    </div>
                  </div>

                  {isHost && !isMe && (
                    <button
                      onClick={() => removePlayer(p.id)}
                      className="text-xs text-red-400 hover:text-red-300 p-1.5 hover:bg-red-950/40 rounded transition-colors"
                      title={t('casinoRemovePlayerBtn')}
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {room.players.length < 2 && (
            <p className="text-xs text-amber-300/80 text-center mt-3 bg-amber-950/30 p-2 rounded border border-amber-800/40">
              ⚠️ {t('casinoMinPlayersNotice')}
            </p>
          )}
        </div>

        {/* 1v1 Head-to-Head Rivalry Banner if 2 players in casino lobby */}
        {room.players.length === 2 && (
          <HeadToHeadTracker
            player1={room.players[0]}
            player2={room.players[1]}
            variant="banner"
            currentMode="casino"
          />
        )}

        {/* Action Controls */}
        <div className="flex flex-col gap-2">
          {isHost ? (
            <button
              onClick={startGame}
              disabled={room.players.length < 2}
              className={`w-full py-3.5 rounded-xl font-cinzel font-black text-base transition-all shadow-xl flex items-center justify-center gap-2 ${
                room.players.length >= 2
                  ? 'bg-gradient-to-r from-[#b38f20] via-[#e8c84a] to-[#f8e178] text-[#1c1208] hover:brightness-110 active:scale-[0.98] gold-glow'
                  : 'bg-[#2a241d] text-[#6b5f50] cursor-not-allowed border border-[#3d3328]'
              }`}
            >
              <span>🎰</span> {t('casinoStartMatchBtn')}
            </button>
          ) : (
            <div className="text-center p-3.5 bg-[#120e0a]/80 border border-[#332518] rounded-xl text-xs text-[#c4b5a0] animate-pulse">
              ⏳ {t('casinoWaitingHost')}
            </div>
          )}

          <button
            onClick={onLeave}
            className="w-full py-2 bg-[#1a140f] hover:bg-[#261d15] text-[#a39480] hover:text-[#e8c84a] border border-[#2e2116] rounded-xl text-xs font-semibold transition-all"
          >
            {t('cancel')} / {t('casinoLeaveGame')}
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2. PODIUM / GAME OVER VIEW
  // -------------------------------------------------------------
  if (room.status === 'finished') {
    const winner = room.winnerId ? room.players.find((p) => p.id === room.winnerId) : null;
    const sortedLeaderboard = [...room.players].sort((a, b) => {
      if (a.id === room.winnerId) return -1;
      if (b.id === room.winnerId) return 1;
      if (a.eliminated !== b.eliminated) return a.eliminated ? 1 : -1;
      return b.balance - a.balance;
    });

    return (
      <div className="w-full max-w-xl mx-auto px-3 sm:px-4 py-4 sm:py-6 flex flex-col gap-4">
        {/* Winner Banner */}
        <div className="bg-gradient-to-b from-[#2e1d08] via-[#1c1208] to-[#0d0905] border-2 border-[#e8c84a] rounded-2xl p-5 text-center shadow-[0_0_30px_rgba(232,200,74,0.3)] relative overflow-hidden">
          <div className="text-4xl mb-1 animate-bounce">👑</div>
          <h1 className="text-xl sm:text-2xl font-cinzel font-black text-[#e8c84a] gold-text-glow">
            {t('casinoWinnerCrown')}
          </h1>
          <p className="text-xs text-[#d1c4b0] mt-0.5">{t('casinoWinnerDesc')}</p>

          {winner && (
            <div className="mt-3 flex flex-col items-center gap-1.5">
              <AvatarDisplay avatarId={winner.avatarIcon} className="w-16 h-16" showBorder />
              <span className="text-lg font-bold font-cinzel text-[#f8e178]">
                {winner.name}
              </span>
              <div className="flex gap-4 text-xs text-[#a39480] bg-[#120a04] px-4 py-1.5 rounded-lg border border-[#4a341e]">
                <span>{language === 'ro' ? 'Sold Final:' : 'Final Balance:'} <strong className="text-[#e8c84a]">{winner.balance} 🪙</strong></span>
                <span>{language === 'ro' ? 'Guri:' : 'Sips:'} <strong>{winner.guriTotal}</strong></span>
                <span>{language === 'ro' ? 'Gropi:' : 'Chugs:'} <strong>{winner.groapaTotal}</strong></span>
              </div>
            </div>
          )}
        </div>

        {/* Final Standings Table */}
        <div className="bg-[#161310]/90 border border-[#332518] rounded-2xl p-4 shadow-lg">
          <h2 className="text-sm font-cinzel font-bold text-[#e8c84a] mb-2 pb-2 border-b border-[#2e2116]">
            📊 {t('casinoLeaderboardTitle')}
          </h2>

          <div className="flex flex-col gap-1.5">
            {sortedLeaderboard.map((p, idx) => {
              const isWinner = p.id === room.winnerId;
              const isMe = p.id === localPlayer.id;
              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border ${
                    isWinner
                      ? 'bg-[#2b1f10] border-[#e8c84a]/80 shadow-md'
                      : p.eliminated
                      ? 'bg-[#120a0a]/60 border-red-950/40 opacity-75'
                      : 'bg-[#120e0a]/60 border-[#2b1e14]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-cinzel font-bold text-xs text-[#8c7860] w-4 text-center">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`}
                    </span>
                    <AvatarDisplay avatarId={p.avatarIcon} className="w-8 h-8" />
                    <div>
                      <div className="font-bold text-xs text-[#f0ebe0] flex items-center gap-1.5">
                        <span style={{ color: p.color || '#e8c84a' }}>{p.name}</span>
                        {isMe && <span className="text-[9px] bg-[#e8c84a]/20 text-[#e8c84a] px-1 rounded">{language === 'ro' ? 'TU' : 'YOU'}</span>}
                      </div>
                      <div className="text-[10px] text-[#8c7860]">
                        {p.eliminated ? (
                          <span className="text-red-400">
                            💀 {t('casinoEliminatedRound')} {p.eliminatedAtRound || '?'}
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-semibold">
                            🪙 {p.balance} {language === 'ro' ? 'fise' : 'chips'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-[#a39480]">
                    <div>🍺 {p.guriTotal} {language === 'ro' ? 'guri' : 'sips'}</div>
                    <div>🔥 {p.groapaTotal} {language === 'ro' ? 'gropi' : 'chugs'}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Buttons */}
        <button
          onClick={onLeave}
          className="w-full py-3 bg-gradient-to-r from-[#b38f20] via-[#e8c84a] to-[#f8e178] text-[#1c1208] font-cinzel font-bold rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all"
        >
          {language === 'ro' ? '🏰 Înapoi la Meniu' : '🏰 Back to Menu'}
        </button>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 3. IN-GAME ACTIVE MATCH VIEW (Compact, No Scroll, Responsive Landscape)
  // -------------------------------------------------------------
  const round = room.round;
  const isRolling = round.phase === 'rolling';
  const isResolved = round.phase === 'resolved';
  const isBetting = round.phase === 'betting';
  const isEliminated = currentPlayer?.eliminated || false;

  // Determine if this client is the victim who must drink this round
  const isVictimLowest = round.lowestBalanceDrinkers?.includes(localPlayer.id) && !isEliminated;
  const isVictimEliminated = round.eliminatedThisRound?.includes(localPlayer.id);
  const isVictimFraud = round.fraudulentDrinkers?.includes(localPlayer.id);
  const isVictimNonBettor = round.nonBettorDrinkers?.includes(localPlayer.id) && !isEliminated;
  const isVictim = (isVictimLowest || isVictimEliminated || isVictimFraud || isVictimNonBettor) && isResolved;

  const myPayout = round.payouts?.[localPlayer.id];

  const penaltyText =
    round.penalty.type === 'groapa'
      ? t('casinoChugPenalty')
      : t('casinoSipsPenalty', { count: round.penalty.amount || 1 });

  // Calculate circular countdown progress percentage
  const timerRadius = 16;
  const timerCircumference = 2 * Math.PI * timerRadius;
  const timerOffset = timerCircumference - (timerSecondsLeft / 25) * timerCircumference;

  return (
    <div className="w-full max-w-5xl mx-auto px-2 sm:px-3 py-1 sm:py-2 flex flex-col gap-2 relative">
      {/* ------------------------------------------------------------- */}
      {/* EXCLUSIVE DRINKING PENALTY MODAL (VISIBLE ONLY TO VICTIM)     */}
      {/* ------------------------------------------------------------- */}
      {isVictim && !dismissedPenaltyCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-gradient-to-b from-[#2b140d] via-[#1a0c08] to-[#0d0604] border-3 border-red-500 rounded-3xl p-5 sm:p-7 max-w-md w-full text-center shadow-[0_0_50px_rgba(239,68,68,0.7)] flex flex-col items-center gap-3.5 relative overflow-hidden animate-shake">
            {/* Ambient Red Glow Halo */}
            <div className="absolute -top-16 -left-16 w-32 h-32 bg-red-600/30 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-amber-600/30 rounded-full blur-2xl pointer-events-none" />

            {/* Icon Banner */}
            <div className="text-5xl sm:text-6xl animate-bounce">
              {isVictimFraud ? '🚨' : isVictimNonBettor ? '⚠️' : round.penalty.type === 'groapa' || isVictimEliminated ? '🔥' : '🍺'}
            </div>

            {/* Victim Header */}
            <div>
              <span className="text-[11px] font-cinzel font-black uppercase tracking-widest text-red-400 bg-red-950/80 border border-red-700/60 px-3 py-1 rounded-full">
                {isVictimFraud
                  ? (language === 'ro' ? '🚨 TRIȘOR PRINS ÎN TAVERNĂ!' : '🚨 CHEATER CAUGHT IN TAVERN!')
                  : isVictimNonBettor
                  ? (language === 'ro' ? '⚠️ N-AI PARIAT ÎN ACEASTĂ RUNDĂ!' : '⚠️ DID NOT BET THIS ROUND!')
                  : isVictimEliminated
                  ? (language === 'ro' ? '💀 AI FOST ELIMINAT!' : '💀 YOU WERE ELIMINATED!')
                  : (language === 'ro' ? '🥴 AI CEL MAI MIC SOLD DIN TAVERNĂ!' : '🥴 LOWEST BALANCE IN TAVERN!')}
              </span>
              <h2 className="text-xl sm:text-2xl font-cinzel font-black text-[#ffd700] gold-text-glow mt-2">
                {isVictimFraud
                  ? (language === 'ro' ? 'PARIURILE TALE AU FOST ANULATE!' : 'YOUR BETS HAVE BEEN CANCELLED!')
                  : isVictimNonBettor
                  ? (language === 'ro' ? 'CINE NU PARIAZĂ, BEA CANONUL!' : 'WHO DOES NOT BET, DRINKS!')
                  : isVictimEliminated
                  ? (language === 'ro' ? 'FĂRĂ GALBENI RĂMAȘI!' : 'OUT OF COINS!')
                  : (language === 'ro' ? 'TREBUIE SĂ BEI PEDEAPSA RUNDEI!' : 'MUST DRINK ROUND PENALTY!')}
              </h2>
            </div>

            {/* Big Penalty Announcement Card */}
            <div className="w-full bg-[#120805] border-2 border-red-500/80 rounded-2xl p-4 shadow-inner flex flex-col items-center gap-1">
              <span className="text-xs text-gray-400 font-cinzel font-bold">
                {isVictimFraud
                  ? (language === 'ro' ? 'CANON DE BĂUTURĂ PENTRU FRAUDĂ' : 'FRAUD DRINKING PENALTY')
                  : isVictimNonBettor
                  ? (language === 'ro' ? 'PEDEAPSĂ PENTRU NEPARIERE' : 'PENALTY FOR IDLE ROUND')
                  : round.penalty.type === 'groapa' || isVictimEliminated
                  ? (language === 'ro' ? 'PEDEAPSĂ SUPREMĂ' : 'SUPREME PENALTY')
                  : (language === 'ro' ? 'CANTITATE DE BĂUT' : 'DRINKING AMOUNT')}
              </span>
              <span className="text-2xl sm:text-3xl font-cinzel font-black text-red-400 animate-pulse tracking-wide">
                {isVictimFraud
                  ? (language === 'ro' ? '🍺 +3 GURI DE CANON!' : '🍺 +3 PENALTY SIPS!')
                  : isVictimEliminated
                  ? (language === 'ro' ? '🔥 CHUG IT ALL (GROAPĂ)!' : '🔥 CHUG IT ALL (ABYSS)!')
                  : penaltyText}
              </span>
              <span className="text-[11px] text-gray-400 mt-1">
                {isVictimFraud && myPayout?.fraudReason ? (
                  <span className="text-amber-300">
                    {language === 'ro' ? 'Motiv:' : 'Reason:'} {myPayout.fraudReason}. {language === 'ro' ? 'Amendă:' : 'Fine:'} -{myPayout.fraudFine || 0}🪙
                  </span>
                ) : isVictimNonBettor ? (
                  <span className="text-amber-300">
                    {language === 'ro' ? 'Ai stat pe bară fără să pariezi fise. Starețul te pedepsește cu băutură!' : 'You stayed idle without betting chips. The Abbot punishes you with drinking!'}
                  </span>
                ) : (
                  language === 'ro'
                    ? `Soldul tău este ${currentPlayer?.balance} 🪙. Bea înainte de tura următoare!`
                    : `Your balance is ${currentPlayer?.balance} 🪙. Drink before the next round!`
                )}
              </span>
            </div>

            {/* Confirmation Action Button */}
            <button
              onClick={() => setDismissedPenaltyCard(true)}
              className="w-full py-3.5 bg-gradient-to-r from-red-600 via-amber-500 to-red-600 text-black font-cinzel font-black text-base rounded-2xl shadow-xl hover:brightness-110 active:scale-95 transition-all uppercase tracking-wide border border-amber-300"
            >
              {language === 'ro' ? '🍺 AM BĂUT! (CONFIRMĂ)' : '🍺 I DRANK! (CONFIRM)'}
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 1V1 RIVALRY TRACKER (IF EXACTLY 2 PLAYERS AT TABLE)           */}
      {/* ------------------------------------------------------------- */}
      {room.players.length === 2 && (
        <HeadToHeadTracker
          player1={room.players[0]}
          player2={room.players[1]}
          variant="compact"
          currentMode="casino"
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* TOP SLEEK HUD BAR (Round, Penalty, Room, and Live Timer)      */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-[#140f0a]/95 border border-[#3d2b1a] rounded-xl px-3 py-1.5 sm:py-2 shadow-lg backdrop-blur-md flex items-center justify-between gap-2">
        {/* Left: Round & Room Code */}
        <div className="flex items-center gap-2">
          <span className="text-lg">🎰</span>
          <div>
            <div className="text-xs text-[#8c7860] uppercase tracking-wider font-cinzel font-black">
              {t('roundOf')} {room.currentRound}
            </div>
            <div className="text-[10px] text-[#c4b5a0] font-mono">
              Cod: <strong className="text-[#e8c84a]">{room.code}</strong>
            </div>
          </div>
        </div>

        {/* Center: Penalty Badge */}
        <div className={`px-2.5 py-1 rounded-lg border font-cinzel font-bold text-xs flex items-center gap-1.5 shadow-sm ${
          round.penalty.type === 'groapa'
            ? 'bg-red-950/80 border-red-600 text-red-300 animate-pulse'
            : 'bg-[#2b1f14] border-[#e8c84a]/60 text-[#f8e178]'
        }`}>
          <span className="text-xs">{round.penalty.type === 'groapa' ? '🔥' : '🍺'}</span>
          <span className="truncate max-w-[130px] sm:max-w-none">{penaltyText}</span>
        </div>

        {/* Right: Circular High-Visibility Betting Timer & Connection Badge */}
        <div className="flex items-center gap-2">
          <NetworkConnectionBadge />
          {isBetting ? (
            <div className="flex items-center gap-2">
              {/* Circular SVG Timer */}
              <div className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r={timerRadius}
                    className="stroke-[#2a1c10] fill-none"
                    strokeWidth="3.5"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r={timerRadius}
                    className={`fill-none transition-all duration-300 ${
                      timerSecondsLeft <= 5
                        ? 'stroke-red-500 animate-pulse'
                        : timerSecondsLeft <= 10
                        ? 'stroke-amber-400'
                        : 'stroke-[#e8c84a]'
                    }`}
                    strokeWidth="3.5"
                    strokeDasharray={timerCircumference}
                    strokeDashoffset={timerOffset}
                    strokeLinecap="round"
                  />
                </svg>
                <span
                  className={`absolute font-mono font-black text-xs sm:text-sm ${
                    timerSecondsLeft <= 5 ? 'text-red-400 animate-bounce' : 'text-[#f8e178]'
                  }`}
                >
                  {timerSecondsLeft}
                </span>
              </div>
              <span className="text-[10px] text-[#8c7860] font-cinzel font-bold hidden md:inline uppercase">
                {language === 'ro' ? (timerSecondsLeft <= 5 ? 'Ultimele secunde!' : 'Timp Pariere') : (timerSecondsLeft <= 5 ? 'Final seconds!' : 'Betting Time')}
              </span>
            </div>
          ) : (
            <div className="text-[11px] font-cinzel font-bold text-[#a8c4a8] bg-[#0c160e] px-2.5 py-1 rounded-lg border border-[#2d4d2d]">
              {language === 'ro' ? (isRolling ? '🎲 Aruncare...' : '📜 Rezultate') : (isRolling ? '🎲 Rolling...' : '📜 Results')}
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MAIN GAME BOARD AREA (Responsive & Compact Fitting)          */}
      {/* ------------------------------------------------------------- */}
      {isBetting && (
        <div className="bg-[#10180f]/95 border-2 border-[#3d2b1a] rounded-2xl p-2.5 sm:p-3.5 shadow-2xl relative flex flex-col gap-2">
          {/* Subtle Felt Background Pattern Overlay */}
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#2d5c31_1px,transparent_1px)] [background-size:14px_14px] pointer-events-none" />

          {/* Top Felt Dice Tray Banner */}
          <div className="relative z-10 flex items-center justify-between bg-[#071209]/90 border border-[#2d5c31]/70 px-3 py-1 rounded-xl">
            <div className="flex items-center gap-1.5 text-xs font-cinzel font-black text-[#e8c84a] uppercase">
              <span>🎲</span> {language === 'ro' ? 'Masa de Barbut' : 'Craps Table'}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#a8c4a8] font-semibold hidden sm:inline">
                {language === 'ro'
                  ? (round.diceResult ? 'Ultima aruncare:' : 'Zaruri pregătite:')
                  : (round.diceResult ? 'Last roll:' : 'Dice ready:')}
              </span>
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gradient-to-br from-[#fff2a3] via-[#e8c84a] to-[#a67c15] border border-[#ffe98a] flex items-center justify-center font-cinzel font-black text-xs sm:text-sm text-[#2b1704] shadow">
                  {round.diceResult ? round.diceResult[0] : '⚅'}
                </div>
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gradient-to-br from-[#fff2a3] via-[#e8c84a] to-[#a67c15] border border-[#ffe98a] flex items-center justify-center font-cinzel font-black text-xs sm:text-sm text-[#2b1704] shadow">
                  {round.diceResult ? round.diceResult[1] : '⚅'}
                </div>
                {round.diceResult && (
                  <span className="font-mono text-xs font-black text-[#ffd700] ml-0.5">
                    = {round.diceResult[0] + round.diceResult[1]}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Real-time Fraudulent Bet Warning Alert */}
          {draftFraud.isFraudulent && (
            <div className="relative z-10 bg-gradient-to-r from-red-950/95 via-[#2b1008]/95 to-red-950/95 border-2 border-red-500 rounded-xl p-2 sm:p-2.5 shadow-lg flex items-start sm:items-center gap-2 text-xs text-red-200 animate-pulse">
              <span className="text-xl flex-shrink-0">🚨</span>
              <div className="flex-1 leading-snug">
                <div className="font-cinzel font-black text-red-300 text-xs sm:text-sm">
                  {t('casinoFraudDetectedTitle')}
                </div>
                <div className="text-[11px] text-amber-200 mt-0.5">
                  <strong>Motiv:</strong> {draftFraud.reason}. {t('casinoFraudAbbotWarning')}
                </div>
              </div>
            </div>
          )}

          {/* Section 1: Number Bets (1 to 6) in a clean single 6-column horizontal grid */}
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] sm:text-xs font-cinzel font-bold text-[#e8c84a] uppercase tracking-wider flex items-center gap-1">
                <span>🎲</span> Pariuri Număr (1 - 6)
              </span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                1:1 (+100% la 1 zar) | 3:1 (+300% la Dublă)
              </span>
            </div>

            <div className="grid grid-cols-6 gap-1 sm:gap-2">
              {[1, 2, 3, 4, 5, 6].map((num) => {
                const currentDraft = getDraftAmountOnBox('number', num);
                const isHoverable = !isEliminated && !isLocked && availableBalance > 0;
                return (
                  <button
                    key={num}
                    type="button"
                    disabled={isEliminated || isLocked}
                    onClick={() => handleAddBet('number', num)}
                    className={`relative flex flex-col items-center justify-between py-1.5 px-1 rounded-xl border-2 transition-all active:scale-95 h-14 sm:h-16 select-none ${
                      currentDraft > 0
                        ? 'bg-[#2b1f0c] border-[#e8c84a] shadow-[0_0_10px_rgba(232,200,74,0.4)] ring-1 ring-[#e8c84a]'
                        : isHoverable
                        ? 'bg-[#182618]/90 border-[#2d4d2d] hover:border-[#e8c84a]/70 hover:bg-[#203620]'
                        : 'bg-[#141d14]/60 border-[#223322] cursor-not-allowed opacity-80'
                    }`}
                  >
                    <span className="text-[9px] sm:text-[10px] text-[#8ca38c] font-cinzel font-semibold uppercase leading-none">
                      ZAR
                    </span>
                    <span className="text-lg sm:text-xl font-black font-cinzel text-[#f8e178] leading-none">
                      {num}
                    </span>
                    {currentDraft > 0 ? (
                      <span className="text-[9px] sm:text-[10px] font-black text-black bg-[#e8c84a] px-1.5 py-0.2 rounded-full shadow">
                        {currentDraft}🪙
                      </span>
                    ) : (
                      <span className="text-[9px] text-[#557355] font-semibold leading-none">1:1 / 3:1</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Prop Bets (Peste 7, Sub 7, Par, Impar) in a single 4-column row */}
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] sm:text-xs font-cinzel font-bold text-[#e8c84a] uppercase tracking-wider flex items-center gap-1">
                <span>⚖️</span> Pariuri Generale
              </span>
              <span className="text-[10px] text-amber-300/80 italic hidden sm:inline">
                ⚠️ Suma 7 pierde pe Peste/Sub 7!
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1 sm:gap-2">
              {/* Peste 7 */}
              {(() => {
                const draft = getDraftAmountOnBox('over7');
                return (
                  <button
                    type="button"
                    disabled={isEliminated || isLocked}
                    onClick={() => handleAddBet('over7')}
                    className={`flex flex-col items-center justify-between py-1.5 px-1 rounded-xl border-2 transition-all active:scale-95 h-13 sm:h-15 select-none ${
                      draft > 0
                        ? 'bg-[#2b1f0c] border-[#e8c84a] shadow-[0_0_10px_rgba(232,200,74,0.4)] ring-1 ring-[#e8c84a]'
                        : 'bg-[#182618]/90 border-[#2d4d2d] hover:border-[#e8c84a]/70 hover:bg-[#203620]'
                    }`}
                  >
                    <span className="text-[10px] sm:text-xs font-cinzel font-bold text-[#f8e178] leading-none">
                      Peste 7 (&gt;7)
                    </span>
                    <span className="text-[9px] text-emerald-400 font-semibold leading-none">1:1</span>
                    {draft > 0 ? (
                      <span className="text-[9px] sm:text-[10px] font-black text-black bg-[#e8c84a] px-1.5 py-0.2 rounded-full shadow">
                        {draft}🪙
                      </span>
                    ) : (
                      <span className="text-[9px] text-[#8ca38c] leading-none">+100%</span>
                    )}
                  </button>
                );
              })()}

              {/* Sub 7 */}
              {(() => {
                const draft = getDraftAmountOnBox('under7');
                return (
                  <button
                    type="button"
                    disabled={isEliminated || isLocked}
                    onClick={() => handleAddBet('under7')}
                    className={`flex flex-col items-center justify-between py-1.5 px-1 rounded-xl border-2 transition-all active:scale-95 h-13 sm:h-15 select-none ${
                      draft > 0
                        ? 'bg-[#2b1f0c] border-[#e8c84a] shadow-[0_0_10px_rgba(232,200,74,0.4)] ring-1 ring-[#e8c84a]'
                        : 'bg-[#182618]/90 border-[#2d4d2d] hover:border-[#e8c84a]/70 hover:bg-[#203620]'
                    }`}
                  >
                    <span className="text-[10px] sm:text-xs font-cinzel font-bold text-[#f8e178] leading-none">
                      Sub 7 (&lt;7)
                    </span>
                    <span className="text-[9px] text-emerald-400 font-semibold leading-none">1:1</span>
                    {draft > 0 ? (
                      <span className="text-[9px] sm:text-[10px] font-black text-black bg-[#e8c84a] px-1.5 py-0.2 rounded-full shadow">
                        {draft}🪙
                      </span>
                    ) : (
                      <span className="text-[9px] text-[#8ca38c] leading-none">+100%</span>
                    )}
                  </button>
                );
              })()}

              {/* Par */}
              {(() => {
                const draft = getDraftAmountOnBox('even');
                return (
                  <button
                    type="button"
                    disabled={isEliminated || isLocked}
                    onClick={() => handleAddBet('even')}
                    className={`flex flex-col items-center justify-between py-1.5 px-1 rounded-xl border-2 transition-all active:scale-95 h-13 sm:h-15 select-none ${
                      draft > 0
                        ? 'bg-[#2b1f0c] border-[#e8c84a] shadow-[0_0_10px_rgba(232,200,74,0.4)] ring-1 ring-[#e8c84a]'
                        : 'bg-[#182618]/90 border-[#2d4d2d] hover:border-[#e8c84a]/70 hover:bg-[#203620]'
                    }`}
                  >
                    <span className="text-[10px] sm:text-xs font-cinzel font-bold text-[#f8e178] leading-none">
                      Par (2,4..12)
                    </span>
                    <span className="text-[9px] text-emerald-400 font-semibold leading-none">1:1</span>
                    {draft > 0 ? (
                      <span className="text-[9px] sm:text-[10px] font-black text-black bg-[#e8c84a] px-1.5 py-0.2 rounded-full shadow">
                        {draft}🪙
                      </span>
                    ) : (
                      <span className="text-[9px] text-[#8ca38c] leading-none">+100%</span>
                    )}
                  </button>
                );
              })()}

              {/* Impar */}
              {(() => {
                const draft = getDraftAmountOnBox('odd');
                return (
                  <button
                    type="button"
                    disabled={isEliminated || isLocked}
                    onClick={() => handleAddBet('odd')}
                    className={`flex flex-col items-center justify-between py-1.5 px-1 rounded-xl border-2 transition-all active:scale-95 h-13 sm:h-15 select-none ${
                      draft > 0
                        ? 'bg-[#2b1f0c] border-[#e8c84a] shadow-[0_0_10px_rgba(232,200,74,0.4)] ring-1 ring-[#e8c84a]'
                        : 'bg-[#182618]/90 border-[#2d4d2d] hover:border-[#e8c84a]/70 hover:bg-[#203620]'
                    }`}
                  >
                    <span className="text-[10px] sm:text-xs font-cinzel font-bold text-[#f8e178] leading-none">
                      Impar (3,5..11)
                    </span>
                    <span className="text-[9px] text-emerald-400 font-semibold leading-none">1:1</span>
                    {draft > 0 ? (
                      <span className="text-[9px] sm:text-[10px] font-black text-black bg-[#e8c84a] px-1.5 py-0.2 rounded-full shadow">
                        {draft}🪙
                      </span>
                    ) : (
                      <span className="text-[9px] text-[#8ca38c] leading-none">+100%</span>
                    )}
                  </button>
                );
              })()}
            </div>
          </div>

          {/* Section 3: High-Density Control Bar (Wallet + Chips + Lock Action on one single row) */}
          <div className="relative z-10 pt-1 border-t border-[#2a382a] flex flex-wrap items-center justify-between gap-2">
            {/* Wallet Info */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-300">
                Sold: <strong className="text-[#f8e178] font-mono font-bold">{currentPlayer?.balance}🪙</strong>
              </span>
              {!isEliminated && !isLocked && (
                <span className="text-emerald-400">
                  Liber: <strong className="font-mono font-bold">{availableBalance}🪙</strong>
                </span>
              )}
            </div>

            {/* Chips Selector (10, 25, 50, 100, Clear) */}
            {!isEliminated && !isLocked && (
              <div className="flex items-center gap-1">
                {CHIP_VALUES.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setSelectedChip(val)}
                    className={`px-2 py-0.5 text-xs font-bold rounded-lg transition-all ${
                      selectedChip === val
                        ? 'bg-gradient-to-b from-[#f8e178] to-[#b38f20] text-black shadow font-black scale-105'
                        : 'bg-[#1e150d] text-[#c4b5a0] hover:bg-[#2b1f14] border border-[#3d2b1a]'
                    }`}
                  >
                    {val}
                  </button>
                ))}

                {draftBets.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllBets}
                    className="px-2 py-0.5 text-xs bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800/60 rounded-lg font-bold"
                  >
                    ✕ Șterge
                  </button>
                )}
              </div>
            )}

            {/* Lock Bets Button */}
            {!isEliminated && (
              <div>
                {isLocked ? (
                  <div className="px-3 py-1 bg-emerald-950/90 border border-emerald-600 rounded-xl text-emerald-300 font-bold text-xs flex items-center gap-1.5 shadow">
                    <span>🔒</span> {t('casinoBetsLockedStatus')}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleLockBets}
                    className={`px-4 py-1.5 text-xs sm:text-sm font-cinzel font-black rounded-xl shadow-lg active:scale-95 transition-all flex items-center gap-1.5 ${
                      draftFraud.isFraudulent
                        ? 'bg-gradient-to-r from-red-600 via-amber-500 to-red-600 text-black border border-amber-300 animate-pulse'
                        : 'bg-gradient-to-r from-[#b38f20] via-[#e8c84a] to-[#f8e178] text-[#1c1208] gold-glow'
                    }`}
                  >
                    <span>🔒</span> {t('casinoLockBetsBtn')} ({totalDraftBetAmount}🪙)
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3B & 3C. REALISTIC 3D PHYSICS DICE THROW & ROUND RESOLUTION    */}
      {/* ------------------------------------------------------------- */}
      {(isRolling || isResolved) && (
        <div className="flex flex-col gap-2">
          {/* Realistic 3D Top-Down Physics Throw Arena */}
          <CasinoDiceArena
            diceResult={round.diceResult}
            isRolling={isRolling}
            phase={round.phase}
            skin="gold"
          />

          {/* Resolution Details & Next Round Controller */}
          {isResolved && (
            <div className="bg-[#16120c]/95 border-2 border-[#523b24] rounded-2xl p-3 sm:p-4 shadow-xl flex flex-col gap-2.5 animate-fade-in">
              <div className="flex items-center justify-between border-b border-[#332518] pb-1.5">
                <h2 className="text-sm sm:text-base font-cinzel font-black text-[#e8c84a] flex items-center gap-1.5">
                  <span>📜</span> {t('casinoRoundResultsTitle')}
                </h2>

                {/* Lowest Balance Safe status indicator for non-victims */}
                {!isVictim && round.lowestBalanceDrinkers && round.lowestBalanceDrinkers.length > 0 && (
                  <span className="text-[11px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                    🛡️ Ești în siguranță!
                  </span>
                )}
              </div>

              {/* Informative summary of who drinks for everyone */}
              {round.lowestBalanceDrinkers && round.lowestBalanceDrinkers.length > 0 && (
                <div className="text-xs text-amber-200/90 bg-amber-950/40 border border-amber-800/40 p-2 rounded-xl flex items-center justify-between">
                  <span>
                    🥴 Cel mai mic sold:{' '}
                    <strong className="text-[#ffd700]">
                      {round.lowestBalanceDrinkers
                        .map((id) => room.players.find((p) => p.id === id)?.name)
                        .filter(Boolean)
                        .join(', ')}
                    </strong>
                  </span>
                  <span className="text-xs font-cinzel font-bold text-amber-300">
                    Bea: {penaltyText}
                  </span>
                </div>
              )}

              {/* Fraudulent Bet tavern announcement */}
              {round.fraudulentDrinkers && round.fraudulentDrinkers.length > 0 && (
                <div className="text-xs bg-red-950/80 border border-red-500/80 p-2.5 rounded-xl flex flex-col gap-1 text-red-200 shadow-md animate-pulse">
                  <div className="font-cinzel font-black text-red-300 flex items-center gap-1.5 text-xs sm:text-sm">
                    <span>🚨</span> {t('casinoFraudCaughtTitle')}
                  </div>
                  <div className="text-[11px] text-amber-200 space-y-1">
                    {round.fraudulentDrinkers.map((id) => {
                      const p = room.players.find((pl) => pl.id === id);
                      const pInfo = round.payouts?.[id];
                      return (
                        <div key={id} className="flex items-center justify-between bg-black/40 px-2 py-1 rounded border border-red-900/50">
                          <span>
                            <strong className="text-[#ffd700]">{p?.name || id}</strong>: {pInfo?.fraudReason || 'Pariuri contradictorii / acoperire'}
                          </span>
                          <span className="text-red-400 font-mono font-bold text-right ml-2 flex-shrink-0">
                            -{pInfo?.fraudFine || 0}🪙 &amp; 🍺 +3 guri canon
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Non-Bettor tavern announcement */}
              {round.nonBettorDrinkers && round.nonBettorDrinkers.length > 0 && (
                <div className="text-xs bg-orange-950/70 border border-orange-500/70 p-2.5 rounded-xl flex flex-col gap-1 text-orange-200 shadow-md">
                  <div className="font-cinzel font-black text-orange-300 flex items-center gap-1.5 text-xs sm:text-sm">
                    <span>⚠️</span> {t('casinoNonBettorCaughtTitle')}
                  </div>
                  <div className="text-[11px] text-amber-200 space-y-1">
                    {round.nonBettorDrinkers.map((id) => {
                      const p = room.players.find((pl) => pl.id === id);
                      return (
                        <div key={id} className="flex items-center justify-between bg-black/40 px-2 py-1 rounded border border-orange-900/50">
                          <span>
                            <strong className="text-[#ffd700]">{p?.name || id}</strong> {t('casinoNonBettorCaughtDesc')}
                          </span>
                          <span className="text-orange-400 font-mono font-bold text-right ml-2 flex-shrink-0">
                            {penaltyText}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Payouts list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-44 overflow-y-auto">
                {room.players.map((p) => {
                  const pInfo = round.payouts?.[p.id];
                  const isMe = p.id === localPlayer.id;
                  const isElim = p.eliminated;
                  const isFraud = pInfo?.isFraudulent;
                  const isNonBettor = pInfo?.isNonBettor || round.nonBettorDrinkers?.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      className={`p-2 rounded-xl border flex items-center justify-between text-xs ${
                        isFraud
                          ? 'bg-red-950/40 border-red-600/70 ring-1 ring-red-500/30'
                          : isNonBettor && !isElim
                          ? 'bg-orange-950/40 border-orange-600/60 ring-1 ring-orange-500/30'
                          : isMe
                          ? 'bg-[#2b1f10]/80 border-[#e8c84a]/70 ring-1 ring-[#e8c84a]/30'
                          : isElim
                          ? 'bg-[#100b0b]/60 border-red-950/40 opacity-75'
                          : 'bg-[#100d0a]/60 border-[#2b1e14]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <AvatarDisplay avatarId={p.avatarIcon} className="w-5 h-5" />
                        <span className="font-bold truncate text-[11px]" style={{ color: p.color || '#e8c84a' }}>
                          {p.name}
                        </span>
                        {isMe && <span className="text-[8px] bg-[#e8c84a]/20 text-[#e8c84a] px-1 rounded font-bold">TU</span>}
                        {isFraud && <span className="text-[8px] bg-red-900 text-red-200 px-1 rounded font-bold">TRIȘOR</span>}
                        {isNonBettor && !isElim && <span className="text-[8px] bg-orange-900 text-orange-200 px-1 rounded font-bold">{t('casinoNonBettorBadge')}</span>}
                        {isElim && <span className="text-[8px] bg-red-900 text-red-200 px-1 rounded">ELIMINAT</span>}
                      </div>

                      <div className="text-right">
                        {isFraud ? (
                          <span className="font-bold text-red-400">
                            -{pInfo?.fraudFine || 0}🪙 (confiscat)
                          </span>
                        ) : isNonBettor && !isElim ? (
                          <span className="font-bold text-orange-400">
                            0🪙 (canon băutură)
                          </span>
                        ) : pInfo && pInfo.netProfit !== 0 ? (
                          <span
                            className={`font-bold ${
                              pInfo.netProfit > 0 ? 'text-emerald-400' : 'text-red-400'
                            }`}
                          >
                            {pInfo.netProfit > 0 ? `+${pInfo.netProfit}` : pInfo.netProfit}🪙
                          </span>
                        ) : (
                          <span className="text-[#8c7860]">0🪙</span>
                        )}
                        <span className="ml-1 text-[#f8e178] font-bold">
                          ({p.balance}🪙)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Next Round Button */}
              {isHost ? (
                <button
                  onClick={nextRound}
                  className="w-full py-2.5 bg-gradient-to-r from-[#b38f20] via-[#e8c84a] to-[#f8e178] text-[#1c1208] font-cinzel font-black rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all text-xs sm:text-sm flex items-center justify-center gap-2 gold-glow"
                >
                  <span>🎲</span> {t('casinoNextRoundBtn')}
                </button>
              ) : (
                <div className="text-center p-2 bg-[#100c08] border border-[#2e2116] rounded-xl text-xs text-[#a39480] animate-pulse">
                  ⏳ Așteptăm gazda să înceapă runda următoare...
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. COMPACT MONKS TRAY (Bottom Bar with Live Patrons Status)   */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-[#120e0a]/80 border border-[#2b1e14] rounded-xl px-2.5 py-1.5 shadow-inner">
        <div className="flex items-center justify-between text-[10px] font-cinzel font-bold text-[#8c7860] uppercase mb-1">
          <span>👥 Călugări la Masă ({room.players.filter((p) => !p.eliminated).length} activi)</span>
          <span>{isBetting && `${room.round.lockedPlayerIds.length}/${room.players.filter((p) => !p.eliminated).length} blocați`}</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {room.players.map((p) => {
            const isMe = p.id === localPlayer.id;
            const pLocked = room.round.lockedPlayerIds?.includes(p.id);
            return (
              <div
                key={p.id}
                className={`flex-shrink-0 px-2 py-1 rounded-lg border flex items-center gap-1.5 text-xs ${
                  p.eliminated
                    ? 'bg-red-950/20 border-red-900/30 opacity-60'
                    : isMe
                    ? 'bg-[#2b1f10]/80 border-[#e8c84a]/60 ring-1 ring-[#e8c84a]/40'
                    : 'bg-[#18120c]/60 border-[#2e2116]'
                }`}
              >
                <AvatarDisplay avatarId={p.avatarIcon} className="w-5 h-5" />
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-[10px] truncate max-w-[70px]" style={{ color: p.color || '#e8c84a' }}>
                      {p.name}
                    </span>
                    {p.eliminated ? (
                      <span className="text-[9px]">💀</span>
                    ) : pLocked ? (
                      <span className="text-[9px] text-emerald-400">🔒</span>
                    ) : (
                      <span className="text-[9px] text-amber-400 animate-pulse">⏳</span>
                    )}
                  </div>
                  <span className="text-[9px] text-[#f8e178] font-mono font-bold leading-none">
                    {p.balance}🪙
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tavern Quick Emotes & Sound FX Overlay */}
      <TavernEmotesOverlay
        lastEmote={room?.lastEmote}
        onSendEmote={(emote) => casinoSocket.sendEmote(emote)}
        localPlayer={localPlayer}
      />
    </div>
  );
};
