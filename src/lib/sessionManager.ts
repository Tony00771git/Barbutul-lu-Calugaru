import { GameMode } from '../types';

export interface ActiveRoomSession {
  mode: GameMode;
  roomCode: string;
  localPlayer: {
    id: string;
    name: string;
    avatarIcon: string;
    color: string;
  };
  isHost: boolean;
  extraData?: Record<string, any>;
  savedAt: number;
}

const SESSION_KEY = 'monastery_active_game_session';
const MAX_SESSION_AGE_MS = 25 * 60 * 1000; // 25 minutes session validity

/**
 * Saves the current online game room session for auto-reconnection on page refresh or temporary mobile drop.
 */
export function saveActiveSession(
  mode: GameMode,
  roomCode: string,
  localPlayer: { id: string; name: string; avatarIcon: string; color: string },
  isHost: boolean,
  extraData?: Record<string, any>
): void {
  if (!roomCode || !mode) return;
  const session: ActiveRoomSession = {
    mode,
    roomCode: roomCode.trim().toUpperCase(),
    localPlayer,
    isHost,
    extraData,
    savedAt: Date.now(),
  };

  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (e) {
    console.warn('[SessionManager] Could not save active session:', e);
  }
}

/**
 * Retrieves the currently active room session if valid.
 */
export function getActiveSession(): ActiveRoomSession | null {
  try {
    let raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) {
      raw = localStorage.getItem(SESSION_KEY);
    }
    if (!raw) return null;

    const parsed: ActiveRoomSession = JSON.parse(raw);
    if (!parsed || !parsed.roomCode || !parsed.mode) return null;

    // Check expiry
    if (Date.now() - parsed.savedAt > MAX_SESSION_AGE_MS) {
      clearActiveSession();
      return null;
    }

    return parsed;
  } catch (e) {
    return null;
  }
}

/**
 * Clears the stored session when the user intentionally leaves the game or match ends.
 */
export function clearActiveSession(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
    // Also clean up legacy mode-specific keys
    sessionStorage.removeItem('duel_room_code');
    sessionStorage.removeItem('duel_player_id');
    sessionStorage.removeItem('pineapple_room_code');
    sessionStorage.removeItem('casino_room_code');
    sessionStorage.removeItem('crash_room_code');
  } catch (e) {}
}

/**
 * Measures real-time round-trip latency to the server in milliseconds.
 */
export async function measurePing(): Promise<number> {
  const t0 = performance.now();
  try {
    // Ping public asset or head endpoint
    await fetch('/favicon.ico', { method: 'HEAD', cache: 'no-store' });
    const t1 = performance.now();
    return Math.round(t1 - t0);
  } catch (e) {
    const t1 = performance.now();
    return Math.round(t1 - t0);
  }
}
