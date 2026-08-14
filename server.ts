import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { getDuelQuestionPool, shuffleDeck } from './src/data/duelQuestions';
import { DuelDifficulty, DuelQuestion, DuelSubmode } from './src/types';

interface DuelPlayerInfo {
  id: string;
  name: string;
  avatarIcon: string;
  color: string;
  isHost: boolean;
  connected: boolean;
}

interface DuelRoomState {
  code: string;
  submode: DuelSubmode;
  difficulty: DuelDifficulty;
  targetPoints: number;
  hostPlayer: DuelPlayerInfo;
  guestPlayer: DuelPlayerInfo | null;
  status: 'lobby' | 'in_game' | 'finished';
  currentRound: number;
  currentCardIndex: number;
  deck: DuelQuestion[];
  stake: { type: 'sips' | 'chug'; count: number };
  phase: 'reveal' | 'race' | 'resolution';
  revealEndsAt: number; // timestamp in ms
  lockedOutPlayerId: string | null;
  roundResult: {
    winnerId: string | null;
    loserIds: string[];
    stakeType: 'sips' | 'chug';
    stakeAmount: number;
    correctAnswerRo: string;
    correctAnswerEn: string;
    reason: 'first_correct' | 'rebound_correct' | 'both_wrong';
    drinkCountdownEndsAt?: number | null;
    isTargetReached?: boolean;
    targetLoserId?: string | null;
  } | null;
  scores: Record<string, { sipsTotal: number; chugsTotal: number; roundsWon: number; correct: number; wrong: number }>;
}

const rooms = new Map<string, DuelRoomState>();
const playerSockets = new Map<string, WebSocket>(); // playerId -> WebSocket
const socketToPlayer = new Map<WebSocket, { playerId: string; roomCode: string }>();

function generateRoomCode(): string {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  if (rooms.has(code)) {
    return generateRoomCode();
  }
  return code;
}

function calculateStake(difficulty: DuelDifficulty): { type: 'sips' | 'chug'; count: number } {
  if (difficulty === 'easy') {
    return { type: 'sips', count: Math.floor(Math.random() * 2) + 2 }; // 2-3 sips
  } else if (difficulty === 'medium') {
    const isChug = Math.random() < 0.12; // 12% chance of chug
    return isChug ? { type: 'chug', count: 1 } : { type: 'sips', count: Math.floor(Math.random() * 3) + 3 }; // 3-5 sips
  } else {
    // Hard
    const isChug = Math.random() < 0.3; // 30% chance of chug
    return isChug ? { type: 'chug', count: 1 } : { type: 'sips', count: Math.floor(Math.random() * 4) + 5 }; // 5-8 sips
  }
}

function getSanitizedRoom(room: DuelRoomState) {
  const currentQ = room.deck[room.currentCardIndex % room.deck.length];
  // In reveal phase, don't send correct index to prevent tampering, though all questions are for fun
  return {
    code: room.code,
    submode: room.submode,
    difficulty: room.difficulty,
    targetPoints: room.targetPoints,
    hostPlayer: room.hostPlayer,
    guestPlayer: room.guestPlayer,
    status: room.status,
    currentRound: room.currentRound,
    phase: room.phase,
    revealEndsAt: room.revealEndsAt,
    lockedOutPlayerId: room.lockedOutPlayerId,
    roundResult: room.roundResult,
    scores: room.scores,
    stake: room.stake,
    currentQuestion: currentQ
      ? {
          id: currentQ.id,
          q_ro: currentQ.q_ro,
          q_en: currentQ.q_en,
          a_ro: currentQ.a_ro,
          a_en: currentQ.a_en,
          correct: room.phase === 'resolution' ? currentQ.correct : undefined,
        }
      : null,
  };
}

function broadcastToRoom(roomCode: string, payload: any) {
  const room = rooms.get(roomCode);
  if (!room) return;

  const dataStr = JSON.stringify(payload);
  const playerIds = [room.hostPlayer.id, room.guestPlayer?.id].filter(Boolean) as string[];

  playerIds.forEach(pId => {
    const ws = playerSockets.get(pId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(dataStr);
    }
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  const server = http.createServer(app);

  app.use(express.json());

  // Health endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', activeRooms: rooms.size });
  });

  // Query Room API
  app.get('/api/duel/room/:code', (req, res) => {
    const code = req.params.code.toUpperCase();
    const room = rooms.get(code);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    return res.json({
      exists: true,
      code: room.code,
      submode: room.submode,
      difficulty: room.difficulty,
      hostName: room.hostPlayer.name,
      isFull: !!room.guestPlayer,
      status: room.status,
    });
  });

  // WebSocket Server
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws: WebSocket) => {
    // Send ping every 25s
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }, 25000);

    ws.on('message', (rawMessage: string) => {
      try {
        const msg = JSON.parse(rawMessage.toString());
        const { type } = msg;

        if (type === 'create_room') {
          const { hostPlayer, submode = 'general', difficulty = 'easy', targetPoints = 30 } = msg;
          const code = generateRoomCode();
          const deck = shuffleDeck(getDuelQuestionPool(submode, difficulty));
          const stake = calculateStake(difficulty);

          const host: DuelPlayerInfo = {
            id: hostPlayer.id,
            name: hostPlayer.name || 'Jucător 1',
            avatarIcon: hostPlayer.avatarIcon || 'monk_drunk',
            color: hostPlayer.color || '#e8c84a',
            isHost: true,
            connected: true,
          };

          const newRoom: DuelRoomState = {
            code,
            submode,
            difficulty,
            targetPoints: Number(targetPoints) > 0 ? Number(targetPoints) : 30,
            hostPlayer: host,
            guestPlayer: null,
            status: 'lobby',
            currentRound: 1,
            currentCardIndex: 0,
            deck,
            stake,
            phase: 'reveal',
            revealEndsAt: 0,
            lockedOutPlayerId: null,
            roundResult: null,
            scores: {
              [host.id]: { sipsTotal: 0, chugsTotal: 0, roundsWon: 0, correct: 0, wrong: 0 },
            },
          };

          rooms.set(code, newRoom);
          playerSockets.set(host.id, ws);
          socketToPlayer.set(ws, { playerId: host.id, roomCode: code });

          ws.send(
            JSON.stringify({
              type: 'room_created',
              room: getSanitizedRoom(newRoom),
              playerId: host.id,
            })
          );
        } else if (type === 'join_room') {
          const { roomCode, guestPlayer } = msg;
          const code = (roomCode || '').toUpperCase().trim();
          const room = rooms.get(code);

          if (!room) {
            ws.send(JSON.stringify({ type: 'error', message: 'Camera nu a fost găsită (Cod invalid)!' }));
            return;
          }

          if (room.guestPlayer && room.guestPlayer.id !== guestPlayer.id && room.status !== 'lobby') {
            ws.send(JSON.stringify({ type: 'error', message: 'Camera este deja plină cu 2 jucători!' }));
            return;
          }

          const guest: DuelPlayerInfo = {
            id: guestPlayer.id,
            name: guestPlayer.name || 'Jucător 2',
            avatarIcon: guestPlayer.avatarIcon || 'knight',
            color: guestPlayer.color || '#e05c3a',
            isHost: false,
            connected: true,
          };

          room.guestPlayer = guest;
          if (!room.scores[guest.id]) {
            room.scores[guest.id] = { sipsTotal: 0, chugsTotal: 0, roundsWon: 0, correct: 0, wrong: 0 };
          }

          playerSockets.set(guest.id, ws);
          socketToPlayer.set(ws, { playerId: guest.id, roomCode: code });

          broadcastToRoom(code, {
            type: 'player_joined',
            room: getSanitizedRoom(room),
            joinedPlayer: guest,
          });
        } else if (type === 'reconnect') {
          const { roomCode, playerId } = msg;
          const code = (roomCode || '').toUpperCase().trim();
          const room = rooms.get(code);

          if (!room) {
            ws.send(JSON.stringify({ type: 'error', message: 'Sesiunea a expirat sau camera nu există.' }));
            return;
          }

          if (room.hostPlayer.id === playerId) {
            room.hostPlayer.connected = true;
          } else if (room.guestPlayer && room.guestPlayer.id === playerId) {
            room.guestPlayer.connected = true;
          }

          playerSockets.set(playerId, ws);
          socketToPlayer.set(ws, { playerId, roomCode: code });

          ws.send(
            JSON.stringify({
              type: 'room_synced',
              room: getSanitizedRoom(room),
            })
          );
        } else if (type === 'start_game') {
          const { roomCode, playerId } = msg;
          const code = (roomCode || '').toUpperCase().trim();
          const room = rooms.get(code);

          if (!room || room.hostPlayer.id !== playerId) return;
          if (!room.guestPlayer) {
            ws.send(JSON.stringify({ type: 'error', message: 'Așteaptă să intre al doilea jucător!' }));
            return;
          }

          room.status = 'in_game';
          room.currentRound = 1;
          room.currentCardIndex = 0;
          room.phase = 'reveal';
          room.revealEndsAt = Date.now() + 5000;
          room.lockedOutPlayerId = null;
          room.roundResult = null;
          room.stake = calculateStake(room.difficulty);

          broadcastToRoom(code, {
            type: 'game_started',
            room: getSanitizedRoom(room),
          });
        } else if (type === 'skip_reveal') {
          const { roomCode } = msg;
          const code = (roomCode || '').toUpperCase().trim();
          const room = rooms.get(code);

          if (!room || room.status !== 'in_game' || room.phase !== 'reveal') return;

          room.phase = 'race';
          broadcastToRoom(code, {
            type: 'phase_change',
            phase: 'race',
            room: getSanitizedRoom(room),
          });
        } else if (type === 'submit_answer') {
          const { roomCode, playerId, optionIndex } = msg;
          const code = (roomCode || '').toUpperCase().trim();
          const room = rooms.get(code);

          if (!room || room.status !== 'in_game' || room.phase !== 'race') return;
          if (room.lockedOutPlayerId === playerId) return; // Player already failed this round

          const currentQ = room.deck[room.currentCardIndex % room.deck.length];
          const isCorrect = optionIndex === currentQ.correct;
          const otherPlayerId = room.hostPlayer.id === playerId ? room.guestPlayer?.id : room.hostPlayer.id;

          if (isCorrect) {
            // Player answered correctly!
            const winnerId = playerId;
            const loserId = otherPlayerId!;
            const stake = room.stake;

            // Update scores
            if (room.scores[winnerId]) {
              room.scores[winnerId].roundsWon += 1;
              room.scores[winnerId].correct += 1;
            }
            if (room.scores[loserId]) {
              if (stake.type === 'sips') {
                room.scores[loserId].sipsTotal += stake.count;
              } else {
                room.scores[loserId].chugsTotal += 1;
              }
            }

            // Check if either player reached targetPoints limit
            const hostPts = (room.scores[room.hostPlayer.id]?.sipsTotal || 0) + 25 * (room.scores[room.hostPlayer.id]?.chugsTotal || 0);
            const guestPts = room.guestPlayer ? ((room.scores[room.guestPlayer.id]?.sipsTotal || 0) + 25 * (room.scores[room.guestPlayer.id]?.chugsTotal || 0)) : 0;
            const isTargetReached = hostPts >= room.targetPoints || guestPts >= room.targetPoints;
            const targetLoserId = hostPts >= room.targetPoints ? room.hostPlayer.id : (guestPts >= room.targetPoints && room.guestPlayer ? room.guestPlayer.id : null);

            room.phase = 'resolution';
            room.roundResult = {
              winnerId,
              loserIds: [loserId],
              stakeType: stake.type,
              stakeAmount: stake.count,
              correctAnswerRo: currentQ.a_ro[currentQ.correct],
              correctAnswerEn: currentQ.a_en[currentQ.correct],
              reason: room.lockedOutPlayerId ? 'rebound_correct' : 'first_correct',
              drinkCountdownEndsAt: null,
              isTargetReached,
              targetLoserId,
            };

            broadcastToRoom(code, {
              type: 'round_resolved',
              room: getSanitizedRoom(room),
            });
          } else {
            // Player answered wrong!
            if (room.scores[playerId]) {
              room.scores[playerId].wrong += 1;
            }

            if (!room.lockedOutPlayerId) {
              // First wrong answer -> Lock this player out
              room.lockedOutPlayerId = playerId;

              broadcastToRoom(code, {
                type: 'first_wrong',
                lockedOutPlayerId: playerId,
                otherPlayerId: otherPlayerId,
                room: getSanitizedRoom(room),
              });
            } else {
              // Both players answered wrong!
              const stake = room.stake;

              // Both drink
              [room.hostPlayer.id, room.guestPlayer?.id].filter(Boolean).forEach(pId => {
                if (pId && room.scores[pId]) {
                  if (stake.type === 'sips') {
                    room.scores[pId].sipsTotal += stake.count;
                  } else {
                    room.scores[pId].chugsTotal += 1;
                  }
                }
              });

              // Check if either player reached targetPoints limit
              const hostPts = (room.scores[room.hostPlayer.id]?.sipsTotal || 0) + 25 * (room.scores[room.hostPlayer.id]?.chugsTotal || 0);
              const guestPts = room.guestPlayer ? ((room.scores[room.guestPlayer.id]?.sipsTotal || 0) + 25 * (room.scores[room.guestPlayer.id]?.chugsTotal || 0)) : 0;
              const isTargetReached = hostPts >= room.targetPoints || guestPts >= room.targetPoints;
              const targetLoserId = hostPts >= room.targetPoints ? room.hostPlayer.id : (guestPts >= room.targetPoints && room.guestPlayer ? room.guestPlayer.id : null);

              room.phase = 'resolution';
              room.roundResult = {
                winnerId: null,
                loserIds: [room.hostPlayer.id, room.guestPlayer?.id].filter(Boolean) as string[],
                stakeType: stake.type,
                stakeAmount: stake.count,
                correctAnswerRo: currentQ.a_ro[currentQ.correct],
                correctAnswerEn: currentQ.a_en[currentQ.correct],
                reason: 'both_wrong',
                drinkCountdownEndsAt: null,
                isTargetReached,
                targetLoserId,
              };

              broadcastToRoom(code, {
                type: 'round_resolved',
                room: getSanitizedRoom(room),
              });
            }
          }
        } else if (type === 'start_drink_timer') {
          const { roomCode, playerId } = msg;
          const code = (roomCode || '').toUpperCase().trim();
          const room = rooms.get(code);

          if (!room || room.status !== 'in_game' || room.phase !== 'resolution' || !room.roundResult) return;

          const res = room.roundResult;
          // Player who has to drink, or either player if both are wrong / tie
          const isAuthorized = res.winnerId === null || res.loserIds.includes(playerId) || res.winnerId !== playerId;

          if (isAuthorized) {
            res.drinkCountdownEndsAt = Date.now() + 10000;
            broadcastToRoom(code, {
              type: 'drink_timer_started',
              room: getSanitizedRoom(room),
            });
          }
        } else if (type === 'next_round') {
          const { roomCode } = msg;
          const code = (roomCode || '').toUpperCase().trim();
          const room = rooms.get(code);

          if (!room || room.status !== 'in_game') return;

          room.currentRound += 1;
          room.currentCardIndex += 1;
          room.phase = 'reveal';
          room.revealEndsAt = Date.now() + 5000;
          room.lockedOutPlayerId = null;
          room.roundResult = null;
          room.stake = calculateStake(room.difficulty);

          broadcastToRoom(code, {
            type: 'next_round_started',
            room: getSanitizedRoom(room),
          });
        } else if (type === 'end_game') {
          const { roomCode } = msg;
          const code = (roomCode || '').toUpperCase().trim();
          const room = rooms.get(code);

          if (!room) return;

          room.status = 'finished';
          broadcastToRoom(code, {
            type: 'game_ended',
            room: getSanitizedRoom(room),
          });
        }
      } catch (err) {
        console.error('Error handling WS message:', err);
      }
    });

    ws.on('close', () => {
      clearInterval(pingInterval);
      const entry = socketToPlayer.get(ws);
      if (entry) {
        const { playerId, roomCode } = entry;
        playerSockets.delete(playerId);
        socketToPlayer.delete(ws);

        const room = rooms.get(roomCode);
        if (room) {
          if (room.hostPlayer.id === playerId) {
            room.hostPlayer.connected = false;
          } else if (room.guestPlayer && room.guestPlayer.id === playerId) {
            room.guestPlayer.connected = false;
          }

          broadcastToRoom(roomCode, {
            type: 'player_disconnected',
            playerId,
            room: getSanitizedRoom(room),
          });

          // Cleanup empty room after 10 minutes
          setTimeout(() => {
            const r = rooms.get(roomCode);
            if (r && !r.hostPlayer.connected && (!r.guestPlayer || !r.guestPlayer.connected)) {
              rooms.delete(roomCode);
            }
          }, 10 * 60 * 1000);
        }
      }
    });
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Barbutul lu' Calugaru server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
