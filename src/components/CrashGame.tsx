import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CrashBotStyle,
  CrashHistoryItem,
  CrashPlayerState,
  CrashRoomState,
  Language,
} from '../types';
import { useApp } from '../context/AppContext';
import {
  addCrashBot,
  removeCrashPlayer,
  calculateMultiplier,
  crashDragon,
  leaveCrashRoom,
  playerCashOut,
  resetChickenStreak,
  resolveCrashRound,
  startCrashMatch,
  startFlyingPhase,
  startNextCrashRound,
  subscribeToCrashRoom,
  updateCrashPlayerSettings,
  sendCrashEmote,
} from '../lib/crashFirestoreService';
import { getSyncedServerNow } from '../lib/duelFirestoreService';
import { soundEffects } from '../lib/soundFx';
import { AvatarDisplay } from './AvatarDisplay';
import { CrashCanvas } from './CrashCanvas';
import { CrashSessionTracker, CrashSessionRoundRecord } from './CrashSessionTracker';
import { useAuth } from '../context/AuthContext';
import { getUserCurrentShortId, setUserActiveRoom } from '../lib/friendsService';
import { NetworkConnectionBadge } from './NetworkConnectionBadge';
import { TavernEmotesOverlay } from './TavernEmotesOverlay';
import { saveActiveSession, clearActiveSession } from '../lib/sessionManager';
import { reconnectionService } from '../lib/reconnectionService';

interface CrashGameProps {
  roomCode: string;
  localPlayer: { id: string; name: string; avatarIcon: string; color: string };
  isHost: boolean;
  onExit: () => void;
}

export const CrashGame: React.FC<CrashGameProps> = ({
  roomCode,
  localPlayer,
  isHost,
  onExit,
}) => {
  const { t, language, theme, diceSkin, recordGameStats, unlockAchievement, awardMatchXp, trackQuestEvent, recordCrashCashout } = useApp();
  const { user } = useAuth();

  const [roomState, setRoomState] = useState<CrashRoomState | null>(null);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.00);
  const [optimisticCashout, setOptimisticCashout] = useState<number | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [showChickenModal, setShowChickenModal] = useState<boolean>(false);
  const [chickenPlayerName, setChickenPlayerName] = useState<string>('');
  const [prepCountdown, setPrepCountdown] = useState<number>(4);
  const [sessionRecords, setSessionRecords] = useState<CrashSessionRoundRecord[]>([]);
  const [isLocalCrashed, setIsLocalCrashed] = useState<boolean>(false);

  // Sync player active room status for friends
  useEffect(() => {
    if (user && roomCode) {
      const shortId = getUserCurrentShortId(user.uid);
      setUserActiveRoom(user.uid, shortId, {
        mode: 'crash',
        roomCode,
        status: roomState?.status === 'in_game' ? 'in_game' : 'lobby',
        playerCount: roomState?.players.length || 1,
        maxPlayers: 6,
        hostName: roomState?.players.find((p) => p.isHost)?.name || localPlayer.name,
      });
    }
    return () => {
      if (user) {
        const shortId = getUserCurrentShortId(user.uid);
        setUserActiveRoom(user.uid, shortId, null);
      }
    };
  }, [user, roomCode, roomState?.status, roomState?.players.length]);

  // Local auto-cashout controls
  const [autoCashout, setAutoCashout] = useState<boolean>(false);
  const [autoTargetInput, setAutoTargetInput] = useState<number>(2.00);

  // Refs for loop & animation & achievements
  const animFrameRef = useRef<number | null>(null);
  const hasTriggeredCrashRef = useRef<boolean>(false);
  const hasTriggeredAutoCashoutRef = useRef<boolean>(false);
  const hasTriggeredAllCashedOutCrashRef = useRef<boolean>(false);
  const triggeredBotCashoutSetRef = useRef<Set<string>>(new Set());
  const hasHandledGameOverRef = useRef<boolean>(false);
  const consecutiveRoundWinsRef = useRef<number>(0);
  const handledResolvedRoundNumRef = useRef<number>(-1);

  // 1. Real-time subscription to Firestore room
  useEffect(() => {
    const unsubscribe = subscribeToCrashRoom(
      roomCode,
      (updatedRoom) => {
        if (updatedRoom) {
          setRoomState(updatedRoom);
          reconnectionService.notifyConnected('crash', roomCode);
        } else {
          reconnectionService.notifyDisconnected('crash', 'Camera nu mai există.');
        }
      },
      (err) => {
        reconnectionService.notifyDisconnected('crash', err?.message || 'Eroare conexiune Crash');
      }
    );

    return () => {
      unsubscribe();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [roomCode]);

  // Register reconnection handler for crash
  useEffect(() => {
    const unregister = reconnectionService.registerHandler('crash', async (session) => {
      console.log('[Crash] Auto-reconnecting to room:', session.roomCode);
      return new Promise<boolean>((resolve) => {
        const unsub = subscribeToCrashRoom(
          session.roomCode,
          (updatedRoom) => {
            if (updatedRoom) {
              setRoomState(updatedRoom);
              reconnectionService.notifyConnected('crash', session.roomCode);
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

  // Save active session for auto-reconnection
  useEffect(() => {
    if (roomCode && roomState) {
      saveActiveSession('crash', roomCode, localPlayer, isHost);
    }
  }, [roomCode, roomState, localPlayer, isHost]);

  // 2. Identify local and opponent players
  const me = roomState?.players.find(p => p.id === localPlayer.id);
  const opponent = roomState?.players.find(p => p.id !== localPlayer.id);

  // Reset round refs on round change or prep phase
  useEffect(() => {
    if (roomState?.currentRound.phase === 'prep') {
      setIsLocalCrashed(false);
      hasTriggeredCrashRef.current = false;
      hasTriggeredAutoCashoutRef.current = false;
      hasTriggeredAllCashedOutCrashRef.current = false;
      triggeredBotCashoutSetRef.current.clear();
    }
  }, [roomState?.currentRound.roundNumber, roomState?.currentRound.phase]);

  // 3. Prep phase countdown timer (Host triggers flight when countdown ends)
  useEffect(() => {
    if (roomState?.status === 'in_game' && roomState.currentRound.phase === 'prep') {
      setIsLocalCrashed(false);
      hasTriggeredCrashRef.current = false;
      hasTriggeredAutoCashoutRef.current = false;
      hasTriggeredAllCashedOutCrashRef.current = false;
      triggeredBotCashoutSetRef.current.clear();
      setOptimisticCashout(null);
      setCurrentMultiplier(1.00);
      setPrepCountdown(4);

      const interval = setInterval(() => {
        setPrepCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            if (isHost) {
              soundEffects.playDragonTakeoff();
              startFlyingPhase(roomCode);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [roomState?.status, roomState?.currentRound.phase, roomState?.currentRound.roundNumber, isHost, roomCode]);

  // 4. Flying phase real-time multiplier loop (Synced via Server Timestamp)
  useEffect(() => {
    if (roomState?.status === 'in_game' && roomState.currentRound.phase === 'flying') {
      const startTime = roomState.currentRound.roundStartTimestamp;
      const targetCrash = roomState.currentRound.crashPoint;
      let lastUiUpdateTime = 0;

      const tick = () => {
        const now = getSyncedServerNow();
        const elapsedSec = Math.max(0, (now - startTime) / 1000);
        const mult = calculateMultiplier(elapsedSec);

        // Check if all active players in room have already cashed out!
        const allCashedOut =
          roomState.players &&
          roomState.players.length > 0 &&
          roomState.players.every(p => p.cashedOutAt != null || (p.id === localPlayer.id && optimisticCashout != null));

        if (allCashedOut && !hasTriggeredAllCashedOutCrashRef.current) {
          hasTriggeredAllCashedOutCrashRef.current = true;
          setTimeout(() => {
            if (!hasTriggeredCrashRef.current) {
              hasTriggeredCrashRef.current = true;
              setIsLocalCrashed(true);
              soundEffects.playDragonCrash();
              crashDragon(roomCode);
            }
          }, 800);
        }

        // Check if reached crash point - IMMEDIATELY trigger visual crash without freezing
        if (mult >= targetCrash) {
          setCurrentMultiplier(targetCrash);
          setIsLocalCrashed(true);
          if (!hasTriggeredCrashRef.current) {
            hasTriggeredCrashRef.current = true;
            soundEffects.playDragonCrash();
            crashDragon(roomCode);
          }
          return;
        }

        // Smooth state update throttle (~30 FPS for React virtual DOM diffing, canvas renders native 60+ FPS)
        if (now - lastUiUpdateTime >= 32) {
          lastUiUpdateTime = now;
          setCurrentMultiplier(mult);
        }

        // Check Local Auto-Cashout
        if (
          autoCashout &&
          autoTargetInput &&
          mult >= autoTargetInput &&
          !hasTriggeredAutoCashoutRef.current &&
          me &&
          me.cashedOutAt == null &&
          optimisticCashout == null
        ) {
          hasTriggeredAutoCashoutRef.current = true;
          handleCashout(mult, true);
        }

        // Check AI Bots Cashout (Host triggers cashout for any bot in room, guarded by Set ref)
        if (isHost && roomState.players) {
          roomState.players.forEach(p => {
            if (p.isBot && p.cashedOutAt == null && !triggeredBotCashoutSetRef.current.has(p.id)) {
              const botTarget = p.autoCashoutTarget || 2.00;
              if (mult >= botTarget) {
                triggeredBotCashoutSetRef.current.add(p.id);
                playerCashOut(roomCode, p.id, mult);
              }
            }
          });
        }

        animFrameRef.current = requestAnimationFrame(tick);
      };

      animFrameRef.current = requestAnimationFrame(tick);

      return () => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      };
    }
  }, [
    roomState?.status,
    roomState?.currentRound.phase,
    roomState?.currentRound.roundStartTimestamp,
    roomState?.currentRound.crashPoint,
    roomState?.players,
    autoCashout,
    autoTargetInput,
    me?.cashedOutAt,
    optimisticCashout,
    opponent?.cashedOutAt,
    isHost,
    roomCode,
  ]);

  // 5. Crashed phase -> auto resolve after short delay (with fallback timer)
  useEffect(() => {
    if (roomState?.status === 'in_game' && roomState.currentRound.phase === 'crashed') {
      const delay = isHost ? 1500 : 3000;
      const timer = setTimeout(() => {
        resolveCrashRound(roomCode);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [roomState?.status, roomState?.currentRound.phase, isHost, roomCode]);

  // 6. Check Round Resolution Achievements & Easter Egg "Puiul" 🐔
  const chickenHandledRoundRef = useRef<number>(-1);

  useEffect(() => {
    if (roomState?.currentRound.phase === 'resolved') {
      const currentRoundNum = roomState.currentRound.roundNumber || 1;
      
      // Easter Egg Chicken check
      if (chickenHandledRoundRef.current !== currentRoundNum) {
        const chickenPlayer = roomState.players.find(p => (p.chickenStreak || 0) >= 3);
        if (chickenPlayer) {
          chickenHandledRoundRef.current = currentRoundNum;
          setChickenPlayerName(chickenPlayer.name);
          setShowChickenModal(true);
          try {
            soundEffects.playChickenCluck();
          } catch (err) {
            console.warn('Audio play error:', err);
          }
          if (chickenPlayer.id === localPlayer.id) {
            unlockAchievement('crash_chicken_egg', localPlayer.name);
          }
        }
      }

      // Round-level achievement checks & Session P/L tracking
      if (handledResolvedRoundNumRef.current !== currentRoundNum) {
        handledResolvedRoundNumRef.current = currentRoundNum;
        const myPlayer = roomState.players.find(p => p.id === localPlayer.id);
        const oppPlayers = roomState.players.filter(p => p.id !== localPlayer.id);
        const oppPlayer = oppPlayers[0];

        if (myPlayer) {
          const isGroapa = roomState.currentRound.stakeType === 'groapa' || roomState.currentRound.isGroapaRound;
          const myCashedOut = myPlayer.cashedOutAt != null;
          const oppCashedOut = oppPlayer?.cashedOutAt != null;

          const mySipsDrank = myPlayer.roundSipsToDrink || 0;
          const myGroapaDrank = myPlayer.roundGroapaToDrink || 0;
          const oppSipsDrank = oppPlayers.reduce((acc, p) => acc + (p.roundSipsToDrink || 0), 0);
          const netDelta = oppSipsDrank - mySipsDrank;

          const myWonRound = isGroapa
            ? myCashedOut && (!oppCashedOut || (myPlayer.cashedOutAt || 0) > (oppPlayer?.cashedOutAt || 0))
            : myCashedOut && (myPlayer.score || 0) >= (oppPlayer?.score || 0) && oppSipsDrank > 0;

          // Record session ledger entry
          setSessionRecords(prev => {
            if (prev.some(r => r.roundNumber === currentRoundNum)) return prev;
            return [
              ...prev,
              {
                roundNumber: currentRoundNum,
                stakeType: isGroapa ? 'groapa' : 'guri',
                betValue: roomState.currentRound.betValue || 1,
                crashPoint: roomState.currentRound.crashPoint,
                myCashedOutAt: myPlayer.cashedOutAt ?? null,
                myScore: myPlayer.score || 0,
                mySipsDrank,
                myGroapaDrank,
                opponentsSipsDrank: oppSipsDrank,
                netSipsDelta: netDelta,
                wonRound: myWonRound,
                timestamp: Date.now(),
              },
            ];
          });

          if (mySipsDrank > 0) {
            trackQuestEvent({ type: 'drink_sips', count: mySipsDrank });
          }
          if (myGroapaDrank > 0) {
            trackQuestEvent({ type: 'drink_chug', count: myGroapaDrank });
          }

          if (myWonRound) {
            consecutiveRoundWinsRef.current += 1;
            if (consecutiveRoundWinsRef.current >= 5) {
              unlockAchievement('crash_streak_5', localPlayer.name);
            }
            if (consecutiveRoundWinsRef.current >= 3) {
              unlockAchievement('crash_streak_3', localPlayer.name);
            }
            if (myPlayer.cashedOutAt && myPlayer.cashedOutAt <= 2.00) {
              unlockAchievement('crash_prudent_victor', localPlayer.name);
            }
            if (myPlayer.cashedOutAt && myPlayer.cashedOutAt >= 3.00) {
              unlockAchievement('crash_fiery_victor', localPlayer.name);
            }
            if (isGroapa && !oppCashedOut) {
              unlockAchievement('crash_groapa_survivor', localPlayer.name);
            }
            if (oppPlayer && (oppPlayer.roundSipsToDrink || 0) >= 3) {
              unlockAchievement('crash_greed_punish', localPlayer.name);
            }
          } else if (!myCashedOut) {
            consecutiveRoundWinsRef.current = 0;
          }
        }
      }
    }
  }, [
    roomState?.currentRound.phase,
    roomState?.currentRound.roundNumber,
    roomState?.currentRound.stakeType,
    roomState?.currentRound.isGroapaRound,
    roomState?.players,
    localPlayer.id,
    localPlayer.name,
    unlockAchievement,
  ]);

  // Auto-dismiss chicken modal safely after a few seconds
  useEffect(() => {
    if (showChickenModal) {
      const timer = setTimeout(() => {
        handleDismissChickenModal();
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [showChickenModal]);

  // 7. Handle Game Over and award stats / achievements
  useEffect(() => {
    if (roomState?.status === 'finished' && !hasHandledGameOverRef.current) {
      hasHandledGameOverRef.current = true;
      const isWinner = roomState.winnerId === localPlayer.id;
      const sipsDrunk = me?.totalGuriAcumulate || 0;
      const gropiDrunk = me?.totalGroapaAcumulate || 0;
      const isBotMatch = Boolean(opponent?.isBot);
      const roundsPlayed = roomState.currentRound?.roundNumber || 1;
      const isAntiFarming = roundsPlayed < 2;

      // Daily Quest Tracking
      trackQuestEvent({ type: 'game_completed', mode: 'crash', isWinner });
      trackQuestEvent({ type: 'theme_played', theme });
      trackQuestEvent({ type: 'dice_skin_played', diceSkin });

      // Unlock Achievements (only for real matches)
      if (!isAntiFarming) {
        unlockAchievement('first_crash', localPlayer.name);
        if (isWinner) {
          if (isBotMatch) {
            unlockAchievement('crash_bot_victor', localPlayer.name);
          }
          if (sipsDrunk === 0 && gropiDrunk === 0) {
            unlockAchievement('crash_flawless_match', localPlayer.name);
          }
        }
      }

      // Leaderboard & profile stats: ONLY for completed matches against REAL human opponents (NOT bots, NOT unfinished, >= 2 rounds)
      if (!isBotMatch && !isAntiFarming) {
        awardMatchXp(localPlayer.name, 'duel' as any, isWinner, roundsPlayed, [], {
          sips: sipsDrunk,
          chugs: gropiDrunk,
        });

        if (isWinner) {
          recordGameStats({
            mode: 'crash',
            isWin: true,
            sipsDelta: sipsDrunk,
            isCrashWin: true,
            playerName: localPlayer.name,
          });
        } else {
          recordGameStats({
            mode: 'crash',
            isWin: false,
            sipsDelta: sipsDrunk,
            playerName: localPlayer.name,
          });
        }
      }
    }
  }, [roomState?.status, roomState?.winnerId, roomState?.currentRound?.roundNumber, localPlayer.id, localPlayer.name, me?.totalGuriAcumulate, me?.totalGroapaAcumulate, opponent?.isBot, unlockAchievement, recordGameStats, awardMatchXp]);

  // Manual & Auto Cashout Handler
  const handleCashout = async (multOverride?: number, isAutoSource?: boolean) => {
    if (!me || me.cashedOutAt != null || optimisticCashout != null) return;
    if (isLocalCrashed || hasTriggeredCrashRef.current || roomState?.currentRound.phase !== 'flying') return;

    // Check actual server flight elapsed time & multiplier
    const startTime = roomState.currentRound.roundStartTimestamp || getSyncedServerNow();
    const flightElapsedSec = Math.max(0, (getSyncedServerNow() - startTime) / 1000);
    const calculatedMult = calculateMultiplier(flightElapsedSec);
    const targetCrash = roomState.currentRound.crashPoint;

    // If already at or past crash point, it's a crash, not a cashout!
    if (calculatedMult >= targetCrash || currentMultiplier >= targetCrash) {
      setIsLocalCrashed(true);
      if (!hasTriggeredCrashRef.current) {
        hasTriggeredCrashRef.current = true;
        soundEffects.playDragonCrash();
        crashDragon(roomCode);
      }
      return;
    }

    const maxAllowedMult = Number((targetCrash - 0.01).toFixed(2));
    const lockedMult = Math.min(
      multOverride || currentMultiplier,
      calculatedMult,
      maxAllowedMult
    );

    if (lockedMult < 1.00) return;

    setOptimisticCashout(lockedMult);
    soundEffects.playCashOut();
    recordCrashCashout(localPlayer.name, lockedMult);

    // Daily Quest Tracking
    trackQuestEvent({ type: 'crash_cashout', multiplier: lockedMult });
    trackQuestEvent({ type: 'crash_round_survived' });
    if (roomState?.settings?.stakeMode === 'high_mult' || roomState?.currentRound?.stakeType === 'high_mult') {
      trackQuestEvent({ type: 'crash_high_mult_played' });
    }

    // Check achievement for high multiplier tiers
    if (lockedMult >= 50.00) {
      unlockAchievement('crash_legendary_x50', localPlayer.name);
    } else if (lockedMult >= 20.00) {
      unlockAchievement('crash_legendary_x20', localPlayer.name);
    } else if (lockedMult >= 10.00) {
      unlockAchievement('crash_titan_x10', localPlayer.name);
    } else if (lockedMult >= 5.00) {
      unlockAchievement('crash_high_multiplier', localPlayer.name);
    }
    unlockAchievement('crash_safe_landing', localPlayer.name);

    if (isAutoSource) {
      unlockAchievement('crash_auto_pilot', localPlayer.name);
    }

    const elapsedSeconds = roomState?.currentRound.roundStartTimestamp
      ? (getSyncedServerNow() - roomState.currentRound.roundStartTimestamp) / 1000
      : 5;
    if (elapsedSeconds <= 2.0) {
      unlockAchievement('crash_quick_escape', localPlayer.name);
    }

    try {
      await playerCashOut(roomCode, localPlayer.id, lockedMult);
    } catch (err) {
      console.error('Error on player cashout:', err);
    }
  };

  const handleToggleAutoCashout = async () => {
    const nextVal = !autoCashout;
    setAutoCashout(nextVal);
    await updateCrashPlayerSettings(roomCode, localPlayer.id, nextVal, autoTargetInput);
  };

  const handleUpdateTargetMultiplier = async (target: number) => {
    const clamped = Math.max(1.05, Number(target.toFixed(2)));
    setAutoTargetInput(clamped);
    await updateCrashPlayerSettings(roomCode, localPlayer.id, autoCashout, clamped);
  };

  const handleDismissChickenModal = async () => {
    setShowChickenModal(false);
    try {
      const chickenPlayer = roomState?.players.find(p => (p.chickenStreak || 0) >= 3);
      if (chickenPlayer) {
        await resetChickenStreak(roomCode, chickenPlayer.id);
      }
    } catch (e) {
      console.warn('handleDismissChickenModal error:', e);
    }
  };

  const handleNextRound = async () => {
    if (isHost) {
      hasTriggeredCrashRef.current = false;
      hasTriggeredAutoCashoutRef.current = false;
      hasTriggeredAllCashedOutCrashRef.current = false;
      await startNextCrashRound(roomCode);
    }
  };

  const handleAddBot = async (style: CrashBotStyle) => {
    await addCrashBot(roomCode, style);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleExit = async () => {
    clearActiveSession();
    reconnectionService.cancelAndExit();
    await leaveCrashRoom(roomCode, localPlayer.id);
    onExit();
  };

  if (!roomState) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6 space-y-4">
        <div className="w-16 h-16 border-4 border-[#ffd700] border-t-transparent rounded-full animate-spin" />
        <h2 className="text-xl font-bold text-[#ffd700] font-cinzel">
          {language === 'ro' ? 'Se conectează la Chilia Dragonului...' : 'Connecting to the Dragon Lair...'}
        </h2>
        {roomCode && (
          <p className="text-xs font-mono text-stone-400">
            Chilie: <span className="text-amber-400 font-bold tracking-widest">{roomCode}</span>
          </p>
        )}
        <button
          onClick={onExit}
          className="mt-4 px-4 py-2 bg-stone-900 border border-stone-700 hover:border-red-500/80 rounded-xl text-xs font-cinzel text-stone-300 hover:text-white transition-all"
        >
          {language === 'ro' ? '← Înapoi la Meniu' : '← Back to Menu'}
        </button>
      </div>
    );
  }

  // --- 1. LOBBY VIEW ---
  if (roomState.status === 'lobby') {
    return (
      <div className="max-w-xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-red-950/60 border border-red-500/40 rounded-2xl shadow-xl">
            <span className="text-4xl">🐉</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-amber-400 font-cinzel tracking-wider">
            {language === 'ro' ? 'CHILIA CRASH (2 - 6 JUCĂTORI)' : 'CRASH LAIR (2 - 6 PLAYERS)'}
          </h1>
          <p className="text-xs sm:text-sm text-stone-300">
            {language === 'ro'
              ? 'Pragul de guri stabilit la lobby: '
              : 'Match sips threshold: '}
            <span className="text-red-400 font-bold text-base">
              {roomState.settings.sipsThreshold} {language === 'ro' ? 'guri' : 'sips'}
            </span>
            <span className="mx-2 text-stone-600">•</span>
            <span className="text-amber-300 font-semibold">
              {roomState.settings.stakeMode === 'high_mult'
                ? (language === 'ro' ? '🚀 Multiplicatoare Mari' : '🚀 High Multipliers')
                : roomState.settings.stakeMode === 'guri'
                ? (language === 'ro' ? '🍺 Doar Guri' : '🍺 Only Sips')
                : (language === 'ro' ? '⚡ Balansat' : '⚡ Balanced')}
            </span>
          </p>
          <p className="text-[11px] text-amber-300/80 font-barlow italic">
            {language === 'ro'
              ? '⚔️ În fiecare rundă, fiecare jucător își compară punctele cu cel care a făcut cele mai multe!'
              : '⚔️ Each round, every player compares points against the highest round scorer!'}
          </p>
        </div>

        {/* Room Code & Invite Link Card */}
        <div className="bg-stone-900/80 border-2 border-amber-500/40 rounded-2xl p-5 text-center shadow-2xl space-y-3">
          <p className="text-xs uppercase tracking-widest text-amber-300/80">
            {language === 'ro' ? 'Codul Chiliilor / Camerei' : 'Lair Room Code'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-3xl sm:text-4xl font-black tracking-widest text-white font-mono bg-black/50 px-5 py-2 rounded-xl border border-amber-500/30">
              {roomCode}
            </span>
            <button
              onClick={handleCopyCode}
              className="p-3 bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/50 rounded-xl text-amber-300 transition-colors font-bold text-xs flex items-center gap-1.5"
              title="Copiază codul"
            >
              <span>{copiedCode ? '✓' : '📋'}</span>
              <span>{copiedCode ? (language === 'ro' ? 'Copiat!' : 'Copied!') : (language === 'ro' ? 'Copiază Cod' : 'Copy Code')}</span>
            </button>
            <button
              onClick={() => {
                const inviteUrl = `${window.location.origin}${window.location.pathname}?crash_room=${roomCode}`;
                navigator.clipboard.writeText(inviteUrl);
                setCopiedCode(true);
                setTimeout(() => setCopiedCode(false), 2000);
              }}
              className="p-3 bg-red-950/60 hover:bg-red-900/80 border border-red-500/50 rounded-xl text-red-300 transition-colors font-bold text-xs flex items-center gap-1.5"
              title="Copiază Link Invitație"
            >
              <span>🔗</span>
              <span>{language === 'ro' ? 'Copiază Link' : 'Copy Link'}</span>
            </button>
          </div>
        </div>

        {/* Roster of Players (Up to 6) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-cinzel font-bold text-amber-300">
              {language === 'ro' ? 'Călugări în Chilie:' : 'Monks in Lair:'} ({roomState.players.length}/6)
            </span>
            <span className="text-[10px] text-stone-400">
              {language === 'ro' ? 'Minim 2, Maxim 6' : 'Min 2, Max 6'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {roomState.players.map((p, idx) => (
              <div key={p.id || idx} className="bg-stone-900/80 border border-amber-500/40 rounded-2xl p-3 text-center relative group">
                {isHost && p.isBot && (
                  <button
                    onClick={() => removeCrashPlayer(roomCode, p.id)}
                    className="absolute top-1.5 right-1.5 w-5 h-5 bg-red-950/90 hover:bg-red-700 text-red-300 hover:text-white rounded-full text-xs font-bold flex items-center justify-center border border-red-500/50 transition-colors"
                    title={language === 'ro' ? 'Elimină Bot' : 'Remove Bot'}
                  >
                    ✕
                  </button>
                )}
                <div className="flex justify-center mb-1.5">
                  <AvatarDisplay avatarId={p.avatarIcon || 'monk_drunk'} size={48} />
                </div>
                <p className="font-bold text-amber-200 text-xs sm:text-sm truncate">{p.name}</p>
                <span
                  className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full border inline-block mt-1 ${
                    p.isHost
                      ? 'text-amber-400 bg-amber-950/60 border-amber-500/30'
                      : p.isBot
                      ? 'text-teal-400 bg-teal-950/60 border-teal-500/30'
                      : 'text-purple-300 bg-purple-950/60 border-purple-500/30'
                  }`}
                >
                  {p.isHost ? 'Host' : p.isBot ? (p.botStyle === 'risky' ? 'Bot Înflăcărat' : 'Bot Prudent') : 'Jucător'}
                </span>
              </div>
            ))}

            {/* Empty slot / Add Bot if less than 6 players */}
            {roomState.players.length < 6 && (
              <div className="bg-stone-900/40 border border-dashed border-stone-600 rounded-2xl p-3 flex flex-col items-center justify-center text-center space-y-1.5 min-h-[120px]">
                <div className="w-8 h-8 rounded-full border-2 border-dashed border-stone-500 flex items-center justify-center text-stone-500 text-base animate-pulse">
                  +
                </div>
                <p className="text-[10px] text-stone-400">
                  {language === 'ro' ? `Slot liber (${roomState.players.length + 1}/6)` : `Open slot (${roomState.players.length + 1}/6)`}
                </p>
                {isHost && (
                  <div className="flex flex-col gap-1 w-full pt-0.5">
                    <button
                      onClick={() => handleAddBot('prudent')}
                      className="w-full py-1 px-1 bg-teal-800/50 hover:bg-teal-700/60 border border-teal-500/40 rounded-lg text-[10px] font-bold text-teal-200 transition-all truncate"
                    >
                      🤖 + Bot Prudent
                    </button>
                    <button
                      onClick={() => handleAddBot('risky')}
                      className="w-full py-1 px-1 bg-orange-800/50 hover:bg-orange-700/60 border border-orange-500/40 rounded-lg text-[10px] font-bold text-orange-200 transition-all truncate"
                    >
                      🔥 + Bot Înflăcărat
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="space-y-3 pt-2">
          {isHost && roomState.players.length >= 2 ? (
            <button
              onClick={() => startCrashMatch(roomCode)}
              className="w-full py-4 bg-gradient-to-r from-red-600 via-amber-600 to-red-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-lg tracking-wider rounded-2xl shadow-2xl border-2 border-amber-400 font-cinzel uppercase transition-transform active:scale-95"
            >
              🔥 {language === 'ro' ? `PORNEȘTE MECIUL (${roomState.players.length} JUCĂTORI)` : `START MATCH (${roomState.players.length} PLAYERS)`}
            </button>
          ) : isHost ? (
            <p className="text-center text-xs text-stone-400">
              {language === 'ro'
                ? 'Așteaptă conectarea călugărilor sau adaugă un Bot AI (minim 2 jucători)!'
                : 'Waiting for players or add an AI Bot to begin (min 2 players)!'}
            </p>
          ) : (
            <p className="text-center text-xs text-amber-300 animate-pulse">
              {language === 'ro' ? 'Așteaptă ca Host-ul să pornească meciul...' : 'Waiting for host to start...'}
            </p>
          )}

          <button
            onClick={handleExit}
            className="w-full py-2.5 bg-stone-800/80 hover:bg-stone-700/80 text-stone-300 font-bold text-xs rounded-xl border border-stone-600 transition-colors"
          >
            🏛️ {language === 'ro' ? 'Părăsește Chilia' : 'Leave Room'}
          </button>
        </div>
      </div>
    );
  }

  // --- 2. GAMEPLAY VIEW ---
  const currentRound = roomState.currentRound;
  const isPrep = currentRound.phase === 'prep';
  const isCrashed = currentRound.phase === 'crashed' || isLocalCrashed;
  const isFlying = currentRound.phase === 'flying' && !isLocalCrashed;
  const isResolved = currentRound.phase === 'resolved';
  const isGroapaRound = currentRound.stakeType === 'groapa' || currentRound.isGroapaRound;
  const isGroapaMode = roomState.settings?.stakeMode === 'groapa';
  const isHighMultMode = roomState.settings?.stakeMode === 'high_mult';
  const groapaThreshold = roomState.settings?.groapaThreshold || 3;
  const threshold = roomState.settings?.sipsThreshold || 30;

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-5 space-y-4 select-none">
      {/* Top Header: Room, Threshold goal, Round # */}
      <div className="flex items-center justify-between bg-stone-900/80 border border-amber-500/30 rounded-2xl p-3 shadow-lg">
        <div className="flex items-center gap-2">
          <span className="text-xl">{isGroapaRound ? '🕳️' : isHighMultMode ? '🚀' : '🐉'}</span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-amber-400 font-cinzel">
                {language === 'ro' ? `RUNDA ${currentRound.roundNumber}` : `ROUND ${currentRound.roundNumber}`}
              </h2>
              {isGroapaRound && (
                <span className="bg-red-900/90 border border-red-500 text-red-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                  🕳️ GROAPĂ
                </span>
              )}
              {isHighMultMode && (
                <span className="bg-amber-950/90 border border-amber-400/80 text-yellow-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-[0_0_8px_rgba(245,158,11,0.25)]">
                  🚀 {language === 'ro' ? 'MULTIPLICATOARE MARI' : 'HIGH MULTIPLIERS'}
                </span>
              )}
            </div>
            <span className="text-[10px] text-stone-400 font-mono">
              Chilie: <strong className="text-amber-300">{roomCode}</strong>
            </span>
          </div>
        </div>

        {/* Threshold bar */}
        <div className="flex items-center gap-3">
          <NetworkConnectionBadge />
          <div className="text-right">
            <div className="text-[11px] font-bold text-red-400 uppercase tracking-wider">
              {isGroapaMode
                ? `${language === 'ro' ? 'Prag Înfrângere' : 'Defeat Limit'}: ${groapaThreshold} 🕳️`
                : `${language === 'ro' ? 'Prag Înfrângere' : 'Defeat Limit'}: ${threshold} 🍺`}
            </div>
            <div className="text-[10px] text-stone-400">
              {language === 'ro' ? 'Primul care atinge pragul pierde' : 'First to reach limit loses'}
            </div>
          </div>
        </div>

        <button
          onClick={handleExit}
          className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold rounded-xl border border-stone-600"
          title="Ieși"
        >
          ✕
        </button>
      </div>

      {/* Players Progress Bars & Status Cards (Grid of all players in room) */}
      <div className={`grid gap-2.5 ${roomState.players.length === 2 ? 'grid-cols-2' : roomState.players.length === 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-3'}`}>
        {roomState.players.map((p) => {
          const isLocal = p.id === localPlayer.id;
          // Privacy rule: Do not reveal opponent cashout during flying phase!
          const showCashout = isLocal || isCrashed || isResolved;

          return (
            <div
              key={p.id}
              className={`p-2.5 rounded-2xl border transition-all ${
                showCashout && p.cashedOutAt != null
                  ? 'bg-emerald-950/40 border-emerald-500/60'
                  : isCrashed
                  ? 'bg-red-950/40 border-red-500/50'
                  : isLocal
                  ? 'bg-stone-900/90 border-amber-500/60 ring-1 ring-amber-500/30'
                  : 'bg-stone-900/80 border-stone-700'
              }`}
            >
              <div className="flex items-center justify-between gap-1.5 mb-1">
                <div className="flex items-center gap-1.5 truncate">
                  <AvatarDisplay avatarId={p.avatarIcon || 'monk_drunk'} size={28} />
                  <div className="truncate">
                    <p className="text-[11px] font-bold text-amber-200 truncate">
                      {p.name} {isLocal && '(Tu)'}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-[11px] font-black text-red-400">
                    {isGroapaMode
                      ? `${p.totalGroapaAcumulate || 0}/${groapaThreshold}🕳️`
                      : `${p.totalGuriAcumulate || 0}/${threshold}🍺`}
                  </span>
                  {!isGroapaMode && (p.totalGroapaAcumulate || 0) > 0 && (
                    <span className="text-[9px] font-bold text-red-300 block">
                      ({p.totalGroapaAcumulate} 🕳️)
                    </span>
                  )}
                </div>
              </div>

              {/* Progress bar towards limit */}
              <div className="w-full bg-stone-950 rounded-full h-1.5 overflow-hidden border border-stone-800">
                <div
                  className="bg-gradient-to-r from-amber-500 to-red-500 h-full transition-all duration-300"
                  style={{
                    width: isGroapaMode
                      ? `${Math.min(100, ((p.totalGroapaAcumulate || 0) / groapaThreshold) * 100)}%`
                      : `${Math.min(100, ((p.totalGuriAcumulate || 0) / threshold) * 100)}%`,
                  }}
                />
              </div>

              {/* Cashout pill */}
              <div className="mt-1 text-center">
                {showCashout && p.cashedOutAt != null ? (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded-full border border-emerald-500/40 truncate block">
                    ✅ x{p.cashedOutAt.toFixed(2)} {isGroapaRound ? '(Salvat)' : `(${p.score} guri)`}
                  </span>
                ) : isCrashed ? (
                  <span className="text-[10px] font-bold text-red-400 bg-red-950/80 px-1.5 py-0.5 rounded-full border border-red-500/40 truncate block">
                    💥 Prăbușit
                  </span>
                ) : isFlying ? (
                  <span className="text-[10px] font-bold text-amber-300 animate-pulse truncate block">
                    🚀 {isLocal ? (p.cashedOutAt != null ? `Salvat la x${p.cashedOutAt.toFixed(2)}` : 'În zbor...') : 'În zbor...'}
                  </span>
                ) : (
                  <span className="text-[9px] text-stone-400">Pregătire</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Net Profit/Loss & Session Performance Tracker */}
      <CrashSessionTracker
        records={sessionRecords}
        currentRoundNumber={currentRound.roundNumber}
        language={language}
        totalGuriAcumulate={me?.totalGuriAcumulate || 0}
        totalGroapaAcumulate={me?.totalGroapaAcumulate || 0}
        sipsThreshold={threshold}
        groapaThreshold={groapaThreshold}
        isGroapaMode={isGroapaMode}
      />

      {/* Past Rounds History Strip */}
      <div className="bg-[#120c07]/90 border border-amber-900/40 rounded-2xl px-3 py-2 shadow-inner flex items-center gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-amber-900/60">
        <div className="flex items-center gap-1 text-[11px] font-cinzel font-bold text-amber-400 flex-shrink-0 pr-1.5 border-r border-stone-800">
          <span>📜</span>
          <span className="hidden sm:inline">{language === 'ro' ? 'Istoric Ture:' : 'Rounds History:'}</span>
          <span className="sm:hidden">{language === 'ro' ? 'Istoric:' : 'History:'}</span>
        </div>

        {(!roomState.history || roomState.history.length === 0) ? (
          <span className="text-[11px] text-stone-500 italic">
            {language === 'ro' ? 'Tura 1 (istoricul se va afișa după prima rundă)' : 'Round 1 (history will appear after round 1)'}
          </span>
        ) : (
          <div className="flex items-center gap-1.5 flex-nowrap min-w-0">
            {roomState.history.map((item, idx) => {
              const mult = item.multiplier;
              const formattedMult = mult.toFixed(2).replace(/\.?0+$/, '') || mult.toFixed(1);
              const isLow = mult < 1.5;
              const isMedium = mult >= 1.5 && mult < 2.0;
              const isGood = mult >= 2.0 && mult < 5.0;
              const isHigh = mult >= 5.0 && mult < 10.0;
              const isEpic = mult >= 10.0;

              const badgeStyle = isLow
                ? 'bg-red-950/80 text-red-300 border-red-500/50'
                : isMedium
                ? 'bg-amber-950/80 text-amber-300 border-amber-500/50'
                : isGood
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                : isHigh
                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50'
                : 'bg-purple-950/90 text-yellow-300 border-purple-400 font-black shadow-[0_0_10px_rgba(168,85,247,0.4)]';

              return (
                <div
                  key={idx}
                  className={`px-2.5 py-1 rounded-xl border text-xs font-mono font-bold flex items-center gap-1 flex-shrink-0 transition-transform hover:scale-105 select-none ${badgeStyle}`}
                  title={`${language === 'ro' ? 'Runda' : 'Round'} ${item.roundNumber || idx + 1}: x${mult.toFixed(2)} ${
                    item.stakeType === 'groapa' ? '(Groapă)' : `(${item.betValue || 1} guri)`
                  }`}
                >
                  {item.stakeType === 'groapa' && <span className="text-[10px]">🕳️</span>}
                  <span>x{formattedMult.includes('.') ? formattedMult : `${formattedMult}.0`}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Game Stage & Multiplier Display */}
      <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-500/40 bg-black">
        {/* Canvas Background & Trajectory Curve */}
        <CrashCanvas
          currentMultiplier={currentMultiplier}
          crashPoint={currentRound.crashPoint}
          isCrashed={isCrashed}
          isFlying={isFlying}
          players={roomState.players}
          localPlayerId={localPlayer.id}
        />

        {/* Round Bet Banner (Top Center) */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/75 backdrop-blur-md border border-amber-400/50 px-4 py-1 rounded-full shadow-lg z-10 flex items-center gap-2">
          {isGroapaRound ? (
            <span className="text-red-400 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
              <span>🕳️</span>
              <span>{language === 'ro' ? 'MIZĂ: 1 GROAPĂ' : 'STAKE: 1 CHUG / GROAPA'}</span>
              <span>🔥</span>
            </span>
          ) : (
            <>
              <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">
                {language === 'ro' ? 'Pariul Rundei' : 'Round Stake'}:
              </span>
              <span className="text-white font-black text-sm bg-amber-600/80 px-2.5 py-0.5 rounded-full">
                {currentRound.betValue} {language === 'ro' ? 'guri' : 'sips'}
              </span>
            </>
          )}
        </div>

        {/* Live Multiplier Center Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
          {isPrep ? (
            <div className="text-center bg-black/60 backdrop-blur-md px-6 py-4 rounded-3xl border border-amber-500/40 shadow-2xl">
              <p className="text-xs text-amber-300 font-bold uppercase tracking-widest mb-1">
                {language === 'ro' ? 'Pregătire Zbor' : 'Preparing Flight'}
              </p>
              <div className="text-5xl font-black text-amber-400 font-cinzel animate-pulse">
                {prepCountdown}s
              </div>
            </div>
          ) : isCrashed ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center bg-red-950/85 backdrop-blur-md px-6 py-4 rounded-3xl border-2 border-red-500 shadow-2xl"
            >
              <p className="text-xs text-red-300 font-bold uppercase tracking-widest">
                💥 {language === 'ro' ? 'PRĂBUȘIRE' : 'CRASH'}
              </p>
              <div className="text-4xl sm:text-5xl font-black text-white font-mono mt-1 drop-shadow-[0_0_20px_rgba(255,0,0,0.8)]">
                x{currentRound.crashPoint.toFixed(2)}
              </div>
            </motion.div>
          ) : (
            <div className="text-center">
              <div
                className={`font-black font-mono transition-all drop-shadow-[0_0_25px_rgba(255,200,0,0.8)] ${
                  currentMultiplier > 10
                    ? 'text-5xl sm:text-7xl text-orange-400 scale-110'
                    : currentMultiplier > 5
                    ? 'text-4xl sm:text-6xl text-amber-300'
                    : 'text-4xl sm:text-5xl text-white'
                }`}
              >
                x{currentMultiplier.toFixed(2)}
              </div>
              {me?.cashedOutAt == null && (
                <p className="text-xs text-amber-300 font-bold mt-1 bg-black/60 px-3 py-0.5 rounded-full inline-block">
                  {isGroapaRound
                    ? language === 'ro'
                      ? 'Dă cash out cât mai târziu!'
                      : 'Cash out as late as possible!'
                    : `+${Number((currentRound.betValue * currentMultiplier).toFixed(1))} ${language === 'ro' ? 'guri acum' : 'sips now'}`}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Flight Control & Auto-Cashout Section */}
      <div className="bg-stone-900/90 border-2 border-amber-500/40 rounded-3xl p-4 shadow-2xl space-y-3">
        {/* Large CASH OUT Button */}
        <div>
          {(me?.cashedOutAt != null || optimisticCashout != null) ? (
            <div className="w-full py-4 bg-emerald-950/80 border-2 border-emerald-500 text-emerald-300 font-black text-lg sm:text-xl rounded-2xl text-center shadow-lg animate-pulse">
              ✅ {language === 'ro' ? 'AI DAT CASH OUT LA' : 'CASHED OUT AT'} x{(me?.cashedOutAt ?? optimisticCashout ?? 1).toFixed(2)}
              {!isGroapaRound && ` (+${me?.score || Number(((currentRound?.betValue || 5) * (me?.cashedOutAt ?? optimisticCashout ?? 1)).toFixed(1))} ${language === 'ro' ? 'guri' : 'sips'})`}
            </div>
          ) : isFlying ? (
            <button
              onClick={() => handleCashout()}
              className="w-full py-5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-stone-950 font-black text-xl sm:text-2xl tracking-wider rounded-2xl shadow-[0_0_30px_rgba(255,215,0,0.6)] border-2 border-white font-cinzel active:scale-95 transition-transform cursor-pointer"
            >
              {isGroapaRound
                ? `💰 CASH OUT (x${currentMultiplier.toFixed(2)})`
                : `💰 CASH OUT (+${Number((currentRound.betValue * currentMultiplier).toFixed(1))} ${language === 'ro' ? 'GURI' : 'SIPS'})`}
            </button>
          ) : isPrep ? (
            <div className="w-full py-4 bg-stone-800/80 border border-stone-600 text-stone-400 font-bold text-center rounded-2xl">
              ⏳ {language === 'ro' ? `Dragonul decolează în ${prepCountdown}s...` : `Dragon taking off in ${prepCountdown}s...`}
            </div>
          ) : (
            <button
              onClick={() => resolveCrashRound(roomCode)}
              className="w-full py-4 bg-red-950/80 hover:bg-red-900/80 border-2 border-red-500/80 text-red-200 font-bold text-center rounded-2xl transition-colors cursor-pointer shadow-lg active:scale-98"
            >
              💥 {language === 'ro' ? 'Rundă încheiată — Se decontează...' : 'Round ended — Settling...'}
            </button>
          )}
        </div>

        {/* Auto Cashout Controls */}
        <div className="pt-2 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Toggle Switch */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleAutoCashout}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                autoCashout ? 'bg-amber-500 justify-end' : 'bg-stone-700 justify-start'
              }`}
            >
              <div className="bg-white w-4 h-4 rounded-full shadow-md" />
            </button>
            <span className="text-xs font-bold text-stone-300">
              {language === 'ro' ? 'Auto Cash Out' : 'Auto Cash Out'}
            </span>
          </div>

          {/* Target Multiplier Adjuster */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-400 font-medium">
              {language === 'ro' ? 'Țintă:' : 'Target:'}
            </span>
            <button
              onClick={() => handleUpdateTargetMultiplier(autoTargetInput - 0.2)}
              className="w-8 h-8 rounded-lg bg-stone-800 hover:bg-stone-700 border border-stone-600 font-bold text-white flex items-center justify-center text-base active:scale-95"
            >
              -
            </button>
            <span className="text-sm font-black text-amber-400 font-mono min-w-[55px] text-center bg-black/60 px-2 py-1 rounded-lg border border-amber-500/30">
              x{autoTargetInput.toFixed(2)}
            </span>
            <button
              onClick={() => handleUpdateTargetMultiplier(autoTargetInput + 0.2)}
              className="w-8 h-8 rounded-lg bg-stone-800 hover:bg-stone-700 border border-stone-600 font-bold text-white flex items-center justify-center text-base active:scale-95"
            >
              +
            </button>

            {/* Quick Multiplier Pills */}
            <div className="hidden sm:flex gap-1 ml-2">
              {[1.5, 2.0, 3.0, 5.0].map(val => (
                <button
                  key={val}
                  onClick={() => handleUpdateTargetMultiplier(val)}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold border transition-colors ${
                    autoTargetInput === val
                      ? 'bg-amber-500/30 border-amber-400 text-amber-300'
                      : 'bg-stone-800/80 border-stone-700 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  x{val.toFixed(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* --- 3. ROUND RESOLUTION MODAL --- */}
      <AnimatePresence>
        {isResolved && roomState.status !== 'finished' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-stone-900 border-2 border-amber-500/60 rounded-3xl p-6 max-w-md w-full shadow-2xl text-center space-y-4"
            >
              <div className="text-3xl">{isGroapaRound ? '🕳️' : '⚖️'}</div>
              <h3 className="text-xl font-black text-amber-400 font-cinzel">
                {language === 'ro'
                  ? `DECONTAREA RUNDEI ${currentRound.roundNumber}`
                  : `ROUND ${currentRound.roundNumber} SETTLEMENT`}
              </h3>

              <div className="bg-stone-950/80 rounded-2xl p-4 border border-stone-800 space-y-3 text-xs">
                <div className="flex justify-between items-center text-stone-400 pb-2 border-b border-stone-800">
                  <span>{language === 'ro' ? 'Miza rundei' : 'Round stake'}:</span>
                  <span className="font-bold text-amber-400 text-sm">
                    {isGroapaRound
                      ? '🕳️ 1 GROAPĂ'
                      : `${currentRound.betValue} guri`}
                  </span>
                </div>

                {/* Score / Cashout Comparison Grid */}
                <div className={`grid gap-2 text-center ${roomState.players.length <= 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
                  {roomState.players.map((p) => {
                    let isWinner = false;
                    if (isGroapaRound) {
                      const maxMult = Math.max(...roomState.players.map(x => x.cashedOutAt || 0));
                      isWinner = (p.cashedOutAt || 0) === maxMult && maxMult > 0;
                    } else {
                      const maxScore = Math.max(...roomState.players.map(x => x.score || 0));
                      isWinner = (p.score || 0) === maxScore && maxScore > 0;
                    }

                    return (
                      <div
                        key={p.id}
                        className={`p-2.5 rounded-xl border ${
                          isWinner
                            ? 'bg-amber-950/60 border-amber-400 ring-1 ring-amber-400/40'
                            : 'bg-stone-900 border-stone-700'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1">
                          {isWinner && <span>👑</span>}
                          <p className="text-[11px] font-bold text-amber-200 truncate">{p.name}</p>
                        </div>
                        <p className="text-xs text-stone-400">
                          {p.cashedOutAt != null ? `x${p.cashedOutAt.toFixed(2)}` : '💥 Prăbușit'}
                        </p>
                        <p className="text-base font-black text-amber-400 mt-0.5">
                          {isGroapaRound
                            ? isWinner
                              ? '🏆 Salvat'
                              : '💀 Groapă'
                            : `${p.score || 0} pct`}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Drinking Decree for each player */}
                <div className="p-3 bg-red-950/50 border border-red-500/40 rounded-xl text-left space-y-2">
                  {(() => {
                    const allCrashed = roomState.players.every(x => x.cashedOutAt == null);

                    if (isGroapaRound) {
                      if (allCrashed) {
                        return (
                          <div className="text-center space-y-1 py-1">
                            <p className="text-xs font-black text-red-300 uppercase">
                              💥 {language === 'ro' ? 'TOȚI AȚI DAT CRASH!' : 'EVERYONE CRASHED!'}
                            </p>
                            <p className="text-xs font-bold text-amber-300">
                              🕳️ {language === 'ro' ? 'Toți beți câte o GROAPĂ! (+25 guri la total)' : 'Everyone chugs 1 GROAPĂ! (+25 sips)'}
                            </p>
                          </div>
                        );
                      }

                      const maxMult = Math.max(...roomState.players.map(x => x.cashedOutAt || 0));
                      // Sort by cashout multiplier desc
                      const sortedPlayers = [...roomState.players].sort((a, b) => (b.cashedOutAt || 0) - (a.cashedOutAt || 0));

                      return (
                        <div className="space-y-1.5">
                          <p className="text-[10px] uppercase font-bold text-amber-300 border-b border-red-900/50 pb-1">
                            {language === 'ro' ? '⚖️ Penalizări Runda Groapă:' : '⚖️ Groapă Round Penalties:'}
                          </p>
                          {sortedPlayers.map((p) => {
                            const isMe = p.id === localPlayer.id;
                            const isWinner = (p.cashedOutAt || 0) === maxMult && maxMult > 0;

                            if (isWinner) {
                              return (
                                <div key={p.id} className="text-xs font-bold text-emerald-300 flex items-center justify-between bg-emerald-950/40 p-1.5 rounded-lg border border-emerald-500/30">
                                  <span className="truncate">👑 {p.name} {isMe && '(Tu)'}:</span>
                                  <span className="text-emerald-400 font-black flex-shrink-0 ml-1">0 gropi (Câștigător)</span>
                                </div>
                              );
                            }

                            return (
                              <div key={p.id} className="text-xs font-bold text-red-300 flex items-center justify-between bg-red-950/30 p-1.5 rounded-lg border border-red-900/40">
                                <span className="truncate">🕳️ {p.name} {isMe && '(Tu)'}:</span>
                                <span className="text-white font-black flex-shrink-0 ml-1">1 GROAPĂ (+25 guri)</span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    }

                    // GURI ROUND
                    if (allCrashed) {
                      const stake = Math.round(currentRound.betValue || 1);
                      return (
                        <div className="text-center space-y-1 py-1">
                          <p className="text-xs font-black text-red-300 uppercase">
                            💥 {language === 'ro' ? 'TOȚI AȚI DAT CRASH!' : 'EVERYONE CRASHED!'}
                          </p>
                          <p className="text-xs font-bold text-amber-300">
                            🍺 {language === 'ro' ? 'Toți beți miza rundei de' : 'Everyone drinks round stake:'} <strong className="text-white">{stake} guri</strong>!
                          </p>
                        </div>
                      );
                    }

                    const maxScore = Math.max(...roomState.players.map(x => x.score || 0));
                    const allEqual = roomState.players.every(x => (x.score || 0) === maxScore);

                    if (allEqual) {
                      return (
                        <p className="text-xs font-bold text-amber-300 text-center py-1">
                          🤝 {language === 'ro' ? 'Scoruri egale! Nimeni nu bea în această rundă.' : 'Tied scores! Nobody drinks this round.'}
                        </p>
                      );
                    }

                    // Sort players by score descending
                    const sortedPlayers = [...roomState.players].sort((a, b) => (b.score || 0) - (a.score || 0));

                    return (
                      <div className="space-y-1.5">
                        <p className="text-[10px] uppercase font-bold text-amber-300 border-b border-red-900/50 pb-1 flex justify-between items-center">
                          <span>{language === 'ro' ? '⚖️ Comparație cu Liderul Rundei:' : '⚖️ Sips Decree vs Round Leader:'}</span>
                          <span className="text-emerald-400">Max: {maxScore} pct</span>
                        </p>
                        {sortedPlayers.map((p) => {
                          const diff = Math.max(0, maxScore - (p.score || 0));
                          const sipsRounded = Math.round(diff);
                          const isMe = p.id === localPlayer.id;

                          if (sipsRounded === 0) {
                            return (
                              <div key={p.id} className="text-xs font-bold text-emerald-300 flex items-center justify-between bg-emerald-950/40 p-1.5 rounded-lg border border-emerald-500/30">
                                <span className="truncate">👑 {p.name} {isMe && '(Tu)'}:</span>
                                <span className="text-emerald-400 font-black flex-shrink-0 ml-1">0 guri (Lider - {p.score || 0} pct)</span>
                              </div>
                            );
                          }

                          return (
                            <div key={p.id} className="text-xs font-bold text-red-300 flex items-center justify-between bg-red-950/30 p-1.5 rounded-lg border border-red-900/40">
                              <span className="truncate">🍺 {p.name} {isMe && '(Tu)'}:</span>
                              <span className="text-white font-black flex-shrink-0 ml-1">
                                {sipsRounded} guri <span className="text-[10px] text-stone-400 font-normal">(-{diff.toFixed(1)} pct)</span>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Next Round Button (Host only or info for guest) */}
              {isHost ? (
                <button
                  onClick={handleNextRound}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-stone-950 font-black text-base rounded-2xl shadow-xl font-cinzel transition-transform active:scale-95"
                >
                  🚀 {language === 'ro' ? 'RUNDA URMĂTOARE' : 'NEXT ROUND'}
                </button>
              ) : (
                <p className="text-xs text-amber-300 animate-pulse">
                  {language === 'ro' ? 'Așteaptă ca Host-ul să pornească runda...' : 'Waiting for host...'}
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- 4. EASTER EGG „PUIUL" 🐔 MODAL --- */}
      <AnimatePresence>
        {showChickenModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDismissChickenModal}
            className="fixed inset-0 z-50 bg-yellow-950/95 backdrop-blur-lg flex items-center justify-center p-6 cursor-pointer"
          >
            <motion.div
              initial={{ scale: 0.5, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0.8 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-black/90 border-4 border-yellow-400 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-5 shadow-[0_0_60px_rgba(255,215,0,0.8)]"
            >
              <div className="text-7xl animate-bounce">🐔</div>

              <div className="space-y-2">
                <p className="text-sm uppercase tracking-widest text-yellow-400 font-bold">
                  {chickenPlayerName}
                </p>
                <h2 className="text-2xl sm:text-3xl font-black text-yellow-300 font-cinzel tracking-wider drop-shadow-[0_0_20px_rgba(255,200,0,0.8)]">
                  {language === 'ro' ? '„EȘTI O PIZDĂ"' : '„YOU ARE A CHICKEN"'}
                </h2>
                <p className="text-xs sm:text-sm text-stone-300">
                  {language === 'ro'
                    ? 'Ai dat cashout sub x1.50 de 3 ori la rând din frică!'
                    : 'You cashed out under x1.50 three times in a row out of fear!'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleDismissChickenModal}
                className="w-full py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-black font-cinzel text-sm rounded-xl shadow-lg transition-transform active:scale-95 uppercase"
              >
                {language === 'ro' ? 'Am înțeles (Continuă)' : 'Got it (Continue)'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- 5. MATCH FINISHED / VICTORY & PODIUM SCREEN (2-6 PLAYERS) --- */}
      <AnimatePresence>
        {roomState.status === 'finished' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.8, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-stone-900 border-2 border-amber-400 rounded-3xl p-5 sm:p-7 max-w-lg w-full shadow-2xl text-center space-y-4 my-auto"
            >
              <div className="text-5xl">
                {roomState.winnerId === localPlayer.id ? '👑' : '💀'}
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl sm:text-3xl font-black text-amber-400 font-cinzel">
                  {roomState.winnerId === localPlayer.id
                    ? language === 'ro'
                      ? 'VICTORIE ÎN CHILIE!'
                      : 'VICTORY IN THE LAIR!'
                    : language === 'ro'
                    ? 'AI FOST DOBORÂT!'
                    : 'DEFEATED!'}
                </h2>
                <p className="text-xs text-stone-300">
                  {language === 'ro'
                    ? 'Meciul s-a încheiat! Unul dintre călugări a atins pragul limită de băutură.'
                    : 'Match finished! A player reached the match drinking limit.'}
                </p>
              </div>

              {/* Full Standings Podium (All 2-6 Players) */}
              <div className="bg-stone-950 p-3 sm:p-4 rounded-2xl border border-stone-800 space-y-2 text-left">
                <p className="text-xs font-cinzel font-bold text-amber-300 uppercase tracking-wider pb-1 border-b border-stone-800 flex justify-between items-center">
                  <span>🏆 {language === 'ro' ? 'Clasament Final (Podium):' : 'Final Standings Podium:'}</span>
                  <span className="text-[10px] text-stone-400 font-normal">{roomState.players.length} {language === 'ro' ? 'jucători' : 'players'}</span>
                </p>

                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-0.5">
                  {(() => {
                    // Sort players by total drinks ascending (least drinks = rank 1)
                    const ranked = [...roomState.players].sort((a, b) => {
                      const totalA = (a.totalGuriAcumulate || 0) + (a.totalGroapaAcumulate || 0) * 25;
                      const totalB = (b.totalGuriAcumulate || 0) + (b.totalGroapaAcumulate || 0) * 25;
                      return totalA - totalB;
                    });

                    return ranked.map((p, idx) => {
                      const isMe = p.id === localPlayer.id;
                      const rank = idx + 1;
                      const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
                      const isWinner = p.id === roomState.winnerId || rank === 1;
                      const isLoser = p.id === roomState.loserId || rank === ranked.length;

                      return (
                        <div
                          key={p.id}
                          className={`p-2 sm:p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                            isWinner
                              ? 'bg-amber-950/60 border-amber-400 ring-1 ring-amber-400/40'
                              : isLoser
                              ? 'bg-red-950/50 border-red-500/60'
                              : isMe
                              ? 'bg-stone-900 border-amber-500/50'
                              : 'bg-stone-900/80 border-stone-800'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-base font-black w-6 text-center">{medal}</span>
                            <AvatarDisplay avatarId={p.avatarIcon || 'monk_drunk'} size={32} />
                            <div className="truncate">
                              <p className="text-xs font-bold text-amber-200 truncate">
                                {p.name} {isMe && '(Tu)'}
                              </p>
                              <span className="text-[10px] text-stone-400">
                                {isWinner
                                  ? '🏆 Campion'
                                  : isLoser
                                  ? '💀 Eliminat'
                                  : '🛡️ Supraviețuitor'}
                              </span>
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <span className="text-sm font-black text-red-400 block">
                              {p.totalGuriAcumulate || 0} 🍺
                            </span>
                            {(p.totalGroapaAcumulate || 0) > 0 && (
                              <span className="text-[10px] font-bold text-amber-300 block">
                                {p.totalGroapaAcumulate} 🕳️
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Rematch & Main Menu Actions */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={handleExit}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-stone-950 font-black text-base rounded-2xl shadow-xl font-cinzel transition-transform active:scale-95"
                >
                  🏛️ {language === 'ro' ? 'MENIU PRINCIPAL' : 'MAIN MENU'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tavern Quick Emotes & Sound FX Overlay */}
      <TavernEmotesOverlay
        lastEmote={roomState?.lastEmote}
        onSendEmote={(emote) => sendCrashEmote(roomCode, emote)}
        localPlayer={localPlayer}
      />
    </div>
  );
};
