import { useState, useEffect, useRef, useCallback } from 'react';
import { CasinoBet, CasinoRoomState } from '../types';
import {
  createCasinoRoom,
  joinCasinoRoom,
  addBotToCasinoRoom,
  removePlayerFromCasinoLobby,
  startCasinoGame,
  placeCasinoBets,
  lockCasinoBets,
  triggerBettingTimeout,
  resolveCasinoRound,
  nextCasinoRound,
  endCasinoGame,
  subscribeToCasinoRoom,
} from '../lib/casinoFirestoreService';
import { syncServerClock } from '../lib/duelFirestoreService';

export interface UseCasinoSocketReturn {
  room: CasinoRoomState | null;
  playerId: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  errorMessage: string | null;
  createRoom: (
    hostPlayer: { id: string; name: string; avatarIcon: string; color: string },
    startingChips: number
  ) => void;
  joinRoom: (
    roomCode: string,
    guestPlayer: { id: string; name: string; avatarIcon: string; color: string }
  ) => void;
  addBot: () => void;
  removePlayer: (playerId: string) => void;
  startGame: () => void;
  placeBets: (bets: CasinoBet[], lockImmediately?: boolean) => void;
  lockBets: () => void;
  nextRound: () => void;
  endGame: () => void;
  clearError: () => void;
  disconnect: () => void;
}

export function useCasinoSocket(): UseCasinoSocketReturn {
  const [room, setRoom] = useState<CasinoRoomState | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(() => {
    return sessionStorage.getItem('casino_player_id') || null;
  });
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const unsubscribeRef = useRef<(() => void) | null>(null);
  const activeRoomCodeRef = useRef<string | null>(null);
  const rollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const botBetsPlacedRef = useRef<Record<string, number>>({}); // botId -> roundNumber

  useEffect(() => {
    syncServerClock().catch(() => {});
  }, []);

  const stopListening = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    if (rollingTimeoutRef.current) {
      clearTimeout(rollingTimeoutRef.current);
      rollingTimeoutRef.current = null;
    }
  }, []);

  const startListening = useCallback(
    (roomCode: string) => {
      stopListening();
      setIsConnecting(true);
      setErrorMessage(null);
      activeRoomCodeRef.current = roomCode;

      const unsub = subscribeToCasinoRoom(
        roomCode,
        (updatedRoom) => {
          setIsConnecting(false);
          if (updatedRoom) {
            setRoom(updatedRoom);
            setIsConnected(true);
          } else {
            setIsConnected(false);
            setErrorMessage('Camera de cazino a fost închisă sau nu există.');
          }
        },
        (error) => {
          setIsConnecting(false);
          setIsConnected(false);
          setErrorMessage(error?.message || 'Eroare la conectarea la camera de Cazino.');
        }
      );

      unsubscribeRef.current = unsub;
    },
    [stopListening]
  );

  // Resume subscription on page refresh
  useEffect(() => {
    const savedCode = sessionStorage.getItem('casino_room_code');
    const savedPId = sessionStorage.getItem('casino_player_id');
    if (savedCode && savedPId && !unsubscribeRef.current) {
      startListening(savedCode);
    }
  }, [startListening]);

  // Network auto-reconnect
  useEffect(() => {
    const handleOnline = () => {
      syncServerClock().catch(() => {});
      const activeCode = activeRoomCodeRef.current || sessionStorage.getItem('casino_room_code');
      if (activeCode) {
        startListening(activeCode);
      }
    };

    const handleOffline = () => {
      setIsConnected(false);
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        const activeCode = activeRoomCodeRef.current || sessionStorage.getItem('casino_room_code');
        if (activeCode && !isConnected) {
          syncServerClock().catch(() => {});
          startListening(activeCode);
        }
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isConnected, startListening]);

  // Host-authoritative actions:
  // 1. Resolve rolling phase after 3.2s
  // 2. Automated betting timeout if 25s expires
  // 3. AI Bot bet simulator
  useEffect(() => {
    if (!room || !playerId) return;
    const isHost = room.hostPlayerId === playerId;

    // Handle rolling phase transition to resolved
    if (room.status === 'in_game' && room.round.phase === 'rolling' && isHost) {
      if (!rollingTimeoutRef.current) {
        rollingTimeoutRef.current = setTimeout(() => {
          resolveCasinoRound(room.code).catch(console.error);
          rollingTimeoutRef.current = null;
        }, 3200);
      }
    } else if (room.round.phase !== 'rolling' && rollingTimeoutRef.current) {
      clearTimeout(rollingTimeoutRef.current);
      rollingTimeoutRef.current = null;
    }

    // Bot bet simulator (Host executes bot bets)
    if (isHost && room.status === 'in_game' && room.round.phase === 'betting') {
      const activeBots = room.players.filter((p) => p.isBot && !p.eliminated);
      activeBots.forEach((bot) => {
        const key = `${bot.id}_${room.currentRound}`;
        if (botBetsPlacedRef.current[key]) return;

        // Bot places a bet after a short realistic delay (1.5s - 3s)
        const delay = 1500 + Math.random() * 1500;
        setTimeout(() => {
          if (!activeRoomCodeRef.current) return;
          botBetsPlacedRef.current[key] = Date.now();

          // Generate sensible bot bets: 10% - 30% of available balance
          const maxBetBudget = Math.min(bot.balance, Math.max(10, Math.floor(bot.balance * (0.15 + Math.random() * 0.2))));
          if (maxBetBudget <= 0) return;

          const betTypes: Array<'over7' | 'under7' | 'even' | 'odd' | 'number'> = ['over7', 'under7', 'even', 'odd', 'number'];
          const chosenType = betTypes[Math.floor(Math.random() * betTypes.length)];
          const numberVal = chosenType === 'number' ? Math.floor(Math.random() * 6) + 1 : undefined;

          const botBets: CasinoBet[] = [
            {
              playerId: bot.id,
              type: chosenType,
              numberValue: numberVal,
              amount: maxBetBudget,
            },
          ];

          placeCasinoBets(room.code, bot.id, botBets, true).catch(() => {});
        }, delay);
      });
    }
  }, [room, playerId]);

  const createRoom = useCallback(
    async (
      hostPlayer: { id: string; name: string; avatarIcon: string; color: string },
      startingChips: number
    ) => {
      try {
        setIsConnecting(true);
        setErrorMessage(null);
        setPlayerId(hostPlayer.id);
        sessionStorage.setItem('casino_player_id', hostPlayer.id);

        const code = await createCasinoRoom(hostPlayer, startingChips);
        sessionStorage.setItem('casino_room_code', code);
        activeRoomCodeRef.current = code;
        startListening(code);
      } catch (err: any) {
        setIsConnecting(false);
        setErrorMessage(err.message || 'Eroare la crearea camerei Cazino.');
      }
    },
    [startListening]
  );

  const joinRoom = useCallback(
    async (
      roomCode: string,
      guestPlayer: { id: string; name: string; avatarIcon: string; color: string }
    ) => {
      try {
        setIsConnecting(true);
        setErrorMessage(null);
        setPlayerId(guestPlayer.id);
        sessionStorage.setItem('casino_player_id', guestPlayer.id);

        const cleanCode = roomCode.trim().toUpperCase();
        await joinCasinoRoom(cleanCode, guestPlayer);
        sessionStorage.setItem('casino_room_code', cleanCode);
        activeRoomCodeRef.current = cleanCode;
        startListening(cleanCode);
      } catch (err: any) {
        setIsConnecting(false);
        setErrorMessage(err.message || 'Eroare la intrarea în camera Cazino.');
      }
    },
    [startListening]
  );

  const addBot = useCallback(() => {
    if (!room) return;
    addBotToCasinoRoom(room.code).catch((err) => {
      setErrorMessage(err.message);
    });
  }, [room]);

  const removePlayer = useCallback(
    (targetPlayerId: string) => {
      if (!room) return;
      removePlayerFromCasinoLobby(room.code, targetPlayerId).catch((err) => {
        setErrorMessage(err.message);
      });
    },
    [room]
  );

  const startGame = useCallback(() => {
    if (!room) return;
    startCasinoGame(room.code).catch((err) => {
      setErrorMessage(err.message);
    });
  }, [room]);

  const placeBets = useCallback(
    (bets: CasinoBet[], lockImmediately: boolean = false) => {
      if (!room || !playerId) return;
      placeCasinoBets(room.code, playerId, bets, lockImmediately).catch((err) => {
        setErrorMessage(err.message);
      });
    },
    [room, playerId]
  );

  const lockBets = useCallback(() => {
    if (!room || !playerId) return;
    lockCasinoBets(room.code, playerId).catch((err) => {
      setErrorMessage(err.message);
    });
  }, [room, playerId]);

  const nextRound = useCallback(() => {
    if (!room) return;
    nextCasinoRound(room.code).catch((err) => {
      setErrorMessage(err.message);
    });
  }, [room]);

  const endGame = useCallback(() => {
    if (!room) return;
    endCasinoGame(room.code).catch((err) => {
      setErrorMessage(err.message);
    });
  }, [room]);

  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  const disconnect = useCallback(() => {
    stopListening();
    sessionStorage.removeItem('casino_room_code');
    sessionStorage.removeItem('casino_player_id');
    setRoom(null);
    setPlayerId(null);
    setIsConnected(false);
    setIsConnecting(false);
    setErrorMessage(null);
    activeRoomCodeRef.current = null;
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
    removePlayer,
    startGame,
    placeBets,
    lockBets,
    nextRound,
    endGame,
    clearError,
    disconnect,
  };
}
