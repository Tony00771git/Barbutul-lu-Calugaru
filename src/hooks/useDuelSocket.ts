import { useState, useEffect, useRef, useCallback } from 'react';
import { DuelRoomState, DuelSubmode, DuelDifficulty, DuelPlayerInfo, TavernEmoteMessage } from '../types';
import {
  createDuelRoom,
  joinDuelRoom,
  addBotToDuelRoom,
  startDuelGame,
  skipDuelReveal,
  submitDuelAnswer,
  startDuelDrinkTimer,
  nextDuelRound,
  endDuelGame,
  sendDuelEmote,
  subscribeToDuelRoom,
  syncServerClock,
  getSyncedServerNow,
} from '../lib/duelFirestoreService';
import { getDuelQuestionPool } from '../data/duelQuestions';
import { saveActiveSession, clearActiveSession, getActiveSession } from '../lib/sessionManager';
import { reconnectionService } from '../lib/reconnectionService';

export interface UseDuelSocketReturn {
  room: DuelRoomState | null;
  playerId: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  errorMessage: string | null;
  createRoom: (
    hostPlayer: { id: string; name: string; avatarIcon: string; color: string },
    submode: DuelSubmode,
    difficulty: DuelDifficulty,
    targetPoints?: number
  ) => void;
  joinRoom: (roomCode: string, guestPlayer: { id: string; name: string; avatarIcon: string; color: string }) => void;
  addBot: () => void;
  startGame: () => void;
  skipReveal: () => void;
  submitAnswer: (optionIndex: number) => void;
  nextRound: () => void;
  startDrinkTimer: () => void;
  sendEmote: (emote: TavernEmoteMessage) => Promise<void>;
  endGame: () => void;
  clearError: () => void;
  disconnect: () => void;
}

export function useDuelSocket(): UseDuelSocketReturn {
  const [room, setRoom] = useState<DuelRoomState | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(() => {
    return sessionStorage.getItem('duel_player_id') || null;
  });
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const unsubscribeRef = useRef<(() => void) | null>(null);
  const activeRoomCodeRef = useRef<string | null>(null);
  const botTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Synchronize device clock with server on mount
  useEffect(() => {
    syncServerClock().catch(() => {});
  }, []);

  // Clean up existing Firestore listener
  const stopListening = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    if (botTimeoutRef.current) {
      clearTimeout(botTimeoutRef.current);
      botTimeoutRef.current = null;
    }
  }, []);

  // Start listening to a Firestore room document
  const startListening = useCallback(
    (roomCode: string): Promise<boolean> => {
      return new Promise((resolve) => {
        stopListening();
        setIsConnecting(true);
        setErrorMessage(null);
        activeRoomCodeRef.current = roomCode;

        let hasResolved = false;
        const unsub = subscribeToDuelRoom(
          roomCode,
          (updatedRoom) => {
            setIsConnecting(false);
            if (updatedRoom) {
              setRoom(updatedRoom);
              setIsConnected(true);
              if (updatedRoom.status === 'finished') {
                clearActiveSession();
                reconnectionService.cancelAndExit();
              } else {
                reconnectionService.notifyConnected('duel', updatedRoom.code);
              }
              if (!hasResolved) {
                hasResolved = true;
                resolve(true);
              }
            } else {
              setIsConnected(false);
              clearActiveSession();
              reconnectionService.cancelAndExit();
              if (!hasResolved) {
                hasResolved = true;
                resolve(false);
              }
            }
          },
          (error) => {
            setIsConnecting(false);
            setIsConnected(false);
            if (getActiveSession()) {
              reconnectionService.notifyDisconnected('duel', error.message || 'Eroare Firestore');
            }
            if (!hasResolved) {
              hasResolved = true;
              resolve(false);
            }
          }
        );

        unsubscribeRef.current = unsub;
      });
    },
    [stopListening]
  );

  // Register reconnection handler with the global reconnection service
  useEffect(() => {
    const unregister = reconnectionService.registerHandler('duel', async (session) => {
      console.log('[Duel] AutoReconnectionHandler triggered for session:', session.roomCode);
      const ok = await startListening(session.roomCode);
      return ok;
    });
    return unregister;
  }, [startListening]);

  // Resume subscription on page refresh if saved in sessionStorage
  useEffect(() => {
    const savedCode = sessionStorage.getItem('duel_room_code');
    const savedPId = sessionStorage.getItem('duel_player_id');
    if (savedCode && savedPId && !unsubscribeRef.current) {
      startListening(savedCode);
    }
  }, [startListening]);

  // Mobile Network auto-reconnection on network state changes (online/offline & visibility)
  useEffect(() => {
    const handleOnline = () => {
      console.log('[Duel] Dispozitivul este din nou ONLINE. Se încearcă reconectarea...');
      syncServerClock().catch(() => {});
      const activeCode = activeRoomCodeRef.current || sessionStorage.getItem('duel_room_code');
      if (activeCode) {
        startListening(activeCode);
      }
    };

    const handleOffline = () => {
      console.warn('[Duel] Dispozitivul a pierdut conexiunea la internet (OFFLINE).');
      setIsConnected(false);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const activeCode = activeRoomCodeRef.current || sessionStorage.getItem('duel_room_code');
        if (activeCode && !isConnected) {
          syncServerClock().catch(() => {});
          startListening(activeCode);
        }
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isConnected, startListening]);

  // Host bot automation coordinator
  useEffect(() => {
    if (!room || room.guestPlayer?.id !== 'bot_onufrie') return;
    const isHost = room.hostPlayer.id === playerId;
    if (!isHost) return;

    if (botTimeoutRef.current) {
      clearTimeout(botTimeoutRef.current);
      botTimeoutRef.current = null;
    }

    const currentServerNow = getSyncedServerNow();
    const isRevealed =
      room.phase === 'race' || (room.phase === 'reveal' && currentServerNow >= (room.revealEndsAt || 0));

    // 1. Bot answers when in game and not locked out
    if (room.status === 'in_game' && room.phase !== 'resolution' && room.lockedOutPlayerId !== 'bot_onufrie') {
      const remainingUntilReveal = isRevealed
        ? 0
        : Math.max(0, (room.revealEndsAt || 0) - currentServerNow);

      const delay =
        remainingUntilReveal +
        (room.lockedOutPlayerId === room.hostPlayer.id
          ? 1200 + Math.random() * 1000 // Faster rebound
          : 2200 + Math.random() * 2000); // Normal race

      botTimeoutRef.current = setTimeout(async () => {
        if (!room.currentQuestion) return;

        // Retrieve current question to determine correct answer
        const pool = getDuelQuestionPool(room.submode, room.difficulty);
        const matched = pool.find((q) => q.id === room.currentQuestion?.id);
        const correctIdx = matched ? matched.correct : 0;

        // 75% accuracy for AI monk
        let chosenOption = correctIdx;
        if (Math.random() > 0.75) {
          const wrongOptions = [0, 1, 2, 3].filter((idx) => idx !== correctIdx);
          chosenOption = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
        }

        try {
          await submitDuelAnswer(room.code, 'bot_onufrie', chosenOption);
        } catch (err: any) {
          console.warn('Bot answer submission error:', err);
        }
      }, delay);
    }

    // 2. Auto-start drinking countdown if bot lost
    if (
      room.status === 'in_game' &&
      room.phase === 'resolution' &&
      room.roundResult &&
      !room.roundResult.drinkCountdownEndsAt &&
      (room.roundResult.winnerId === room.hostPlayer.id || room.roundResult.reason === 'both_wrong')
    ) {
      botTimeoutRef.current = setTimeout(async () => {
        try {
          await startDuelDrinkTimer(room.code);
        } catch (e) {
          console.warn('Bot timer trigger error:', e);
        }
      }, 1200);
    }

    return () => {
      if (botTimeoutRef.current) {
        clearTimeout(botTimeoutRef.current);
      }
    };
  }, [room, playerId]);

  const createRoom = useCallback(
    async (
      hostPlayer: { id: string; name: string; avatarIcon: string; color: string },
      submode: DuelSubmode,
      difficulty: DuelDifficulty,
      targetPoints: number = 30
    ) => {
      try {
        setIsConnecting(true);
        setErrorMessage(null);
        setPlayerId(hostPlayer.id);
        sessionStorage.setItem('duel_player_id', hostPlayer.id);

        const newCode = await createDuelRoom(hostPlayer, submode, difficulty, targetPoints);
        sessionStorage.setItem('duel_room_code', newCode);
        saveActiveSession('duel', newCode, hostPlayer, true, { submode, difficulty, targetPoints });
        startListening(newCode);
      } catch (err: any) {
        setIsConnecting(false);
        setErrorMessage(err.message || 'Eroare la crearea camerei!');
      }
    },
    [startListening]
  );

  const joinRoom = useCallback(
    async (
      roomCode: string,
      guestPlayer: { id: string; name: string; avatarIcon: string; color: string }
    ) => {
      const formattedCode = roomCode.toUpperCase().trim();
      try {
        setIsConnecting(true);
        setErrorMessage(null);
        setPlayerId(guestPlayer.id);
        sessionStorage.setItem('duel_player_id', guestPlayer.id);
        sessionStorage.setItem('duel_room_code', formattedCode);
        saveActiveSession('duel', formattedCode, guestPlayer, false);

        await joinDuelRoom(formattedCode, guestPlayer);
        startListening(formattedCode);
      } catch (err: any) {
        setIsConnecting(false);
        setErrorMessage(err.message || 'Eroare la intrarea în cameră!');
      }
    },
    [startListening]
  );

  const addBot = useCallback(async () => {
    if (!room) return;
    try {
      await addBotToDuelRoom(room.code);
    } catch (err: any) {
      setErrorMessage(err.message || 'Eroare la adăugarea botului!');
    }
  }, [room]);

  const startGame = useCallback(async () => {
    if (!room || !playerId) return;
    try {
      await startDuelGame(room.code, playerId);
    } catch (err: any) {
      setErrorMessage(err.message || 'Eroare la pornirea jocului!');
    }
  }, [room, playerId]);

  const skipReveal = useCallback(async () => {
    if (!room || !playerId) return;
    try {
      await skipDuelReveal(room.code);
    } catch (err: any) {
      console.warn('Skip reveal error:', err);
    }
  }, [room, playerId]);

  const submitAnswer = useCallback(
    async (optionIndex: number) => {
      if (!room || !playerId) return;
      try {
        await submitDuelAnswer(room.code, playerId, optionIndex);
      } catch (err: any) {
        console.warn('Submit answer error:', err);
      }
    },
    [room, playerId]
  );

  const nextRound = useCallback(async () => {
    if (!room) return;
    try {
      await nextDuelRound(room.code);
    } catch (err: any) {
      console.warn('Next round error:', err);
    }
  }, [room]);

  const startDrinkTimer = useCallback(async () => {
    if (!room || !playerId) return;
    try {
      await startDuelDrinkTimer(room.code);
    } catch (err: any) {
      console.warn('Start drink timer error:', err);
    }
  }, [room, playerId]);

  const sendEmote = useCallback(
    async (emote: TavernEmoteMessage) => {
      if (!room) return;
      try {
        await sendDuelEmote(room.code, emote);
      } catch (err: any) {
        console.warn('[Duel] Send emote error:', err);
      }
    },
    [room]
  );

  const endGame = useCallback(async () => {
    if (!room) return;
    try {
      await endDuelGame(room.code);
    } catch (err: any) {
      console.warn('End game error:', err);
    }
  }, [room]);

  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  const disconnect = useCallback(() => {
    stopListening();
    activeRoomCodeRef.current = null;
    sessionStorage.removeItem('duel_room_code');
    sessionStorage.removeItem('duel_player_id');
    clearActiveSession();
    reconnectionService.cancelAndExit();
    setRoom(null);
    setIsConnected(false);
    setIsConnecting(false);
    setErrorMessage(null);
  }, [stopListening]);

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    room,
    playerId,
    isConnected,
    isConnecting,
    errorMessage,
    createRoom,
    joinRoom,
    addBot,
    startGame,
    skipReveal,
    submitAnswer,
    nextRound,
    startDrinkTimer,
    sendEmote,
    endGame,
    clearError,
    disconnect,
  };
}
