import { useState, useEffect, useRef, useCallback } from 'react';
import { DuelRoomState, DuelPlayerInfo, DuelSubmode, DuelDifficulty } from '../types';

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
  startGame: () => void;
  skipReveal: () => void;
  submitAnswer: (optionIndex: number) => void;
  nextRound: () => void;
  startDrinkTimer: () => void;
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

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const savedRoomCodeRef = useRef<string | null>(null);

  const getWsUrl = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}`;
  };

  const connectSocket = useCallback((onOpenCallback?: (socket: WebSocket) => void) => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      if (wsRef.current.readyState === WebSocket.OPEN && onOpenCallback) {
        onOpenCallback(wsRef.current);
      }
      return;
    }

    setIsConnecting(true);
    const wsUrl = getWsUrl();
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setIsConnecting(false);
      setErrorMessage(null);

      // Check if we need to reconnect to an existing room
      const savedCode = savedRoomCodeRef.current || sessionStorage.getItem('duel_room_code');
      const savedPId = playerId || sessionStorage.getItem('duel_player_id');
      if (savedCode && savedPId) {
        ws.send(JSON.stringify({ type: 'reconnect', roomCode: savedCode, playerId: savedPId }));
      }

      if (onOpenCallback) {
        onOpenCallback(ws);
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'room_created') {
          setRoom(data.room);
          setPlayerId(data.playerId);
          savedRoomCodeRef.current = data.room.code;
          sessionStorage.setItem('duel_room_code', data.room.code);
          sessionStorage.setItem('duel_player_id', data.playerId);
        } else if (data.room) {
          setRoom(data.room);
        } else if (data.type === 'error') {
          setErrorMessage(data.message || 'A apărut o eroare.');
        }
      } catch (e) {
        console.error('Error parsing WS message:', e);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      setIsConnecting(false);
      // Auto-reconnect if we were in an active room
      if (savedRoomCodeRef.current) {
        reconnectTimeoutRef.current = setTimeout(() => {
          connectSocket();
        }, 2000);
      }
    };

    ws.onerror = (err) => {
      console.warn('WS Error:', err);
      setIsConnecting(false);
    };
  }, [playerId]);

  const send = useCallback((payload: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    } else {
      connectSocket((socket) => {
        socket.send(JSON.stringify(payload));
      });
    }
  }, [connectSocket]);

  const createRoom = useCallback((
    hostPlayer: { id: string; name: string; avatarIcon: string; color: string },
    submode: DuelSubmode,
    difficulty: DuelDifficulty,
    targetPoints: number = 30
  ) => {
    setPlayerId(hostPlayer.id);
    sessionStorage.setItem('duel_player_id', hostPlayer.id);
    send({
      type: 'create_room',
      hostPlayer,
      submode,
      difficulty,
      targetPoints,
    });
  }, [send]);

  const joinRoom = useCallback((
    roomCode: string,
    guestPlayer: { id: string; name: string; avatarIcon: string; color: string }
  ) => {
    const formattedCode = roomCode.toUpperCase().trim();
    setPlayerId(guestPlayer.id);
    savedRoomCodeRef.current = formattedCode;
    sessionStorage.setItem('duel_room_code', formattedCode);
    sessionStorage.setItem('duel_player_id', guestPlayer.id);

    send({
      type: 'join_room',
      roomCode: formattedCode,
      guestPlayer,
    });
  }, [send]);

  const startGame = useCallback(() => {
    if (!room || !playerId) return;
    send({
      type: 'start_game',
      roomCode: room.code,
      playerId,
    });
  }, [room, playerId, send]);

  const skipReveal = useCallback(() => {
    if (!room || !playerId) return;
    send({
      type: 'skip_reveal',
      roomCode: room.code,
      playerId,
    });
  }, [room, playerId, send]);

  const submitAnswer = useCallback((optionIndex: number) => {
    if (!room || !playerId) return;
    send({
      type: 'submit_answer',
      roomCode: room.code,
      playerId,
      optionIndex,
    });
  }, [room, playerId, send]);

  const nextRound = useCallback(() => {
    if (!room) return;
    send({
      type: 'next_round',
      roomCode: room.code,
    });
  }, [room, send]);

  const startDrinkTimer = useCallback(() => {
    if (!room || !playerId) return;
    send({
      type: 'start_drink_timer',
      roomCode: room.code,
      playerId,
    });
  }, [room, playerId, send]);

  const endGame = useCallback(() => {
    if (!room) return;
    send({
      type: 'end_game',
      roomCode: room.code,
    });
  }, [room, send]);

  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    savedRoomCodeRef.current = null;
    sessionStorage.removeItem('duel_room_code');
    sessionStorage.removeItem('duel_player_id');
    setRoom(null);
    setIsConnected(false);
  }, []);

  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, []);

  return {
    room,
    playerId,
    isConnected,
    isConnecting,
    errorMessage,
    createRoom,
    joinRoom,
    startGame,
    skipReveal,
    submitAnswer,
    nextRound,
    startDrinkTimer,
    endGame,
    clearError,
    disconnect,
  };
}
